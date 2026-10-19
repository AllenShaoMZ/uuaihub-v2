// /tools：AI 工具导航。第二层入口：分类筛选＋搜索＋分页，不做全量 299 款一次渲染。
import { useLoaderData } from "react-router";
import { apiGet, cachedPage, pageHeaders } from "../../../../apps/web/app/lib/api.server";
import { pageReuse } from "../../../../apps/web/app/lib/page-reuse";
import { pageMeta } from "../../../../apps/web/app/lib/seo";
import { Kicker } from "../../../../apps/web/app/components/ui/Kicker";
import { IntentLink } from "../../../../apps/web/app/components/ui/IntentLink";
import type { Screen } from "../../../../apps/web/app/components/shell/screens";
import { CARDS } from "@aihot/site";
import type { Tool } from "../../backend/tools";
import type { ToolsListResponse } from "../../server";

export const handle: Screen = { tab: "tools", name: "工具导航" };
export { pageHeaders as headers } from "../../../../apps/web/app/lib/api.server";
export const { clientLoader, shouldRevalidate } = pageReuse<typeof loader>();

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const params = new URLSearchParams();
  for (const key of ["category", "q", "page"] as const) {
    const v = url.searchParams.get(key);
    if (v) params.set(key, v);
  }
  const data = await apiGet<ToolsListResponse>(`/api/tools?${params}`, { signal: request.signal });
  return cachedPage(300, { data, category: url.searchParams.get("category"), q: url.searchParams.get("q") });
}

export function meta() {
  const card = CARDS.tools;
  return pageMeta({ title: card.title, description: card.subtitle, path: "/tools", image: "/og/pages/tools.png" });
}

function linkWith(search: URLSearchParams, key: string, value: string | null): string {
  const next = new URLSearchParams(search);
  if (value) next.set(key, value);
  else next.delete(key);
  next.delete("page");
  const s = next.toString();
  return s ? `/tools?${s}` : "/tools";
}

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <article className="card flex flex-col gap-2 p-4">
      <div className="flex items-center gap-3">
        {tool.logoUrl ? (
          <img src={tool.logoUrl} alt="" width={40} height={40} loading="lazy" className="size-10 rounded-control object-contain" />
        ) : (
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-control bg-bg-sunk text-[18px] font-bold text-ink-2">
            {tool.name.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0">
          <IntentLink to={`/tools/${tool.slug}`} className="block truncate text-[16px] font-semibold text-ink hover:text-accent">
            {tool.name}
          </IntentLink>
          <div className="truncate text-[12px] text-ink-4">{tool.category}</div>
        </div>
      </div>
      <p className="line-clamp-2 text-[13.5px] leading-relaxed text-ink-3">{tool.tagline}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {tool.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-mark bg-bg-sunk px-2 py-0.5 text-[11.5px] text-ink-3">{t}</span>
          ))}
        </div>
        <a href={tool.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[13px] font-medium text-accent hover:underline">
          直达 →
        </a>
      </div>
    </article>
  );
}

export default function Tools() {
  const { data, category, q } = useLoaderData<typeof loader>();
  const search = new URLSearchParams();
  if (category) search.set("category", category);
  if (q) search.set("q", q);
  const pages = Math.max(1, Math.ceil(data.total / data.limit));

  return (
    <div className="pb-6">
      <Kicker>{CARDS.tools.kicker}</Kicker>
      <h1 className="mt-2 text-[24px] font-semibold leading-[1.3] text-ink">{CARDS.tools.title}</h1>
      <p className="mt-1.5 text-[14px] text-ink-3">{CARDS.tools.subtitle}</p>

      <form method="get" action="/tools" className="mt-4 flex gap-2" role="search">
        {category && <input type="hidden" name="category" value={category} />}
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="搜工具名称或一句话介绍"
          className="h-10 min-w-0 flex-1 rounded-control border border-line bg-field px-3 text-[14px] text-ink placeholder:text-ink-4"
        />
        <button type="submit" className="h-10 shrink-0 rounded-control bg-accent px-4 text-[14px] font-medium text-accent-contrast">
          搜索
        </button>
      </form>

      {data.categories.length > 0 && (
        <div className="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          <IntentLink
            to={linkWith(search, "category", null)}
            aria-pressed={!category}
            className={`h-[26px] shrink-0 rounded-full border border-line px-3 text-[13px] leading-[24px] ${!category ? "border-accent bg-accent-soft font-medium text-accent" : "bg-bg-sunk text-ink-3"}`}
          >
            全部
          </IntentLink>
          {data.categories.map((c) => (
            <IntentLink
              key={c.category}
              to={linkWith(search, "category", c.category)}
              aria-pressed={category === c.category}
              className={`h-[26px] shrink-0 rounded-full border border-line px-3 text-[13px] leading-[24px] ${category === c.category ? "border-accent bg-accent-soft font-medium text-accent" : "bg-bg-sunk text-ink-3"}`}
            >
              {c.category} · {c.count}
            </IntentLink>
          ))}
        </div>
      )}

      {data.items.length === 0 ? (
        <div className="mt-10 text-center">
          <div className="text-[16px] font-medium text-ink">没有找到匹配的工具</div>
          <p className="mt-1 text-[13.5px] text-ink-3">换个关键词，或看看其他分类。</p>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.items.map((t) => <ToolCard key={t.slug} tool={t} />)}
          </div>
          {pages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-3" aria-label="分页">
              {data.page > 1 ? (
                <IntentLink to={linkWith(search, "page", String(data.page - 1))} className="rounded-control border border-line px-4 py-2 text-[14px] text-ink-2">上一页</IntentLink>
              ) : null}
              <span className="text-[13px] text-ink-4 tabular-nums">{data.page} / {pages}</span>
              {data.page < pages ? (
                <IntentLink to={linkWith(search, "page", String(data.page + 1))} className="rounded-control border border-line px-4 py-2 text-[14px] text-ink-2">下一页</IntentLink>
              ) : null}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
