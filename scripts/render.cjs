#!/usr/bin/env node
'use strict';
// Pure-text JSON -> portable HTML -> 3:4 PNGs. No network content is loaded.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const crypto = require('node:crypto');
const CATEGORIES = {
  foundations: ['基础认知', '#32634b', '#eaf1eb'],
  'food-movement': ['饮食运动', '#ae612e', '#f7eee4'],
  behavior: ['行为管理', '#67518e', '#f0ecf6'],
  monitoring: ['指标监测', '#315e97', '#eaf0f7']
};
function categoryMap(profile) {
  if (!profile) return CATEGORIES;
  assert(Array.isArray(profile.categories) && profile.categories.length > 0, 'Profile needs categories');
  const map = Object.create(null);
  for (const c of profile.categories) {
    assert(typeof c.id === 'string' && /^[a-z][a-z0-9-]*$/.test(c.id) && !Object.hasOwn(map,c.id), 'Invalid or duplicate category id');
    assert(typeof c.label === 'string' && c.label.trim(), 'Category label required');
    assert(/^#[0-9a-fA-F]{6}$/.test(c.accent), 'Accent must be a six-digit hex color');
    if (c.soft !== undefined) assert(/^#[0-9a-fA-F]{6}$/.test(c.soft), 'Soft color must be hex');
    map[c.id] = [c.label,c.accent,c.soft || CATEGORIES[c.id]?.[2] || '#f0f3ef'];
  }
  return map;
}
const KINDS = new Set(['cover', 'evidence', 'cards', 'steps', 'summary', 'illustrated']);
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text = x => esc(x).replace(/\r?\n/g, '<br>');
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
function validatePost(post, profile) {
  assert(post && post.schema_version === 1, 'schema_version must be 1');
  assert(Object.hasOwn(categoryMap(profile), post.category), 'Unknown category');
  for (const key of ['series', 'issue', 'title']) assert(typeof post[key] === 'string' && post[key].trim(), `Missing ${key}`);
  assert(Array.isArray(post.pages) && post.pages.length >= 2 && post.pages.length <= 20, 'Expected 2–20 pages');
  assert(post.pages[0].kind === 'cover', 'First page must be cover');
  const ids = new Set();
  for (const [i, p] of post.pages.entries()) {
    assert(typeof p.id === 'string' && /^[a-z0-9-]+$/.test(p.id), `Invalid page id at ${i}`);
    assert(!ids.has(p.id), `Duplicate page id: ${p.id}`); ids.add(p.id);
    assert(KINDS.has(p.kind), `Unknown page kind: ${p.kind}`);
    assert(i === 0 || p.kind !== 'cover', 'Only first page can be cover');
    assert(typeof p.title === 'string' && p.title.trim(), `Missing page title: ${p.id}`);
    if (p.kind === 'illustrated') assert(typeof p.image === 'string' && p.image.trim(), 'Illustrated page requires a local image');
    if (p.image_labels !== undefined) {
      assert(p.kind === 'illustrated' && Array.isArray(p.image_labels), 'Image labels require an illustrated page');
      for (const label of p.image_labels) assert(typeof label.text === 'string' && [label.x,label.y].every(n=>Number.isFinite(n) && n>=0 && n<=100), 'Invalid image label');
    }
    if (p.kind !== 'cover') {
      assert(Array.isArray(p.items) && p.items.length > 0 && p.items.length <= 6, `Expected 1–6 items: ${p.id}`);
      for (const item of p.items) {
        assert(typeof item.title === 'string' && item.title.trim(), `Missing item title: ${p.id}`);
        if (item.text !== undefined) assert(typeof item.text === 'string', 'Item text must be a string');
        if (item.lead !== undefined) assert(typeof item.lead === 'string', 'Item lead must be a string');
        if (item.evidence_bars !== undefined) {
          const b = item.evidence_bars;
          assert(p.kind === 'evidence' && ['strong','moderate','weak'].includes(b.level) && Number.isInteger(b.total) && b.total >= 1 && b.total <= 20 && Number.isInteger(b.filled) && b.filled >= 0 && b.filled <= b.total, 'Invalid evidence bars');
        }
        if (item.source_ids !== undefined) assert(Array.isArray(item.source_ids) && item.source_ids.every(x => typeof x === 'string'), 'source_ids must be strings');
      }
    } else {
      assert(p.image || p.art === 'editorial', 'Cover requires a local image or explicit demo art');
    }
    if (p.sources !== undefined) assert(Array.isArray(p.sources) && p.sources.every(x => typeof x === 'string'), 'sources must be strings');
  }
  assert(!/\bTODO\b|\bTBD\b|待填写/.test(JSON.stringify(post)), 'Unfinished placeholders found');
  return post;
}
function imageData(file, inputDir) {
  assert(typeof file === 'string' && !path.isAbsolute(file), 'Image path must be relative');
  assert(!/^[a-z][a-z0-9+.-]*:/i.test(file), 'Remote or data image URL is not allowed');
  const root = fs.realpathSync(inputDir);
  const full = fs.realpathSync(path.resolve(root, file));
  const relative = path.relative(root, full);
  assert(relative && !relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative), 'Image escapes input directory');
  const ext = path.extname(full).toLowerCase();
  const mime = {'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'}[ext];
  assert(mime, 'Only PNG/JPEG/WebP image files are allowed');
  const stat = fs.statSync(full);
  assert(stat.isFile() && stat.size <= 25 * 1024 * 1024, 'Image must be a file <=25MB');
  return `data:${mime};base64,${fs.readFileSync(full).toString('base64')}`;
}
function demoArt() {
  return `<svg role="img" aria-label="Editorial layout demonstration" viewBox="0 0 1080 640" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="640" fill="#f4eee2"/><circle cx="795" cy="190" r="115" fill="#edc88d"/><path d="M70 510Q260 370 430 510T980 460V640H70Z" fill="#c6d7c9"/><g transform="translate(270 85) rotate(-8 260 240)"><rect x="0" y="0" width="510" height="475" rx="18" fill="#fff" stroke="#335d4e" stroke-width="6"/><rect x="48" y="52" width="260" height="22" rx="10" fill="#335d4e"/><path d="M48 124H450M48 173H410M48 222H440" stroke="#b9c9be" stroke-width="12"/><rect x="48" y="280" width="176" height="135" fill="#e9f0ea"/><path d="M260 304h180m-180 45h140m-140 45h170" stroke="#ae7c47" stroke-width="12"/></g></svg>`;
}
function evidenceMark(item) {
  if (!item.evidence_bars) return item.label ? `<span class="item-label">${text(item.label)}</span>` : '';
  const b=item.evidence_bars;
  return `<div class="evidence-mark ${b.level}"><span class="evidence-bars" aria-hidden="true">${Array.from({length:b.total},(_,i)=>`<i class="${i<b.filled?'filled':''}"></i>`).join('')}</span><span>${text(item.label || {strong:'强',moderate:'中等',weak:'弱'}[b.level])}</span></div>`;
}
function buildHtml(post, inputDir, profile) {
  validatePost(post, profile);
  const [label, accent, soft] = categoryMap(profile)[post.category];
  const pages = post.pages.map((p, i) => {
    const head = `<header><span>${text(post.series)} <b>｜${text(post.issue)}</b></span><span class="tag">${esc(label)}</span></header>`;
    let body;
    if (p.kind === 'cover') {
      const art = p.image ? `<img alt="${esc(p.image_alt || '主题插画')}" src="${imageData(p.image, inputDir)}">` : demoArt();
      body = `<main class="cover"><div class="art">${art}</div><div class="covercopy"><h1>${text(p.title)}</h1><p class="subtitle">${text(p.subtitle || '')}</p>${p.art === 'editorial' && !p.image ? '<div class="demo-label">排版结构示例</div>' : ''}</div></main>`;
    } else if (p.kind === 'illustrated') {
      const paragraphs = p.items.map(item => `<article>${p.layout === 'compact' ? `<h2>${text(item.title)}</h2>${item.lead ? `<p class="symptom-lead">${text(item.lead)}</p>` : ''}${item.text ? `<p>${text(item.text)}</p>` : ''}` : `<p><strong>${text(item.title)}</strong>${item.text ? `　${text(item.text)}` : ''}</p>`}${item.source_ids?.length ? `<div class="item-source">${item.source_ids.map(esc).join(' · ')}</div>` : ''}</article>`).join('');
      const labels = (p.image_labels || []).map(label=>`<span class="image-label" style="left:${label.x}%;top:${label.y}%">${text(label.text)}</span>`).join('');
      body = `<main class="illustrated ${p.layout === 'compact' ? 'compact-story' : ''}"><div class="story-art"><img alt="${esc(p.image_alt || '主题场景插画')}" src="${imageData(p.image,inputDir)}">${labels}</div><div class="story-copy"><h1>${text(p.title)}</h1><div class="story-paragraphs">${paragraphs}</div>${p.note ? `<p class="story-note">${text(p.note)}</p>` : ''}</div></main>`;
    } else {
      const cards = p.items.map((item, j) => `<article>${p.kind === 'steps' || p.kind === 'summary' ? `<div class="number">${String(j + 1).padStart(2, '0')}</div>` : ''}<div class="item-body">${evidenceMark(item)}<h2>${text(item.title)}</h2>${item.text ? `<p>${text(item.text)}</p>` : ''}${item.source_ids?.length ? `<div class="item-source">${item.source_ids.map(esc).join(' · ')}</div>` : ''}</div></article>`).join('');
      const legend = p.kind === 'evidence' && p.evidence_legend ? '<div class="evidence-legend"><span class="strong"><i></i>强</span><span class="moderate"><i></i>中等</span><span class="weak"><i></i>弱</span></div>' : '';
      body = `<main class="body"><h1>${text(p.title)}</h1>${p.subtitle ? `<p class="subtitle">${text(p.subtitle)}</p>` : ''}<div class="items ${p.kind}">${cards}</div>${legend}${p.note ? `<div class="note">${text(p.note)}</div>` : ''}</main>`;
    }
    return `<section class="page" id="page-${i + 1}" data-page-id="${esc(p.id)}">${head}${body}<aside class="sources">${(p.sources || []).map(text).join('<br>')}</aside><footer><span>${text(post.series)} · ${esc(label)}</span><span>${String(i + 1).padStart(2,'0')} / ${String(post.pages.length).padStart(2,'0')}</span></footer></section>`;
  }).join('\n');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(post.title)}</title><style>
*{box-sizing:border-box}body{margin:0;background:#dfe4de;color:#18221c;font-family:'PingFang SC','Noto Sans CJK SC','Microsoft YaHei',sans-serif;-webkit-font-smoothing:antialiased;--accent:${accent};--soft:${soft}}
.page{width:1080px;height:1440px;background:white;position:relative;margin:20px auto;overflow:hidden}header{position:absolute;top:48px;left:70px;right:70px;display:flex;justify-content:space-between;align-items:center;font-size:25px;color:#46584b}header b{font-weight:400;color:#78897b}.tag{font-size:22px;padding:7px 18px;background:var(--soft);color:var(--accent);border-radius:3px}
h1{font-family:'Songti SC','Noto Serif CJK SC','SimSun',serif;font-weight:900;font-size:68px;line-height:1.28;margin:0;letter-spacing:-1px;overflow-wrap:anywhere}h2{font-size:34px;line-height:1.5;margin:0 0 12px}p{font-size:28px;line-height:1.7;color:#56665a;margin:0;overflow-wrap:anywhere}.body{position:absolute;top:160px;left:70px;right:70px}.subtitle{font-size:27px;margin-top:25px;margin-bottom:40px;line-height:1.65;color:#6b776e}.items article{min-width:0}.evidence article{border-top:1px solid #d5ddd5;padding:27px 0 30px}.item-label{display:inline-block;font-size:21px;padding:6px 13px;background:var(--soft);color:var(--accent);margin-bottom:16px}.item-source{font-size:21px;line-height:1.5;color:#76837a;margin-top:17px}.cards{display:grid;grid-template-columns:1fr 1fr;gap:24px}.cards article{padding:34px;background:var(--soft);min-height:260px}.steps article,.summary article{display:flex;gap:28px;align-items:flex-start;padding:30px;border-top:1px solid #d5ddd5;margin-bottom:22px}.steps article{background:var(--soft);border:0}.number{font-family:Georgia,serif;font-size:42px;color:var(--accent);flex:0 0 65px}.item-body{min-width:0}.note{border-left:5px solid var(--accent);background:var(--soft);padding:25px 28px;font-size:26px;line-height:1.7;margin-top:30px;overflow-wrap:anywhere}.art{position:absolute;top:123px;left:0;width:1080px;height:720px;background:var(--soft)}.art img,.art svg{display:block;width:100%;height:100%;object-fit:contain}.covercopy{position:absolute;top:888px;left:70px;right:70px}.covercopy h1{font-size:80px;line-height:1.25}.covercopy .subtitle{border-left:5px solid var(--accent);padding-left:25px;font-family:'Songti SC','Noto Serif CJK SC','SimSun',serif;font-size:32px;font-weight:600;line-height:1.65;margin-top:35px;margin-bottom:0}.demo-label{font-size:20px;color:#78887c;margin-top:18px}.sources{position:absolute;bottom:116px;left:70px;right:70px;font-size:20px;line-height:1.5;color:#7b877f;overflow-wrap:anywhere}footer{position:absolute;bottom:46px;left:70px;right:70px;border-top:2px solid #b6c0b8;padding-top:20px;display:flex;justify-content:space-between;font-size:20px;color:#6e7d72}@media print{body{background:#fff}.page{margin:0;break-after:page}}
.story-art{position:absolute;top:120px;left:70px;width:940px;height:626px}.story-art img{display:block;width:100%;height:100%;object-fit:contain}.story-copy{position:absolute;top:780px;left:70px;right:70px}.story-copy h1{font-size:60px;font-weight:600;line-height:1.25;letter-spacing:0}.story-paragraphs{margin-top:25px}.story-paragraphs article+article{margin-top:16px}.story-paragraphs p{font-size:28px;line-height:1.65;font-weight:300;color:#38453e}.story-paragraphs strong{font-weight:500;color:#254d41}.story-note{font-size:23px;line-height:1.6;margin-top:16px}
.compact-story .story-art{height:470px}.compact-story .story-art img{object-fit:cover}.compact-story .story-copy{top:628px}.compact-story .story-paragraphs{margin-top:26px}.compact-story .story-paragraphs article+article{margin-top:20px}.compact-story .story-paragraphs h2{font-size:35px;line-height:1.35;font-weight:500;color:#254d41;margin:0 0 6px}.compact-story .story-paragraphs .symptom-lead{font-size:32px;line-height:1.5;font-weight:400;color:#263d32;margin-bottom:4px}.image-label{position:absolute;transform:translate(-50%,-50%);font-size:23px;line-height:1.3;white-space:nowrap;background:#fff8e9;color:#493f31;border:1px solid #dfc69e;border-radius:4px;padding:4px 12px}
.strong{--evidence-color:#28b99a}.moderate{--evidence-color:#efbc00}.weak{--evidence-color:#df665d}.evidence-mark{display:flex;align-items:center;gap:22px;margin-bottom:18px;font-size:24px;color:#536159}.evidence-bars{display:flex;gap:5px}.evidence-bars i{display:block;width:10px;height:32px;border-radius:5px;background:#dadddf}.evidence-bars i.filled{background:var(--evidence-color)}.evidence-legend{display:flex;gap:32px;align-items:center;border-top:1px solid #d5ddd5;margin-top:16px;padding-top:22px;font-size:22px;color:#65716a}.evidence-legend span{display:flex;gap:10px;align-items:center}.evidence-legend i{display:block;width:11px;height:23px;border-radius:5px;background:var(--evidence-color)}
</style></head><body>${pages}</body></html>`;
}
function prepareOut(dir, overwrite) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive:true});
  const entries = fs.readdirSync(dir);
  if (!entries.length) return;
  assert(overwrite, 'Output directory is not empty; choose a new version or pass --overwrite');
  const manifestPath = path.join(dir, 'manifest.json');
  assert(fs.existsSync(manifestPath), '--overwrite requires a prior renderer manifest');
  const old = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(['redbook-create', 'xiaohongshu-evidence-studio'].includes(old.generator) && Array.isArray(old.files), 'Invalid renderer manifest');
  for (const name of old.files) {
    assert(typeof name === 'string' && /^(?:index\.html|caption\.txt|qa\.json|preview\.png|\d{2}\.png)$/.test(name), 'Unsafe manifest filename');
    const f = path.join(dir, name);
    if (fs.existsSync(f)) {
      assert(fs.lstatSync(f).isFile() && !fs.lstatSync(f).isSymbolicLink(), 'Refusing to overwrite non-file output');
      fs.unlinkSync(f);
    }
  }
  fs.unlinkSync(manifestPath);
}
async function run(opts) {
  const input = path.resolve(opts.input), out = path.resolve(opts.out);
  assert(!fs.existsSync(out) || !fs.lstatSync(out).isSymbolicLink(), 'Output directory cannot be a symlink');
  const profilePath = opts.profile || path.join(path.dirname(input),'series-profile.json');
  const profile = fs.existsSync(profilePath) ? JSON.parse(fs.readFileSync(profilePath,'utf8')) : undefined;
  if (opts.profile) assert(profile, 'Profile file not found');
  const post = validatePost(JSON.parse(fs.readFileSync(input, 'utf8')),profile);
  const html = buildHtml(post, path.dirname(input),profile);
  prepareOut(out, opts.overwrite);
  const owned = ['index.html'];
  const hasCaption = typeof post.caption === 'string' && post.caption.trim().length > 0;
  if (hasCaption) owned.push('caption.txt');
  const reserve = name => {
    assert(!fs.existsSync(path.join(out,name)), `Output collides with an unowned file: ${name}`);
    owned.push(name); return path.join(out,name);
  };
  for (const name of owned) assert(!fs.existsSync(path.join(out,name)), `Unowned file collision: ${name}`);
  fs.writeFileSync(path.join(out,'index.html'),html);
  if (hasCaption) fs.writeFileSync(path.join(out,'caption.txt'),`${post.title}\n\n${post.caption}\n`);
  const manifest = () => fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({generator:'redbook-create',input_sha256:crypto.createHash('sha256').update(fs.readFileSync(input)).digest('hex'),files:owned},null,2));
  manifest();
  if (opts.htmlOnly) return {html_only:true,out};
  let chromium, sharp;
  try { ({chromium}=require('playwright')); sharp=require('sharp'); }
  catch { throw new Error('Install playwright and sharp with npm install, or use --html-only.'); }
  let browser;
  const checks=[];
  try {
    browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {})});
    const page=await browser.newPage({viewport:{width:1200,height:1600},deviceScaleFactor:1});
    await page.route(/^https?:\/\//, route => route.abort());
    await page.goto(pathToFileURL(path.join(out,'index.html')).href);
    await page.evaluate(()=>document.fonts.ready);
    for (let i=1;i<=post.pages.length;i++) {
      const el=page.locator('#page-'+i);
      checks.push(await el.evaluate(el=>{
        const root=el.getBoundingClientRect();
        const content=el.querySelector('.covercopy') || el.querySelector('.story-copy') || el.querySelector('.body');
        const contentBottom=content.getBoundingClientRect().bottom-root.top;
        const sources=el.querySelector('.sources').getBoundingClientRect();
        const footer=el.querySelector('footer').getBoundingClientRect();
        const boundary=(sources.height ? sources.top : footer.top)-root.top-16;
        const horizontal=[...el.querySelectorAll('h1,h2,p,.note,.sources,header,footer')].filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.tagName);
        const images=[...el.querySelectorAll('img')].every(n=>n.complete && n.naturalWidth>0);
        const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
        ctx.font='32px "Noto Sans CJK SC", "PingFang SC", sans-serif';
        return {page_id:el.dataset.pageId,content_bottom:contentBottom,boundary,overlap:contentBottom>boundary,horizontal_overflow:horizontal,images_loaded:images,cjk_probe_width:ctx.measureText('血糖管理笔记').width,manual_font_check_required:true};
      }));
      const png=reserve(String(i).padStart(2,'0')+'.png');manifest();await el.screenshot({path:png});
    }
  } finally { if(browser) await browser.close(); manifest(); }
  const cols=Math.min(4,post.pages.length), rows=Math.ceil(post.pages.length/cols);
  const composite=[];
  for(let i=0;i<post.pages.length;i++) {
    const f=path.join(out,String(i+1).padStart(2,'0')+'.png');
    const meta=await sharp(f).metadata();
    checks[i].width=meta.width;checks[i].height=meta.height;
    composite.push({input:await sharp(f).resize(270,360).toBuffer(),left:20+(i%cols)*290,top:20+Math.floor(i/cols)*380});
  }
  await sharp({create:{width:cols*290+20,height:rows*380+20,channels:3,background:'#e1e5de'}}).composite(composite).png().toFile(reserve('preview.png'));
  const passed=checks.every(c=>!c.overlap&&!c.horizontal_overflow.length&&c.images_loaded&&c.width===1080&&c.height===1440);
  fs.writeFileSync(reserve('qa.json'),JSON.stringify({automated_layout_passed:passed,visual_review:'required',scientific_review:'not_performed_by_renderer',pages:checks},null,2));manifest();
  assert(passed,'Layout QA failed; inspect qa.json and images, edit or split dense pages.');
  return {out,pages:post.pages.length,automated_layout_passed:true,visual_review:'required'};
}
function parseArgs(argv) {
  const opts={};
  for(let i=0;i<argv.length;i++) {
    const arg=argv[i];
    if(arg==='--html-only') opts.htmlOnly=true;
    else if(arg==='--overwrite') opts.overwrite=true;
    else if(arg==='--input'||arg==='--out'||arg==='--profile') {assert(argv[i+1]&&!argv[i+1].startsWith('--'),`Missing value: ${arg}`);opts[arg.slice(2)]=argv[++i];}
    else throw new Error('Unknown argument: '+arg);
  }
  assert(opts.input&&opts.out,'Usage: node scripts/render.cjs --input post.json --out output-v1 [--profile series-profile.json] [--html-only] [--overwrite]');
  return opts;
}
if(require.main===module) run(parseArgs(process.argv.slice(2))).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={validatePost,imageData,buildHtml,prepareOut,run,parseArgs};
