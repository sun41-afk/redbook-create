# 制作、版本与导出

## 项目结构

```text
post-directory/
  post.json            可渲染页面及发布文案
  evidence.json        结论与来源
  review.json          人工内容审核
  series-profile.json  当前系列配置
  assets/              本篇生成资产
  output-v1/           HTML、PNG、预览与QA报告
```

新建：`python3 scripts/new_post.py --out PATH --title '题目' --category foundations`

模板里含待补充字段，仅用于起稿；渲染器会拒绝未填占位符。依据材料填好后再渲染。修改模板应作用于新项目，不自动覆盖已经完成的文章。

## JSON与排版

`post.example.json`展示支持的结构：cover、evidence、cards、steps、summary、illustrated。模板支持文字、数字步骤、无字插画和来源区；更复杂机制可改导出的HTML或扩展模板，保持正文为可编辑文字。

渲染器自动读取输入JSON旁的 `series-profile.json`；也可传 `--profile`。可配置栏目ID、标签、强调色与浅底色；当前脚本输出固定1080×1440，更换尺寸需同时调整版式与检查。

默认字体优先系统中文衬线与无衬线，兼容Songti SC、Noto Serif CJK SC、PingFang SC、Noto Sans CJK SC。机器缺少中文字体时安装合法字体后再导出，不能以方框乱码交付。未经许可不捆绑系统字体。

## 依赖

需要Node.js 20+、Python 3.10+，npm依赖Playwright与sharp。由当前环境提供的工具/运行时优先；桌面Codex可先查`load_workspace_dependencies`。以下为普通本地安装：

```sh
npm install
npx playwright install chromium
node scripts/render.cjs --input examples/post.example.json --out /tmp/xhs-preview
```

用已有依赖时：`NODE_PATH`可指向包含playwright/sharp的node_modules；`BROWSER_EXECUTABLE`可指向已安装Chromium，不在脚本硬编码个人路径。`PLAYWRIGHT_BROWSERS_PATH`是可选的Playwright配置。

离线只生成HTML：加`--html-only`；这不是完成PNG导出，也不证明视觉QA通过。

## 脚本约定

- 输入文字按纯文本转义，不执行内容中的HTML；图片路径仅允许项目内本地PNG/JPEG/WebP，拒绝远程URL、路径穿越和符号链接逃逸。
- 通过`--out`明确指定输出目录；非空目录默认拒绝。`--overwrite`仅覆盖本次渲染器拥有的文件，保留其他文件。
- 分页PNG为1080×1440；输出`index.html`内嵌图像，便于复制分享。
- 输出`qa.json`记录正文与页脚重叠、元素水平溢出、实际图片尺寸、中文字体测量探针。探针只是提示，仍需视觉查看。
- 自动版面检查失败时退出非零，保留预览便于修复；不要因为有文件就宣布完成。

## 视觉检查

逐页查看，至少再放大封面、证据页和最密集的一页。检查：
- 缩略图可识别主题和主标题。
- 问句及副标题无截断；字体正常，文字未贴边。
- 插画不包含错字/不必要文字，身体与器械结构合理。
- 证据页可读，正文与页脚有间距。
- 来源区可定位到结论，不假装提供了缺失的完整引用。
- 对密集页先精简或拆页，不无限缩小字体。

## 版本与交付

- 只改副标题：保留插画、其他页、引用。建立新输出目录；不要重跑图像生成。
- 改配图：更新资产和封面，保留已经接受的文案。
- 改科学结论：同时更新证据表、相关页面及摘要，再审核。
- 保留上一个版本；用户未要求时不删除历史版本。
- 打包只含成品、可编辑源文件、来源/审核状态与提示词，不含浏览器、node_modules、缓存、账号信息和整段聊天记录。
- 返回封面或总览预览、完整包和源文件位置。没有实际发布时说“可交付/已导出”，不说“已发布”。

## illustrated 页面

核心内容页优先用 illustrated：image 为项目内插画路径，image_alt 说明场景，title 为图下主题名，items 为2–3段正文，每项 title 是段首重点词、text 为具体论述。sources 放简洁引用；source_ids 也可逐段显示。插画建议3:2无字横图。样稿配图和封面使用同一画风，正文不再拆成小图标卡片。

这类页面的图与文字可分别替换；内容超高时拆页或缩短重复句。自动检查覆盖图下正文，仍需视觉检查图像和细字重的手机可读性。
