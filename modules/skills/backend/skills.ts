// Skills 导航的数据读取：列表（能力分类＋搜索＋分页）与详情。只读 skills 表，不碰引擎的表。
import { sql, type Db } from "@aihot/backend/db";

export interface Skill {
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

const toSkill = (r: Row): Skill => ({
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

/** 能力维度分类：与 tools 的 8 分类衔接（coding/writing/image/video/audio/search/productivity），另加 data/agent。key 进网址，上线后不改。 */
export const SKILL_CATEGORIES: Record<string, string> = {
  coding: "代码开发",
  writing: "写作",
  image: "图像",
  video: "视频",
  audio: "音频",
  data: "数据分析",
  search: "搜索研究",
  productivity: "办公提效",
  agent: "智能体编排",
  other: "其他",
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

export async function listSkills(db: Db = sql, opts: ListOptions): Promise<{ items: Skill[]; total: number }> {
  const cat = opts.category ? sql`category = ${opts.category}` : sql`TRUE`;
  const like = opts.q ? likeOf(opts.q) : sql`TRUE`;
  const rows = await db<Row[]>`
    SELECT id, slug, name, tagline, description, url, logo_url, category, tags, pricing, zh_support, needs_proxy, score, ecosystem, featured
    FROM skills
    WHERE ${cat} AND ${like}
    ORDER BY featured DESC, sort ASC, id ASC
    LIMIT ${opts.limit} OFFSET ${opts.offset}`;
  const total = await db<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM skills WHERE ${cat} AND ${like}`;
  return { items: rows.map(toSkill), total: total[0]?.count ?? 0 };
}

export async function getSkill(db: Db = sql, slug: string): Promise<Skill | null> {
  const rows = await db<Row[]>`
    SELECT id, slug, name, tagline, description, url, logo_url, category, tags, pricing, zh_support, needs_proxy, score, ecosystem, featured
    FROM skills WHERE slug = ${slug} LIMIT 1`;
  return rows[0] ? toSkill(rows[0]) : null;
}

/** 去重的能力分类列表（/skills 页的筛选 chips 用）。 */
export async function skillCategories(db: Db = sql): Promise<Array<{ category: string; count: number }>> {
  return db<{ category: string; count: number }[]>`
    SELECT category, COUNT(*)::int AS count FROM skills GROUP BY category ORDER BY count DESC`;
}
