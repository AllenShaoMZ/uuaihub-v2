# UU AI Hub（新站）

> AI 热点日报 ＋ AI 工具导航。基于 [AIHOT](https://github.com/KKKKhazix/AIHOT) 开源框架（MIT）全新重建。

每天从一批 AI 信源里挑出值得看的动态，配中文解读，早上 8 点出一份日报；站内另有一份 AI 工具导航，帮你快速找到趁手的工具。

## 技术栈

Node.js 24 · TypeScript · React Router（SSR）· Fastify · PostgreSQL 17 · pg-boss · Tailwind CSS · Docker Compose

架构细节见 [ARCHITECTURE.md](ARCHITECTURE.md)（技术栈清单、前后端分工、启动步骤、compose 预演分析）。

## 快速启动

```bash
node scripts/init-env.ts --llm-key <你的模型 API Key>  # 生成 .env
docker compose up -d --build
# 打开 http://localhost:3000；后台在 /admin（密码见 .env 的 ADMIN_PASSWORD）
```

改动站点身份/文案只改 `site/`（站名、文案、品牌、条款）；改行业（分类、信源、评分提示词）改 `industry/`；本站独有功能做成模块放 `modules/`（已有 `modules/tools` 工具导航）。`apps/`、`packages/` 是引擎，一般不动——这样上游框架更新时容易合并。

## 目录

| 目录 | 说明 |
|---|---|
| `ARCHITECTURE.md` | 框架架构确认：技术栈、前后端分工、启动与预演分析 |
| `site/` | 本站身份：`site.ts`（站名/文案/出刊时间）、`brand/`（logo/图标/日报铭牌）、`pages/`（使用规则/隐私说明·模板待确认）、`public/`（robots/manifest/openapi 占位符构建时替换） |
| `industry/` | 行业包：分类、主题、示范信源、精选提示词、入选门槛（**待按 `docs/customize.md` 定制**：信源名单与评分标准需 Allen 定） |
| `modules/tools/` | 工具导航模块：`/tools` 列表＋`/tools/:slug` 详情页、`/api/tools` 接口、`tools` 表（0100_tools.sql） |
| `apps/`、`packages/` | 引擎：web（SSR）/api（Fastify）/worker（pg-boss）/业务代码/共享类型 |
| `database/` | 引擎迁移；`docs/` 引擎文档；`scripts/` 初始化/迁移/评测脚本；`deploy/` Caddy HTTPS 配置 |

## 品牌

- 站名 **UU AI Hub**，强调色靛蓝（`#1d4ed8`，深色模式 `#8aa5ff`），logo 为原创"U 形＋枢纽圆点"标记。
- 文案全部原创；条目理由栏叫"为什么值得看"；v1 网页不展示 AI 评分（没有公开评分口径就不摆分数）。
- 页脚保留事实性署名："本站基于 AIHOT 开源框架（MIT）构建"。

## 与旧站的关系

旧站（Astro 4）只打 P0 安全补丁维持到新站上线；本仓库是全新重建，不继承旧站代码。旧站的 299 款工具与 241 篇博客由迁移线分别灌入 `tools` 表与内容管线。

## 许可

代码基于 AIHOT（MIT 许可）——见 [LICENSE](LICENSE)。本站的站名、文案、logo 与品牌资产为 UU AI Hub 所有。
