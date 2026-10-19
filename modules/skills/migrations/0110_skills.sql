-- Skills 导航模块的表：skills。Agent 可复用的 Skill 收录，与 tools 表结构对齐、
-- 另加定价/中文支持/需代理/编辑评分/生态标记字段（旧站 tools 迁移时保留了 pricing、
-- chinese_support、need_proxy 的语义，见 migration/SCHEMA-MAP.md）。
-- 索引拆到 0111/0112（每文件一条语句，索引用 CONCURRENTLY，见 docs/architecture.md#数据库迁移）。
CREATE TABLE IF NOT EXISTS skills (
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
