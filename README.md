# Redbook Create

**一张内容截图 → 一篇完整笔记 → 持续积累的个人选题库。**

A reusable Codex skill for evidence-based Xiaohongshu carousels. Chinese editorial workflows, a topic library, illustration direction, source review, and a portable 3:4 renderer.

![Accepted cover style](examples/cover-reference.png)

## 能做什么

- **选题库**：四栏目32个种子选题，支持去重、证据状态与制作阶段管理。
- **文献整理**：接收原论文、截图或文献agent总结，把结论与来源逐条对应。
- **内容编辑**：封面问句＋场景副标题；内页使用“证据强度”等直接标题。
- **封面插画**：统一二维动画风格，根据主题切换身体、饮食、运动、睡眠和监测场景。
- **内容审核**：检查人群、数字、因果、来源、中文风格与图像含义。
- **生产导出**：可编辑HTML、1080×1440逐页PNG、整套预览、发布文案、自动版面QA。
- **定向修改**：只改副标题时保留配图与其他页，不必重新制作整篇。

默认系列为「血糖管理笔记」，四栏目是 **基础认知／饮食运动／行为管理／指标监测**。配置可调整，框架也适用于其他有证据来源的科普主题。这里的选题是待研究问题，不是预设医学结论。

## 安装为 Codex skill

将本仓库放入技能目录，文件夹内直接包含 `SKILL.md`：

```sh
git clone https://github.com/sun41-afk/redbook-create.git "${CODEX_HOME:-$HOME/.codex}/skills/redbook-create"
```

已有同名技能时先检查并保留自己的修改，不要覆盖。重新打开或刷新技能列表后，可使用 `$redbook-create`。安装不会自动发布笔记、发送消息或上传用户材料。

## 持续沉淀自己的内容库

技能是可升级的制作工具，个人内容库存放你的素材、选题、草稿和成品，两者独立。先建立一次：

```sh
python3 scripts/init_library.py --out /path/to/my-redbook-library
```

之后可以只附一张截图并说：

> 使用 $redbook-create，把这张内容截图做成完整笔记，沿用我的内容库 /path/to/my-redbook-library，补足研究细节和机制，完成后更新选题库。

智能体会完成读图、证据整理、逐页编辑、封面配图、审核与导出。脚本负责项目管理与排版，不单独执行OCR或替代智能体。图库和引用不会凭空补全。个人内容库不会随技能更新覆盖，也不会自动上传GitHub。

也可先归档输入：

```sh
python3 scripts/new_post.py --out /path/to/my-redbook-library/posts/topic-001 --title '本篇问题？' --source /path/to/screenshot.png
```

从旧名称迁移时，保存旧安装目录的自定义修改，安装新名称后合并需要的配置；个人库继续使用原路径，无需重建。旧版本排版manifest仍可由新渲染器读取。

## 示例调用

```text
使用 $redbook-create，依据这张文献整理截图做一篇笔记。
按“血糖管理笔记”的风格，封面用问句和动画插画，第二页做证据强度，后面每个主题一页。
```

```text
使用 $redbook-create，给“行为管理”栏目增加10个不重复的选题。
只维护选题库，先不要做图，也不要预设研究结论。
```

```text
使用 $redbook-create，审核这篇现有图文。
多保留原材料信息，删掉重复的“不代表／不等于”，但保留必要的证据限定。
```

```text
使用 $redbook-create，只修改封面副标题，其余页和插画保留，导出新版本。
```

## 工作流

| 阶段 | 输入 | 输出 |
|---|---|---|
| 选题 | 受众、栏目、既有主题 | topic-bank.csv |
| 证据 | 论文、截图、整理材料 | evidence.json |
| 编辑 | 证据与用户问题 | post.json |
| 配图 | 场景、已接受画风 | 本地插画＋提示词 |
| 审核 | 文案、来源、配图 | review.json |
| 导出 | 审核后页面 | HTML、PNG、preview.png、qa.json |

Skill根据请求选择工作流，不强制每次完整重跑。审核状态与自动版面检查是两回事。

## 可选：独立运行排版工具

Skill文本本身不依赖Node。以下依赖仅用于自带渲染器：Node.js 20+、Python 3.10+、Playwright、sharp，以及中文字体和Chromium。

```sh
npm install
npx playwright install chromium
python3 scripts/new_post.py --out /tmp/my-xhs-note --title '胰岛素抵抗有哪些表现？' --category foundations
```

编辑生成的 `post.json`，填好TODO，放入真实封面插画后运行：

```sh
node scripts/render.cjs --input /tmp/my-xhs-note/post.json --out /tmp/my-xhs-note/output-v1
```

也可以先运行无医学结论的结构示例：

```sh
node scripts/render.cjs --input examples/post.example.json --out /tmp/xhs-demo
```

已有浏览器时设置 `BROWSER_EXECUTABLE`；已有共享依赖时可设置 `NODE_PATH`。只需HTML可加 `--html-only`，但此模式不生成图片或完成视觉检查。完整参数及检查说明见 [production.md](references/production.md)。

输出目录默认拒绝覆盖；`--overwrite`只覆盖该渲染器manifest记录的文件。普通用户文件不会被清空。输入文本会转义，图片只支持项目内本地PNG/JPEG/WebP；不请求外网图片。

## 包结构

```text
SKILL.md                  技能入口与工作流路由
agents/openai.yaml        Codex显示信息
references/               选题、证据、编辑、封面、审核、制作
assets/topic-bank.csv     32个种子选题
templates/                系列、图文、证据与审核模板
scripts/                  个人库初始化、新建项目、渲染、结构检查
examples/                 已接受封面风格与中性结构示例
tests/                    输入、文件安全与工作区行为测试
```

## 验证

```sh
node --test tests/*.test.cjs
python3 -m unittest discover -s tests -p 'test_*.py'
python3 scripts/check_bundle.py
```

浏览器导出另做实际运行，检查 `qa.json` 后还须看实际页面。此包不能自动验证医学结论，也不会把二次总结标为已核验原文。

## 素材与范围

封面示例使用AI生成插画和可编辑文字排版，展示已接受的视觉风格。它不是证据分级示范或医学诊断示例。未包含私人健康数据、用户聊天记录、第三方截图或原始论文全文。使用自己提供的第三方图像时，应单独确认授权。

MIT licensed. See [LICENSE](LICENSE).
