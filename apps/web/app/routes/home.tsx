// /：导航 Hub。纯展示：Hero＋三个大入口＋精选 Skills/MCP＋赞助 CTA。
import { Link, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/home";
import { SITE } from "@aihot/site";
import { apiGet, cachedPage } from "../lib/api.server";
import { pageReuse } from "../lib/page-reuse";
import { pageMeta } from "../lib/seo";
import type { Screen } from "../components/shell/screens";
import { Kicker } from "../components/ui/Kicker";
import { IntentLink } from "../components/ui/IntentLink";
import { IconGrid, IconHeart, IconPlug, IconSparkles } from "../components/icons";
import type { SkillsListResponse } from "../../../../modules/skills/server";
import type { McpListResponse } from "../../../../modules/mcp/server";
import type { ToolsListResponse } from "../../../../modules/tools/server";
import { ECOSYSTEM_LABELS as SKILL_ECO, PRICING_LABELS as SKILL_PRICING, SKILL_CATEGORIES, labelOf, type Skill } from "../../../../modules/skills/backend/skills";
import { ECOSYSTEM_LABELS as MCP_ECO, MCP_CATEGORIES, PRICING_LABELS as MCP_PRICING, type McpServer } from "../../../../modules/mcp/backend/mcp";

export const handle: Screen = { tab: "featured", name: "首页" };
export { pageHeaders as headers } from "../lib/api.server";
export const { clientLoader, shouldRevalidate } = pageReuse<typeof loader>();

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  // Search lives on /all; keep the parameters so old links still land on results.
  if (q && q.trim()) throw redirect(`/all${url.search}`);
  // limit=6 即拿总数又拿精选（后端按 featured DESC 排序）。
  const [skills, mcp, tools] = await Promise.all([
    apiGet<SkillsListResponse>("/api/skills?limit=6", { signal: request.signal }),
    apiGet<McpListResponse>("/api/mcp-servers?limit=6", { signal: request.signal }),
    apiGet<ToolsListResponse>("/api/tools?limit=1", { signal: request.signal }),
  ]);
  return cachedPage(300, { skills, mcp, toolsTotal: tools.total });
}

export function meta() {
  return pageMeta({
    title: "给你的 Agent 配齐 Skills 与 MCP",
    description: "中文首个 Agent 技能导航：人工筛选的 Agent 技能、MCP 服务与 AI 工具，附中文介绍与接入指引。",
    path: "/",
  });
}

function EntryCard({ to, title, desc, total, icon: Icon }: { to: string; title: string; desc: string; total: number; icon: (p: { size?: number }) => React.ReactNode }) {
  return (
    <IntentLink
      to={to}
      className="card group flex items-center gap-4 p-5 transition-shadow hover:shadow-[0_3px_12px_rgba(32,42,48,0.08)]"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent">
        <Icon size={24} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold text-ink group-hover:text-accent">{title}</span>
        <span className="mt-0.5 block truncate text-[13px] text-ink-3">{desc}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[22px] font-bold tabular-nums text-ink">{total}</span>
        <span className="block text-[11.5px] text-ink-4">已收录</span>
      </span>
    </IntentLink>
  );
}

function MiniCard({ item, to, categoryLabel, pricingLabel, ecoLabel }: {
  item: Skill | McpServer; to: string; categoryLabel: string; pricingLabel: string; ecoLabel: string;
}) {
  return (
    <article className="card flex flex-col gap-2 p-4">
      <div className="flex items-center gap-3">
        {item.logoUrl ? (
          <img src={item.logoUrl} alt="" width={36} height={36} loading="lazy" className="size-9 rounded-control object-contain" />
        ) : (
          <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-control bg-bg-sunk text-[16px] font-bold text-ink-2">
            {item.name.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0">
          <IntentLink to={to} className="block truncate text-[15px] font-semibold text-ink hover:text-accent">
            {item.name}
          </IntentLink>
          <div className="truncate text-[12px] text-ink-4">{categoryLabel} · {ecoLabel}</div>
        </div>
      </div>
      <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-3">{item.tagline}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="truncate text-[12px] text-ink-4">
          {pricingLabel}{item.zhSupport ? " · 中文支持" : ""}
        </span>
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[13px] font-medium text-accent hover:underline">
          直达 →
        </a>
      </div>
    </article>
  );
}

function SectionHead({ title, to, linkLabel }: { title: string; to: string; linkLabel: string }) {
  return (
    <div className="mb-3 mt-10 flex items-baseline justify-between gap-4">
      <h2 className="text-[19px] font-semibold text-ink">{title}</h2>
      <IntentLink to={to} className="shrink-0 text-[13.5px] font-medium text-accent hover:underline">
        {linkLabel} →
      </IntentLink>
    </div>
  );
}

export default function Home() {
  const { skills, mcp, toolsTotal } = useLoaderData<typeof loader>();
  return (
    <div className="pb-8">
      <Kicker>中文首个 Agent 技能导航</Kicker>
      <h1 className="mt-2 max-w-[20em] text-[28px] font-semibold leading-[1.35] text-ink">
        给你的 Agent 配齐 Skills 与 MCP
      </h1>
      <p className="mt-2 max-w-[34em] text-[14.5px] leading-relaxed text-ink-3">
        人工筛选的 Agent 技能、MCP 服务与 AI 工具，附中文介绍与接入指引。
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <EntryCard to="/skills" title="Skills 导航" desc="Agent 可复用的技能包" total={skills.total} icon={IconSparkles} />
        <EntryCard to="/mcp" title="MCP 导航" desc="可接入的 MCP 服务" total={mcp.total} icon={IconPlug} />
        <EntryCard to="/tools" title="工具导航" desc="实用的 AI 工具" total={toolsTotal} icon={IconGrid} />
      </div>

      {skills.items.length > 0 && (
        <section aria-label="精选 Skills">
          <SectionHead title="精选 Skills" to="/skills" linkLabel="全部 Skills" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {skills.items.map((s) => (
              <MiniCard
                key={s.slug}
                item={s}
                to={`/skills/${s.slug}`}
                categoryLabel={labelOf(SKILL_CATEGORIES, s.category)}
                pricingLabel={labelOf(SKILL_PRICING, s.pricing)}
                ecoLabel={labelOf(SKILL_ECO, s.ecosystem)}
              />
            ))}
          </div>
        </section>
      )}

      {mcp.items.length > 0 && (
        <section aria-label="精选 MCP">
          <SectionHead title="精选 MCP" to="/mcp" linkLabel="全部 MCP" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {mcp.items.map((s) => (
              <MiniCard
                key={s.slug}
                item={s}
                to={`/mcp/${s.slug}`}
                categoryLabel={labelOf(MCP_CATEGORIES, s.category)}
                pricingLabel={labelOf(MCP_PRICING, s.pricing)}
                ecoLabel={labelOf(MCP_ECO, s.ecosystem)}
              />
            ))}
          </div>
        </section>
      )}

      {SITE.sponsor && (
        <section className="card mt-10 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between" aria-label="赞助">
          <div>
            <div className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <IconHeart size={16} />
              本站由人工筛选维护，喜欢请赞助支持
            </div>
            <p className="mt-1 text-[13.5px] text-ink-3">你的赞助让我们持续收录更多优质 Skills 与 MCP。</p>
          </div>
          <a
            href={SITE.sponsor}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-accent px-6 text-[14px] font-semibold text-accent-contrast transition-colors hover:bg-accent-ink"
          >
            ☕ 赞助支持
          </a>
        </section>
      )}

      <p className="mt-10 text-center text-[13.5px] text-ink-4">
        想看 AI 资讯？<Link to="/all" className="font-medium text-accent hover:underline">去全部动态 →</Link>
      </p>
    </div>
  );
}
