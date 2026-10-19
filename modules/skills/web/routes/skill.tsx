// /skills/:slug：Skill 详情。logo＋名称＋一句话＋详细介绍＋标签＋直达来源。
import { useLoaderData } from "react-router";
import { loadOr404, pageHeaders } from "../../../../apps/web/app/lib/api.server";
import { cachedPage } from "../../../../apps/web/app/lib/api.server";
import { pageReuse } from "../../../../apps/web/app/lib/page-reuse";
import { pageMeta } from "../../../../apps/web/app/lib/seo";
import { Kicker } from "../../../../apps/web/app/components/ui/Kicker";
import { IntentLink } from "../../../../apps/web/app/components/ui/IntentLink";
import type { Screen } from "../../../../apps/web/app/components/shell/screens";
import { ECOSYSTEM_LABELS, PRICING_LABELS, SKILL_CATEGORIES, labelOf, type Skill } from "../../backend/skills";

export const handle: Screen = { tab: "tools", name: "Skills 导航" };
export { pageHeaders as headers } from "../../../../apps/web/app/lib/api.server";
export const { clientLoader, shouldRevalidate } = pageReuse<typeof loader>();

export async function loader({ request, params }: { request: Request; params: Record<string, string | undefined> }) {
  const slug = params.slug ?? "";
  const data = await loadOr404<{ skill: Skill }>(`/api/skills/${encodeURIComponent(slug)}`, { signal: request.signal });
  return cachedPage(300, data);
}

export function meta() {
  return pageMeta({ title: "Skill 详情", path: "/skills", image: "/og/pages/skills.png" });
}

export default function SkillDetail() {
  const { skill } = useLoaderData<typeof loader>();
  return (
    <div className="mx-auto max-w-[760px] pb-6">
      <Kicker>Skills 导航</Kicker>
      <div className="mt-4 flex items-start gap-4">
        {skill.logoUrl ? (
          <img src={skill.logoUrl} alt="" width={64} height={64} className="size-16 rounded-card object-contain" />
        ) : (
          <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-card bg-bg-sunk text-[28px] font-bold text-ink-2">
            {skill.name.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0 pt-1">
          <h1 className="text-[22px] font-semibold leading-tight text-ink">{skill.name}</h1>
          <p className="mt-1 text-[14.5px] leading-relaxed text-ink-3">{skill.tagline}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="rounded-mark bg-accent-soft px-2.5 py-1 text-[12.5px] font-medium text-accent">{labelOf(SKILL_CATEGORIES, skill.category)}</span>
        <span className="rounded-mark bg-bg-sunk px-2.5 py-1 text-[12.5px] text-ink-3">{labelOf(ECOSYSTEM_LABELS, skill.ecosystem)}</span>
        <span className="rounded-mark bg-bg-sunk px-2.5 py-1 text-[12.5px] text-ink-3">{labelOf(PRICING_LABELS, skill.pricing)}</span>
        {skill.zhSupport && <span className="rounded-mark bg-bg-sunk px-2.5 py-1 text-[12.5px] text-ink-3">中文支持</span>}
        {skill.needsProxy && <span className="rounded-mark bg-bg-sunk px-2.5 py-1 text-[12.5px] text-ink-3">需代理</span>}
        {skill.score != null && <span className="rounded-mark bg-bg-sunk px-2.5 py-1 text-[12.5px] text-ink-3 tabular-nums">编辑评分 {skill.score}</span>}
        {skill.tags.map((t) => (
          <span key={t} className="rounded-mark bg-bg-sunk px-2.5 py-1 text-[12.5px] text-ink-3">{t}</span>
        ))}
      </div>

      {skill.description && (
        <p className="mt-5 text-[14.5px] leading-relaxed text-ink-2">{skill.description}</p>
      )}

      <a
        href={skill.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex h-12 items-center justify-center rounded-control bg-accent text-[15px] font-medium text-accent-contrast"
      >
        前往来源 →
      </a>
      <p className="mt-2 text-center text-[12px] text-ink-4">链接指向 Skill 的来源页面，内容由对方提供。</p>

      <div className="mt-8 border-t border-line pt-4">
        <IntentLink to="/skills" className="text-[14px] text-ink-2 hover:text-accent">← 返回 Skills 导航</IntentLink>
      </div>
    </div>
  );
}
