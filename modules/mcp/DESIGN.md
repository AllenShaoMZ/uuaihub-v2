# MCP 导航模块 · 设计文档

> 负责人：陆产（产品/schema）＋ 陈架（架构）＋ 苏屏（前端/线框）
> 日期：2026-10-16
> 战略输入：`STRATEGY-differentiation.md` —— P0 首发 MCP 导航（中文空白，Agent 时代硬通货）
> 参照实现：`new-site/modules/tools/`（表结构、路由、API 模式照抄其组织方式）
> 设计语言：`WS1-aihot-design-reverse.md`（token 体系、线框纪律、三段式页头）

## 1. 数据 schema

### 1.1 表：`mcp_servers`（迁移 `0120_mcp.sql`）

与 `skills` 表字段完全对齐（同为"可安装的 Agent 能力"），唯一差异在 `category` 语义：

| 字段 | 类型 | 说明 |
|---|---|---|
| id | BIGSERIAL PK | 自增主键 |
| slug | TEXT UNIQUE NOT NULL | 稳定标识，进网址 `/mcp/:slug`，上线后不改 |
| name | TEXT NOT NULL | 服务名称 |
| tagline | TEXT NOT NULL DEFAULT '' | 一句话介绍（列表卡片用） |
| description | TEXT NOT NULL DEFAULT '' | 详细介绍（详情页用，可空） |
| url | TEXT NOT NULL | 来源链接（官网/仓库/文档） |
| logo_url | TEXT | logo；无则首字占位 |
| category | TEXT NOT NULL DEFAULT 'other' | **Server 接入类型**（见 §2），key 进筛选网址 |
| tags | TEXT[] NOT NULL DEFAULT '{}' | **功能维度**标签（数据库/文件/搜索/浏览器…），弥补分类只表达接入类型 |
| pricing | TEXT NOT NULL DEFAULT 'unknown' | `free` / `freemium` / `paid` / `open_source` / `unknown` |
| zh_support | BOOLEAN NOT NULL DEFAULT FALSE | 中文支持 |
| needs_proxy | BOOLEAN NOT NULL DEFAULT FALSE | 需代理（远程 SSE/HTTP 类需特别注意网络可达性） |
| score | SMALLINT | **编辑评分** 0–100，NULL=未评分；绝不叫"AI 评分" |
| ecosystem | TEXT NOT NULL DEFAULT 'community' | `official` 官方 / `verified` 站方精选 / `community` 社区 |
| featured | BOOLEAN NOT NULL DEFAULT FALSE | 精选置顶 |
| sort | INT NOT NULL DEFAULT 0 | 同级排序 |
| created_at / updated_at | TIMESTAMPTZ DEFAULT now() | 时间戳 |

索引：
- `0121`：`mcp_servers_category_idx ON mcp_servers (category)`
- `0122`：`mcp_servers_featured_idx ON mcp_servers (featured) WHERE featured`

### 1.2 API（照抄 tools 模式）

- `GET /api/mcp?category=&q=&page=&limit=` → `{ items, total, page, limit, categories }`
- `GET /api/mcp/:slug` → `{ server }` / 404 `{ error: "not_found" }`
- `Cache-Control: public, max-age=300, must-revalidate`；limit 上限 100，默认 48
- sitemap：`/mcp`

## 2. 分类体系（Server 接入类型）

MCP 用户的第一个问题永远是"这个服务我怎么接"——本地进程还是远程地址，决定了配置写法完全不同。因此**分类 = 接入类型**（server 类型维度），功能维度下沉到 tags：

| key | 中文 | 说明 |
|---|---|---|
| stdio | 本地 Stdio | 本地进程方式，客户端配启动命令；无需网络，最常用 |
| sse | 远程 SSE | 远程地址，SSE 传输；注意网络可达性 |
| http | Streamable HTTP | 远程地址，Streamable HTTP；双向流式 |
| hosted | 托管服务 | 服务商托管，按文档取地址与凭证 |
| other | 其他 | 兜底 |

详情页按接入类型展示**中文接入指引**（`MCP_TRANSPORT_HINTS`，模块内常量，非 AIHOT 文案）：
- stdio → "本地进程接入：在 MCP 客户端配置里填写启动命令即可使用，无需网络。"
- sse → "远程 SSE 接入：在客户端填入服务端地址，直连使用，注意网络可达性。"
- http → "Streamable HTTP 接入：在客户端填入服务端地址，支持双向流式通信。"
- hosted → "托管服务：按服务商文档获取接入地址与凭证后配置客户端。"

## 3. 页面线框

设计纪律同 skills 模块（WS1 §5.3/§7）：三段式页头、card 12px、chip 26px、tabular-nums、1px line 分割、文案原创。

### 3.1 列表页 `/mcp`

页头文案：kicker `MCP 导航` / H1 `MCP 服务导航：按接入类型找` / sub `收录 Model Context Protocol 服务端，按接入类型分类筛选，附中文接入指引。`

```
┌────────────────────────────────────────────────────────┐
│ kicker: MCP 导航                                        │
│ H1: MCP 服务导航：按接入类型找                          │
│ sub: 收录 Model Context Protocol 服务端…                │
│                                                        │
│ [搜服务名称或一句话介绍               ][搜索]            │
│                                                        │
│ (全部)[本地 Stdio·24][远程 SSE·9][Streamable HTTP·6]…   │
│                                                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                  │
│ │[logo] 名  │ │…         │ │…         │                  │
│ │接入类型·生态│ │          │ │          │                  │
│ │一句话…    │ │          │ │          │                  │
│ │免费·中文  │ │          │ │          │                  │
│ │[数据库][文件] 直达→│    │                  │
│ └──────────┘ └──────────┘ └──────────┘                  │
│              [上一页]  1 / 2  [下一页]                   │
└────────────────────────────────────────────────────────┘
移动端：同 markup，1 列卡片；chips 横滑。
```

卡片信息层级：logo/首字 → 名称 → `接入类型·生态标记` → 一句话 → `定价·中文支持·需代理·编辑评分` → tags（≤3，功能维度）＋ 直达 →。

### 3.2 详情页 `/mcp/:slug`

```
┌────────────────────────────────────────────────┐
│ kicker: MCP 导航                                │
│                                                │
│ [logo 64px]  名称（22px 600）                   │
│              一句话介绍（ink-3）                │
│                                                │
│ [接入类型][官方/精选/社区][免费][中文支持]       │
│ [需代理][编辑评分 88][数据库][文件]…           │
│                                                │
│ ┌ 接入方式 · 本地 Stdio ────────────────────┐  │  ← bg-sunk well
│ │ 本地进程接入：在 MCP 客户端配置里填写启动   │  │     12px→13.5px
│ │ 命令即可使用，无需网络。                   │  │
│ └───────────────────────────────────────────┘  │
│                                                │
│ 详细介绍段落（可空则不渲染）                    │
│                                                │
│ ┌──────── [ 前往来源 → ] ────────┐              │
│ └────────────────────────────────┘              │
│   链接指向该服务的来源页面，内容由对方提供。     │
│                                                │
│ ─────────────────────────────────────────────  │
│ ← 返回 MCP 导航                                 │
└────────────────────────────────────────────────┘
```

"接入方式" well 区是本页与 skills 详情页的核心差异：把用户最需要的配置信息放在首屏，不用点进来源站才知道怎么接。

### 3.3 空状态

标题 `没有找到匹配的服务` ＋ `换个关键词，或看看其他接入类型。`

## 4. 导航位置

- 桌面 sidebar："工具"分组下，`工具导航 / Skills 导航 / MCP 导航` 同组。
- 移动底 Tab：暂不加（整站 IA 决策，见 skills/DESIGN.md §4）。
- 图标：`IconPlug`（框架图标库已有）。

## 5. 后续工作（非本次范围）

1. **模块注册**：`site/modules/{index,server,web}.ts` 各加一行 ＋ `site/package.json` 加 `@aihot/mcp` ＋ `npm install`（本次红线未做）。
2. **种子数据**：首批 MCP server 收录清单；`ecosystem=official` 建议先从各大模型厂商官方 server 起。
3. **配置示例**：详情页"接入方式" well 后续可加一键复制的 JSON 配置片段（需收录时采集 `config_example`，v2 字段）。
4. **sitemap 详情页**、**og 分享图** `/og/pages/mcp.png`（meta 已预留路径）。
5. **与 /agent 页联动**：框架已有"Agent 接入"一级导航（MCP/RSS/API），mcp 模块上线后在该页加"去 MCP 导航找服务端 →"入口（需改引擎页面，另行排期）。
6. **与 skills 互链**：同一能力的 skill ↔ mcp server 双向推荐（v2，数据侧先补 `related` 关系）。
