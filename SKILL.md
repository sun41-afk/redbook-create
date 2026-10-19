---
name: redbook-create
description: Create and revise evidence-based Xiaohongshu carousel notes from papers, literature-agent summaries, screenshots, or existing drafts. Includes topic-bank maintenance, evidence mapping, cover illustration, Chinese editorial review, reusable 3:4 layouts, and export QA. Use for 小红书科普笔记、选题库、文献解读图文、封面配图、内容审核 and revisions to this series.
---

# Redbook Create

把文献材料整理成有证据、有信息量、适合手机阅读的小红书图文。默认使用中文内容与英文文件/技能标识；以用户当前受众、栏目和审美偏好为准。本包的默认实例为「血糖管理笔记」，不是医疗诊断工具。

## 选择工作流

先识别本次任务与已有成品，只读取需要的参考文件。请求“做一篇”时完成从素材到导出的全流程；请求改标题、配图或某一页时只修改相关部分。

| 请求 | 读取 | 产物 |
|---|---|---|
| 建立、增加、安排选题 | [topics.md](references/topics.md) | 选题库及候选排期 |
| 将论文、截图、agent整理做成笔记 | [evidence.md](references/evidence.md)、[editorial.md](references/editorial.md) | 证据表、逐页文案 |
| 一张截图直接生成整篇 | [screenshot-to-note.md](references/screenshot-to-note.md) | 素材提取、完整图文、选题记录 |
| 同一内容改编其他平台 | [platforms.md](references/platforms.md) | 按平台重组的内容稿 |
| 制作或调整封面 | [covers.md](references/covers.md) | 无字插画、封面图、生成提示词 |
| 审核现有内容 | [review.md](references/review.md) | 具体问题、修订文案、审核记录 |
| 排版、导出、检查 | [production.md](references/production.md) | HTML、逐页PNG、预览、文案、QA报告 |
| 修改已有版本 | [production.md](references/production.md) 的版本规则 | 新版本及简短修改记录 |

默认设计与用户偏好在 [series-profile.json](templates/series-profile.json)。初次使用复制到项目中；不要把本包选题库当成用户已有的动态记录。

个人选题库独立于技能目录保存。用户已要求长期维护时，每次新稿自动登记选题与实际阶段；重复主题关联已有记录。不要把私有素材、草稿和数据推入公开技能仓库。

## 重要约定

- 首先做用户要的健康科普。除非用户要求，正文与封面不插入App、硬件推广、销售漏斗或开发进度。
- 用户提供的截图与文献agent整理可作为编辑底稿。保留来源状态，不能把二次整理伪称为已逐篇核验的原始研究。只对会改变核心结论的冲突或缺失信息做针对性核验。
- 主标题可用简短问句；副标题给具体场景与继续阅读的理由。内页标题使用明确主题名，例如「证据强度」「皮肤表现」，减少泛化问句和口号。
- 内容以原材料的有效信息为主：对象、样本量、干预/观察、结果、机制和局限。删除反复出现的“不代表／不等于”式提醒；把必要边界写在相关结论中或末页一处。保留与证据相称的“相关”“可能”，不为传播改成确定因果。
- 读者页面不放内部制作说明，例如“以上按原文献整理标签列示，完整书目信息见原文献库”。内部来源状态写入 evidence.json，页面直接显示对应引用。信息量靠研究细节和机制解释增加，避免只列名词。
- 四栏目只需在封面右上角标注。不同文章用不同主题场景插画；颜色是辅助标识，不能用仅换颜色的同一针筒/设备图代替主题差异。
- 核心讲解页默认采用上图下文：主图约占整页三分之一，下方为主题标题及2–3段详细论述；症状名称和具体形态用更大字号，研究细节保持细字重。沿用封面动画画风，正文用较细字重；证据总览页仍以表格为主。避免小图标卡片铺满全页；需要辨识细节时，可在主图内加入1–2个有名称的局部放大图。
- 封面插画内部无字。标题、标签与副标题用可编辑排版生成，避免图像模型把长中文画坏。
- 3:4、1080×1440为默认输出，页数按内容调整，常用6–9页；8页是实例，不是硬性规则。
- 引用能追溯到具体结论；不补造题名、DOI、年份或证据等级。原创定性分级需记录方法；引用外部分级需标注出处。
- 生成可交付文件后检查手机缩略图、中文字体、遮挡、溢出和引用。不要用“未报错”代替看图。

## 完整笔记的默认路径

1. 从当前材料提取：受众、栏目、主题、核心问题、已确定措辞、配图偏好、来源状况。信息够用即继续，避免重复确认已经选定的风格。
2. 建立 `evidence.json`：逐条结论与来源、研究设计、适用人群、核验状态对应。若原文与标题冲突，先修结论，再排版。
3. 用「封面 → 证据强度/研究概况 → 每主题一页 → 重点整理」形成页面。来源不足以分级时，第2页用「研究概况」。
4. 起草封面问句与场景副标题；插画采用统一动画风格，内容随选题变化。详细提示词见封面参考。
5. 审核科学表述与中文编辑风格，再生成图像及排版。用户明确要求先看视觉草稿时，可先出封面草图，标记待核验结论。
6. 导出、视觉检查、修复；交付逐页图、整套预览、发布文案、来源状态、可编辑源文件及生成提示词。
7. 用户要求维护选题库时，更新对应状态与输出路径。公开发布或发到外部平台须有本次或此前的明确授权；生成图片本身不代表授权发布。

## 自带资源与执行

- [topic-bank.csv](assets/topic-bank.csv)：四栏目32个种子选题，均为研究问题，尚待检索；不含预设研究结论。
- [post.example.json](examples/post.example.json)：可渲染的中性结构示例，不是医学证据样本。
- [cover-reference.png](examples/cover-reference.png)：本系列已接受的动画插画＋问句标题样式；为设计参考，不是可重复套用的唯一画面。
- [evidence.template.json](templates/evidence.template.json)、[review.template.json](templates/review.template.json)：来源映射与审核记录。
- `scripts/new_post.py`：建立独立的笔记项目，复制模板；拒绝覆盖已有目录。
- `scripts/init_library.py`：建立独立个人选题库。`new_post.py --source FILE` 可将单张截图随项目归档；截图解读与内容生成由调用本技能的智能体完成。
- `scripts/render.cjs`：验证JSON、生成HTML、逐页PNG与总览图，输出版面检查报告。依赖与参数见生产参考。
- `scripts/check_bundle.py`：检查本包必需文件、引用路径、JSON、选题库和本地绝对路径泄漏。

本包无自动发帖、私信或发布GitHub的脚本。发布权限不随skill安装自动授予。
