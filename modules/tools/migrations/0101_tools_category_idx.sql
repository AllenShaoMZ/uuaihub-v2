-- 工具表按分类查询的索引。
CREATE INDEX CONCURRENTLY IF NOT EXISTS tools_category_idx
  ON tools (category);
