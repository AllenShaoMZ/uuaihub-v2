// MCP 导航的数据读取：列表（接入类型＋搜索＋分页）与详情。只读 mcp_servers 表，不碰引擎的表。
import { sql, type Db } from "@aihot/backend/db";

export interface McpServer {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  logoUrl: string | null;
  category: string;
  tags: string[];
  pricing: string;
  zhSupport: boolean;
  needsProxy: boolean;
  score: number | null;
  ecosystem: string;
  featured: boolean;
}

interface Row {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  logo_url: string | null;
  category: string;
  tags: string[];
  pricing: string;
  zh_support: boolean;
  needs_proxy: boolean;
  score: number | null;
  ecosystem: string;
  featured: boolean;
}

const toMcpServer = (r: Row): McpServer => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  tagline: r.tagline,
  description: r.description,
  url: r.url,
  logoUrl: r.logo_url,
  category: r.category,
  tags: r.tags,
  pricing: r.pricing,
  zhSupport: r.zh_support,
  needsProxy: r.needs_proxy,
  score: r.score,
  ecosystem: r.ecosystem,
  featured: r.featured,
});

/** Server 接入类型分类：stdio 本地进程 / sse 远程 SSE / http Streamable HTTP / hosted 托管服务。key 进网址，上线后不改。 */
export const MCP_CATEGORIES: Record<string, string> = {
  stdio: "本地 Stdio",
  sse: "远程 SSE",
  http: "Streamable HTTP",
  hosted: "托管服务",
  other: "其他",
};

/** 各接入类型的中文接入指引（详情页展示）。 */
export const MCP_TRANSPORT_HINTS: Record<string, string> = {
  stdio: "本地进程接入：在 MCP 客户端配置里填写启动命令即可使用，无需网络。",
  sse: "远程 SSE 接入：在客户端填入服务端地址，直连使用，注意网络可达性。",
  http: "Streamable HTTP 接入：在客户端填入服务端地址，支持双向流式通信。",
  hosted: "托管服务：按服务商文档获取接入地址与凭证后配置客户端。",
  other: "接入方式见来源链接的官方文档。",
};

export const PRICING_LABELS: Record<string, string> = {
  free: "免费",
  freemium: "免费增值",
  paid: "付费",
  open_source: "开源",
  unknown: "未知",
};

/** 生态标记：official 官方发布，verified 站方精选，community 社区贡献。 */
export const ECOSYSTEM_LABELS: Record<string, string> = {
  official: "官方",
  verified: "精选",
  community: "社区",
};

export function labelOf(map: Record<string, string>, key: string): string {
  return map[key] ?? key;
}

export interface ListOptions {
  category?: string;
  q?: string;
  limit: number;
  offset: number;
}

function likeOf(q: string) {
  const like = `%${q}%`;
  return sql`(name ILIKE ${like} OR tagline ILIKE ${like} OR description ILIKE ${like})`;
}

export async function listMcpServers(db: Db = sql, opts: ListOptions): Promise<{ items: McpServer[]; total: number }> {
  const cat = opts.category ? sql`category = ${opts.category}` : sql`TRUE`;
  const like = opts.q ? likeOf(opts.q) : sql`TRUE`;
  const rows = await db<Row[]>`
    SELECT id, slug, name, tagline, description, url, logo_url, category, tags, pricing, zh_support, needs_proxy, score, ecosystem, featured
    FROM mcp_servers
    WHERE ${cat} AND ${like}
    ORDER BY featured DESC, sort ASC, id ASC
    LIMIT ${opts.limit} OFFSET ${opts.offset}`;
  const total = await db<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM mcp_servers WHERE ${cat} AND ${like}`;
  return { items: rows.map(toMcpServer), total: total[0]?.count ?? 0 };
}

export async function getMcpServer(db: Db = sql, slug: string): Promise<McpServer | null> {
  const rows = await db<Row[]>`
    SELECT id, slug, name, tagline, description, url, logo_url, category, tags, pricing, zh_support, needs_proxy, score, ecosystem, featured
    FROM mcp_servers WHERE slug = ${slug} LIMIT 1`;
  return rows[0] ? toMcpServer(rows[0]) : null;
}

/** 去重的接入类型列表（/mcp 页的筛选 chips 用）。 */
export async function mcpCategories(db: Db = sql): Promise<Array<{ category: string; count: number }>> {
  return db<{ category: string; count: number }[]>`
    SELECT category, COUNT(*)::int AS count FROM mcp_servers GROUP BY category ORDER BY count DESC`;
}
