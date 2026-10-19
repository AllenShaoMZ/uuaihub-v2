-- 工具表精选标记的部分索引。
CREATE INDEX CONCURRENTLY IF NOT EXISTS tools_featured_idx
  ON tools (featured) WHERE featured;
