-- MCP 导航模块的表：mcp_servers。Model Context Protocol 服务端收录，与 tools 表结构对齐、
-- 另加定价/中文支持/需代理/编辑评分/生态标记字段；category 取值是 server 接入类型
--（stdio / sse / http / hosted），功能维度走 tags。
-- 索引拆到 0121/0122（每文件一条语句，索引用 CONCURRENTLY，见 docs/architecture.md#数据库迁移）。
CREATE TABLE IF NOT EXISTS mcp_servers (
  id         BIGSERIAL PRIMARY KEY,
  slug       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  tagline    TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  url        TEXT NOT NULL,
  logo_url   TEXT,
  category   TEXT NOT NULL DEFAULT 'other',
  tags       TEXT[] NOT NULL DEFAULT '{}',
  pricing    TEXT NOT NULL DEFAULT 'unknown',
  zh_support BOOLEAN NOT NULL DEFAULT FALSE,
  needs_proxy BOOLEAN NOT NULL DEFAULT FALSE,
  score      SMALLINT,
  ecosystem  TEXT NOT NULL DEFAULT 'community',
  featured   BOOLEAN NOT NULL DEFAULT FALSE,
  sort       INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
