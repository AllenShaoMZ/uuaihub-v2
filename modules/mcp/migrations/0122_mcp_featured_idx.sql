-- MCP 服务端表精选标记的部分索引。
CREATE INDEX CONCURRENTLY IF NOT EXISTS mcp_servers_featured_idx
  ON mcp_servers (featured) WHERE featured;
