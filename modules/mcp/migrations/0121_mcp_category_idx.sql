-- MCP 服务端表按接入类型查询的索引。
CREATE INDEX CONCURRENTLY IF NOT EXISTS mcp_servers_category_idx
  ON mcp_servers (category);
