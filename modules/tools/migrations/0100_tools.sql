-- 工具导航模块的表：tools。旧站迁移线把 299 款工具灌进这张表。
-- 索引拆到 0101/0102（每文件一条语句，索引用 CONCURRENTLY，见 docs/architecture.md#数据库迁移）。
CREATE TABLE IF NOT EXISTS tools (
  id         BIGSERIAL PRIMARY KEY,
  slug       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  tagline    TEXT NOT NULL DEFAULT '',
  url        TEXT NOT NULL,
  logo_url   TEXT,
  category   TEXT NOT NULL DEFAULT 'other',
  tags       TEXT[] NOT NULL DEFAULT '{}',
  featured   BOOLEAN NOT NULL DEFAULT FALSE,
  sort       INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
