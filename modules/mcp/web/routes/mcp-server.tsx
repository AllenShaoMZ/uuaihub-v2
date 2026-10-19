// /mcp/:slug：MCP Server 详情。logo＋名称＋一句话＋接入类型指引＋标签＋直达来源。
import { useLoaderData } from "react-router";
import { loadOr404, pageHeaders } from "../../../../apps/web/app/lib/api.server";
import { cachedPage } from "../../../../apps/web/app/lib/api.server";
import { pageReuse } from "../../../../apps/web/app/lib/page-reuse";
import { pageMeta } from "../../../../apps/web/app/lib/seo";
import { Kicker } from "../../../../apps/web/app/components/ui/Kicker";
import { IntentLink } from "../../../../apps/web/app/components/ui/IntentLink";
import type { Screen } from "../../../../apps/web/app/components/shell/screens";
import { ECOSYSTEM_LABELS, MCP_CATEGORIES, MCP_TRANSPORT_HINTS, PRICING_LABELS, labelOf, type McpServer } from "../../backend/mcp";

export const handle: Screen = { tab: "tools", name: "MCP 导航" };
export { pageHeaders as headers } from "../../../../apps/web/app/lib/api.server";
export const { clientLoader, shouldRevalidate } = pageReuse<typeof loader>();

export async function loader({ request, params }: { request: Request; params: Record<string, string | undefined> }) {
  const slug = params.slug ?? "";
  const data = await loadOr404<{ server: McpServer }>(`/api/mcp-servers/${encodeURIComponent(slug)}`, { signal: request.signal });
  return cachedPage(300, data);
}

export function meta() {
  return pageMeta({ title: "MCP 服务详情", path: "/mcp", image: "/og/pages/mcp.png" });
}

export default function McpServerDetail() {
  const { server } = useLoaderData<typeof loader>();
  return (
    <div className="mx-auto max-w-[760px] pb-6">
      <Kicker>MCP 导航</Kicker>
      <div className="mt-4 flex items-start gap-4">
        {server.logoUrl ? (
          <img src={server.logoUrl} alt="" width={64} height={64} className="size-16 rounded-card object-contain" />
        ) : (
          <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-card bg-bg-sunk text-[28px] font-bold text-ink-2">
            {server.name.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0 pt-1">
          <h1 className="text-[22px] font-semibold leading-tight text-ink">{server.name}</h1>
          <p className="mt-1 text-[14.5px] leading-relaxed text-ink-3">{server.tagline}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="rounded-mark bg-accent-soft px-2.5 py-1 text-[12.5px] font-medium text-accent">{labelOf(MCP_CATEGORIES, server.category)}</span>
        <span className="rounded-mark bg-bg-sunk px-2.5 py-1 text-[12.5px] text-ink-3">{labelOf(ECOSYSTEM_LABELS, server.ecosystem)}</span>
        <span className="rounded-mark bg-bg-sunk px-2.5 py-1 text-[12.5px] text-ink-3">{labelOf(PRICING_LABELS, server.pricing)}</span>
        {server.zhSupport && <span className="rounded-mark bg-bg-sunk px-2.5 py-1 text-[12.5px] text-ink-3">中文支持</span>}
        {server.needsProxy && <span className="rounded-mark bg-bg-sunk px-2.5 py-1 text-[12.5px] text-ink-3">需代理</span>}
        {server.score != null && <span className="rounded-mark bg-bg-sunk px-2.5 py-1 text-[12.5px] text-ink-3 tabular-nums">编辑评分 {server.score}</span>}
        {server.tags.map((t) => (
          <span key={t} className="rounded-mark bg-bg-sunk px-2.5 py-1 text-[12.5px] text-ink-3">{t}</span>
        ))}
      </div>

      <div className="mt-5 rounded-card border border-line bg-bg-sunk p-4">
        <div className="text-[13px] font-medium text-ink">接入方式 · {labelOf(MCP_CATEGORIES, server.category)}</div>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink-3">{labelOf(MCP_TRANSPORT_HINTS, server.category)}</p>
      </div>

      {server.description && (
        <p className="mt-5 text-[14.5px] leading-relaxed text-ink-2">{server.description}</p>
      )}

      <a
        href={server.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex h-12 items-center justify-center rounded-control bg-accent text-[15px] font-medium text-accent-contrast"
      >
        前往来源 →
      </a>
      <p className="mt-2 text-center text-[12px] text-ink-4">链接指向该服务的来源页面，内容由对方提供。</p>

      <div className="mt-8 border-t border-line pt-4">
        <IntentLink to="/mcp" className="text-[14px] text-ink-2 hover:text-accent">← 返回 MCP 导航</IntentLink>
      </div>
    </div>
  );
}
