# Skills 导航模块 · 设计文档

> 负责人：陆产（产品/schema）＋ 陈架（架构）＋ 苏屏（前端/线框）
> 日期：2026-10-16
> 战略输入：`STRATEGY-differentiation.md` —— P0 首发 Skills 导航（中文空白，Agent 时代硬通货）
> 参照实现：`new-site/modules/tools/`（表结构、路由、API 模式照抄其组织方式）
> 设计语言：`WS1-aihot-design-reverse.md`（token 体系、线框纪律、三段式页头）

## 1. 数据 schema

### 1.1 表：`skills`（迁移 `0110_skills.sql`）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | BIGSERIAL PK | 自增主键 |
| slug | TEXT UNIQUE NOT NULL | 稳定标识，进网址 `/skills/:slug`，上线后不改 |
| name | TEXT NOT NULL | 名称 |
| tagline | TEXT NOT NULL DEFAULT '' | 一句话介绍（列表卡片用，≤60 字） |
| description | TEXT NOT NULL DEFAULT '' | 详细介绍（详情页用，可空） |
| url | TEXT NOT NULL | 来源链接（官网/仓库/文档） |
| logo_url | TEXT | logo；无则首字占位（延续 tools 模式） |
| category | TEXT NOT NULL DEFAULT 'other' | **能力维度分类**（见 §2），key 进筛选网址 |
| tags | TEXT[] NOT NULL DEFAULT '{}' | 功能/场景标签 |
| pricing | TEXT NOT NULL DEFAULT 'unknown' | 定价：`free` / `freemium` / `paid` / `open_source` / `unknown`（衔接旧站 pricing 语义） |
| zh_support | BOOLEAN NOT NULL DEFAULT FALSE | 中文支持（衔接旧站 chinese_support） |
| needs_proxy | BOOLEAN NOT NULL DEFAULT FALSE | 需代理（衔接旧站 need_proxy；国内网络可达性提示） |
| score | SMALLINT | **编辑评分** 0–100，NULL=未评分。只在人工打分后展示；绝不叫"AI 评分"（WS1 §7.2） |
| ecosystem | TEXT NOT NULL DEFAULT 'community' | 生态标记：`official` 官方 / `verified` 站方精选 / `community` 社区 |
| featured | BOOLEAN NOT NULL DEFAULT FALSE | 精选（排序置顶） |
| sort | INT NOT NULL DEFAULT 0 | 同级排序 |
| created_at / updated_at | TIMESTAMPTZ DEFAULT now() | 时间戳 |

索引（每文件一条语句，`CONCURRENTLY IF NOT EXISTS`）：
- `0111`：`skills_category_idx ON skills (category)`
- `0112`：`skills_featured_idx ON skills (featured) WHERE featured`（部分索引，照抄 tools 0102）

### 1.2 与战略"共表"建议的分歧说明

战略文档曾建议"tool/skill/mcp 三类可共表，用 category 区分"。本次按**总协调人任务指令**采用独立表（`skills`），理由：
1. Skill 的能力分类体系与 tools 的工具分类语义不同（能力维度 vs 工具品类），共表会让 `category` 一词两义；
2. 独立表让各自的索引、排序、精选互不干扰，后续 skill 专属字段（如适用宿主）可独立演进；
3. 与 `modules/tools` 的组织方式完全对齐，迁移/测试/路由可整体复用模式。
后续如需跨生态统一搜索，可在读取层做 UNION 视图，不必在存储层合并。

### 1.3 API（照抄 tools 模式）

- `GET /api/skills?category=&q=&page=&limit=` → `{ items, total, page, limit, categories }`
- `GET /api/skills/:slug` → `{ skill }` / 404 `{ error: "not_found" }`
- `Cache-Control: public, max-age=300, must-revalidate`；limit 上限 100，默认 48
- sitemap：`/skills`（详情页后续由收录脚本补，见 §5）

## 2. 分类体系（能力维度，与 tools 8 分类衔接）

tools 旧站 8 分类：`ai-coding / ai-assistant / ai-image / ai-video / ai-audio / ai-search / ai-writing / ai-productivity`。
skills 按**能力维度**映射并扩展（key 稳定，进网址后不改）：

| key | 中文 | 衔接说明 |
|---|---|---|
| coding | 代码开发 | ← ai-coding |
| writing | 写作 | ← ai-writing |
| image | 图像 | ← ai-image |
| video | 视频 | ← ai-video |
| audio | 音频 | ← ai-audio |
| data | 数据分析 | 新增（Agent 高频能力） |
| search | 搜索研究 | ← ai-search |
| productivity | 办公提效 | ← ai-productivity |
| agent | 智能体编排 | 新增（多步任务/工作流类 skill） |
| other | 其他 | 兜底 |

`ai-assistant`（通用助手）不设对应分类：Skill 都是能力导向的，"通用"分类会变成杂物筐；通用型 skill 按其主要能力归类。

## 3. 页面线框

设计纪律（WS1 §5.3/§7）：kicker＋H1＋subtitle 三段式；首屏零营销横幅；卡片圆角 12px（card）；筛选 chip 高 26px 胶囊；数字等宽 tabular-nums；分割用 1px line 色；深色模式卡片阴影归零；动效 ≤320ms；`prefers-reduced-motion` 覆盖。文案全部原创。

### 3.1 列表页 `/skills`

页头文案：kicker `Skills 导航` / H1 `Agent 技能库：按能力找 Skill` / sub `收录 Agent 可复用的 Skills，按能力维度分类筛选，附中文说明与来源链接。`

```
桌面端（≥961px：左 sidebar"工具"分组下有"Skills 导航"入口）
┌────────────────────────────────────────────────────────┐
│ kicker: Skills 导航                                     │
│ H1: Agent 技能库：按能力找 Skill                        │
│ sub: 收录 Agent 可复用的 Skills…                        │
│                                                        │
│ [搜 Skill 名称或一句话介绍            ][搜索]            │  ← 搜索框 h-10
│                                                        │
│ (全部)[代码开发·12][写作·8][图像·5]…                    │  ← chips 横滑
│                                                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                  │
│ │[logo] 名  │ │[logo] 名  │ │[logo] 名  │                  │  ← 3 列卡片
│ │能力·生态  │ │能力·生态  │ │能力·生态  │                  │
│ │一句话…    │ │一句话…    │ │一句话…    │                  │
│ │免费·中文  │ │付费       │ │开源·评分82│                  │  ← 定价·中文·评分
│ │[tag][tag]  直达→│ …    │                  │
│ └──────────┘ └──────────┘ └──────────┘                  │
│                                                        │
│              [上一页]  1 / 3  [下一页]                   │
└────────────────────────────────────────────────────────┘

移动端（≤960px）：同 markup，卡片 1 列；chips 横滑；分页大按钮。
```

卡片信息层级（陆产定）：logo/首字 → 名称 → `能力分类·生态标记` → 一句话 → `定价·中文支持·需代理·编辑评分` → tags（≤3）＋ 直达 →。
生态标记用中文小字（官方/精选/社区），不做彩色 badge（克制）。

### 3.2 详情页 `/skills/:slug`

```
┌────────────────────────────────────────────────┐
│ kicker: Skills 导航                             │
│                                                │
│ [logo 64px]  名称（22px 600）                   │
│              一句话介绍（ink-3）                │
│                                                │
│ [能力分类][官方/精选/社区][免费][中文支持]       │  ← accent 底仅能力分类
│ [需代理][编辑评分 82][tag][tag]…               │     其余 bg-sunk
│                                                │
│ 详细介绍段落（14.5px，ink-2，可空则不渲染）      │
│                                                │
│ ┌──────── [ 前往来源 → ] ────────┐              │  ← h-12 accent 整宽按钮
│ └────────────────────────────────┘              │
│   链接指向 Skill 的来源页面，内容由对方提供。    │  ← 12px ink-4 免责
│                                                │
│ ─────────────────────────────────────────────  │
│ ← 返回 Skills 导航                              │
└────────────────────────────────────────────────┘
正文锁 760px 居中（WS1 阅读布局）。
```

### 3.3 空状态

居中 Quiet：标题 `没有找到匹配的 Skill` ＋ 一句 `换个关键词，或看看其他能力分类。`（无装饰图）。

## 4. 导航位置

- 桌面 sidebar："工具"分组下，`工具导航 / Skills 导航 / MCP 导航` 同组（同一用户群，延伸最顺）。
- 移动底 Tab：**暂不加**。Tab 位是整站 IA 决策（WS1 建议 热点·日报·工具·我的），skills/mcp 进 Tab 会挤占 4 Tab 格局，留待 IA 评审。
- 图标：`IconSparkles`（框架图标库已有，非 AIHOT 品牌资产）。

## 5. 后续工作（非本次范围）

1. **模块注册**（总协调人安排）：`site/modules/index.ts`、`server.ts`、`web.ts` 各加一行 ＋ `site/package.json` dependencies 加 `@aihot/skills` ＋ `npm install` 更新 lock（本次红线"不改现有模块"，未做）。
2. **种子数据**：首批 skills 收录清单与 `ecosystem` 标注规则（产品侧出）。
3. **sitemap 详情页**：收录脚本把 `/skills/:slug` 加入 sitemap（参照 tools 后续做法）。
4. **og 分享图**：`/og/pages/skills.png`（meta 已预留路径）。
5. **与 /tools 互链**：工具详情页"相关 Skill"入口（需改 tools 模块，另行排期）。
6. **日报联动**：WS5 日报管线首期行业改为 skills/mcp 生态动态后，日报内链 skill 详情页。
