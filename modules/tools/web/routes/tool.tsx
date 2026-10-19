// /tools/:slug：工具详情。logo＋名称＋一句话＋标签＋直达官网。
import { useLoaderData } from "react-router";
import { loadOr404, pageHeaders } from "../../../../apps/web/app/lib/api.server";
import { cachedPage } from "../../../../apps/web/app/lib/api.server";
import { pageReuse } from "../../../../apps/web/app/lib/page-reuse";
import { pageMeta } from "../../../../apps/web/app/lib/seo";
import { Kicker } from "../../../../apps/web/app/components/ui/Kicker";
import { IntentLink } from "../../../../apps/web/app/components/ui/IntentLink";
import type { Screen } from "../../../../apps/web/app/components/shell/screens";
import type { Tool } from "../../backend/tools";

export const handle: Screen = { tab: "tools", name: "工具导航" };
export { pageHeaders as headers } from "../../../../apps/web/app/lib/api.server";
export const { clientLoader, shouldRevalidate } = pageReuse<typeof loader>();

export async function loader({ request, params }: { request: Request; params: Record<string, string | undefined> }) {
  const slug = params.slug ?? "";
  const data = await loadOr404<{ tool: Tool }>(`/api/tools/${encodeURIComponent(slug)}`, { signal: request.signal });
  return cachedPage(300, data);
}

export function meta() {
  return pageMeta({ title: "工具详情", path: "/tools", image: "/og/pages/tools.png" });
}

export default function ToolDetail() {
  const { tool } = useLoaderData<typeof loader>();
  return (
    <div className="mx-auto max-w-[760px] pb-6">
      <Kicker>工具导航</Kicker>
      <div className="mt-4 flex items-start gap-4">
        {tool.logoUrl ? (
          <img src={tool.logoUrl} alt="" width={64} height={64} className="size-16 rounded-card object-contain" />
        ) : (
          <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-card bg-bg-sunk text-[28px] font-bold text-ink-2">
            {tool.name.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0 pt-1">
          <h1 className="text-[22px] font-semibold leading-tight text-ink">{tool.name}</h1>
          <p className="mt-1 text-[14.5px] leading-relaxed text-ink-3">{tool.tagline}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="rounded-mark bg-accent-soft px-2.5 py-1 text-[12.5px] font-medium text-accent">{tool.category}</span>
        {tool.tags.map((t) => (
          <span key={t} className="rounded-mark bg-bg-sunk px-2.5 py-1 text-[12.5px] text-ink-3">{t}</span>
        ))}
      </div>

      <a
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex h-12 items-center justify-center rounded-control bg-accent text-[15px] font-medium text-accent-contrast"
      >
        访问官网 →
      </a>
      <p className="mt-2 text-center text-[12px] text-ink-4">链接指向工具官方网站，内容由对方提供。</p>

      <div className="mt-8 border-t border-line pt-4">
        <IntentLink to="/tools" className="text-[14px] text-ink-2 hover:text-accent">← 返回工具导航</IntentLink>
      </div>
    </div>
  );
}
