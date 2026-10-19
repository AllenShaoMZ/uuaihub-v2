-- Skills 表精选标记的部分索引。
CREATE INDEX CONCURRENTLY IF NOT EXISTS skills_featured_idx
  ON skills (featured) WHERE featured;
