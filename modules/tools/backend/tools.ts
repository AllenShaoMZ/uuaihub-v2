// 工具导航的数据读取：列表（分类＋搜索＋分页）与详情。只读 tools 表，不碰引擎的表。
import { sql, type Db } from "@aihot/backend/db";

export interface Tool {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  url: string;
  logoUrl: string | null;
  category: string;
  tags: string[];
  featured: boolean;
}

interface Row {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  url: string;
  logo_url: string | null;
  category: string;
  tags: string[];
  featured: boolean;
}

const toTool = (r: Row): Tool => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  tagline: r.tagline,
  url: r.url,
  logoUrl: r.logo_url,
  category: r.category,
  tags: r.tags,
  featured: r.featured,
});

export interface ListOptions {
  category?: string;
  q?: string;
  limit: number;
  offset: number;
}

function likeOf(q: string) {
  const like = `%${q}%`;
  return sql`(name ILIKE ${like} OR tagline ILIKE ${like})`;
}

export async function listTools(db: Db = sql, opts: ListOptions): Promise<{ items: Tool[]; total: number }> {
  const cat = opts.category ? sql`category = ${opts.category}` : sql`TRUE`;
  const like = opts.q ? likeOf(opts.q) : sql`TRUE`;
  const rows = await db<Row[]>`
    SELECT id, slug, name, tagline, url, logo_url, category, tags, featured
    FROM tools
    WHERE ${cat} AND ${like}
    ORDER BY featured DESC, sort ASC, id ASC
    LIMIT ${opts.limit} OFFSET ${opts.offset}`;
  const total = await db<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM tools WHERE ${cat} AND ${like}`;
  return { items: rows.map(toTool), total: total[0]?.count ?? 0 };
}

export async function getTool(db: Db = sql, slug: string): Promise<Tool | null> {
  const rows = await db<Row[]>`
    SELECT id, slug, name, tagline, url, logo_url, category, tags, featured
    FROM tools WHERE slug = ${slug} LIMIT 1`;
  return rows[0] ? toTool(rows[0]) : null;
}

/** 去重的分类列表（/tools 页的筛选 chips 用）。 */
export async function toolCategories(db: Db = sql): Promise<Array<{ category: string; count: number }>> {
  return db<{ category: string; count: number }[]>`
    SELECT category, COUNT(*)::int AS count FROM tools GROUP BY category ORDER BY count DESC`;
}
