-- Skills 表按能力分类查询的索引。
CREATE INDEX CONCURRENTLY IF NOT EXISTS skills_category_idx
  ON skills (category);
