const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {validatePost,buildHtml,imageData,prepareOut,run}=require('../scripts/render.cjs');
const example=require('../examples/post.example.json');
const clone=()=>structuredClone(example);
const temp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'xhs-skill-'));
test('illustrated interior includes embedded image, paragraph and citation',()=>{
 const root=temp();try{
  fs.copyFileSync(path.join(__dirname,'../examples/cover-reference.png'),path.join(root,'art.png'));
  const p=clone();p.pages[1]={id:'story',kind:'illustrated',title:'正文主题',image:'art.png',items:[{title:'研究发现',text:'具体结果 <b>',source_ids:['Source A']}],sources:['Author 2025']};
  const html=buildHtml(p,root);
  const story=html.split('data-page-id="story"')[1].split('</section>')[0];
  assert(story.includes('<img'));assert(story.includes('data:image/png;base64,'));assert(story.includes('具体结果 &lt;b&gt;'));assert(story.includes('Source A'));assert(story.includes('Author 2025'));
  delete p.pages[1].image;assert.throws(()=>validatePost(p),/requires a local image/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('pure-text content is escaped, Chinese preserved',()=>{
 const p=clone();p.pages[1].items[0].text='<script>alert(1)</script> & 血糖';
 const html=buildHtml(p,__dirname);
 assert(!html.includes('<script>alert'));assert(html.includes('&lt;script&gt;'));assert(html.includes('血糖'));
});
test('duplicate page IDs and unfinished drafts fail validation',()=>{
 const p=clone();p.pages[1].id=p.pages[0].id;assert.throws(()=>validatePost(p),/Duplicate/);
 const q=clone();q.pages[1].items[0].text='TODO';assert.throws(()=>validatePost(q),/Unfinished/);
});
test('image traversal and symlink escapes are rejected',()=>{
 const root=temp();const child=path.join(root,'post');fs.mkdirSync(child);fs.writeFileSync(path.join(root,'outside.png'),'not a png');
 try {
  assert.throws(()=>imageData('../outside.png',child),/escapes/);
  fs.symlinkSync(path.join(root,'outside.png'),path.join(child,'link.png'));
  assert.throws(()=>imageData('link.png',child),/escapes/);
  assert.throws(()=>imageData('https://example.com/a.png',child),/not allowed/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('output overwrite only removes manifest-owned files',()=>{
 const root=temp();try{
  fs.writeFileSync(path.join(root,'keep.txt'),'user');
  assert.throws(()=>prepareOut(root,false),/not empty/);
  assert.throws(()=>prepareOut(root,true),/manifest/);
  fs.writeFileSync(path.join(root,'index.html'),'old');
  fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({generator:'redbook-create',files:['index.html']}));
  prepareOut(root,true);assert.equal(fs.readFileSync(path.join(root,'keep.txt'),'utf8'),'user');assert(!fs.existsSync(path.join(root,'index.html')));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('HTML-only export works without browser and refuses unrelated output',async()=>{
 const root=temp();try{
  const input=path.join(root,'post.json');fs.writeFileSync(input,JSON.stringify(example));
  const out=path.join(root,'out');const result=await run({input,out,htmlOnly:true});
  assert(result.html_only);assert(fs.existsSync(path.join(out,'index.html')));assert(!fs.existsSync(path.join(out,'01.png')));
  await assert.rejects(run({input,out,htmlOnly:true}),/not empty/);
  await run({input,out,htmlOnly:true,overwrite:true});
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('custom series profile changes visible category and validates color',()=>{
 const p=clone();p.category='custom';
 const profile={categories:[{id:'custom',label:'自定义栏目',accent:'#123456',soft:'#eeeeee'}]};
 const html=buildHtml(p,__dirname,profile);assert(html.includes('自定义栏目'));assert(html.includes('--accent:#123456'));
 profile.categories[0].accent='red;display:none';assert.throws(()=>buildHtml(p,__dirname,profile),/hex/);
});
