// Site navigation in one place: the desktop sidebar's sections and the phone tab bar's tabs, the engine's
// and the site's modules'.
import type { ReactNode } from "react";
import { NAV, subjectAfter, withSubject } from "@aihot/site";
import { webModules } from "../../site-modules";
import {
  IconBookmark, IconDoc, IconFlame, IconGrid, IconHeart, IconHistory, IconHome, IconList, IconMessage, IconPlug, IconUser,
} from "../icons";

export interface NavItem {
  to: string;
  label: string;
  icon: (p: { size?: number }) => ReactNode;
  /** Match the path exactly (the home page). */
  end?: boolean;
  /** Shows the unread dot while the changelog has news. */
  changelog?: boolean;
}

const SECTIONS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "资讯",
    items: [
      { to: "/", label: "首页", icon: IconHome, end: true },
      { to: "/all", label: subjectAfter("全部", "动态"), icon: IconList },
      { to: "/hot", label: "热点榜", icon: IconFlame },
      { to: "/daily", label: withSubject("日报"), icon: IconDoc },
      { to: "/topics", label: "主题", icon: IconGrid },
    ],
  },
  {
    title: "我的",
    items: [
      { to: "/starred", label: "收藏", icon: IconBookmark },
    ],
  },
  {
    title: "更多",
    items: [
      { to: "/agent", label: "Agent 接入", icon: IconPlug },
      { to: "/about", label: "关于", icon: IconHeart },
      { to: "/changelog", label: "更新日志", icon: IconHistory, changelog: true },
      { to: "/feedback", label: "反馈", icon: IconMessage },
    ],
  },
];

/** Whether an engine page is a way in from the navigation (site.ts NAV.hidden); a hidden page still opens. */
export const inNav = (to: string) => !(NAV.hidden as readonly string[]).includes(to);

/**
 * The sidebar: the site's modules first (AI 技能 — Skills/MCP/tools, the site's
 * differentiator), then the engine's sections. A module naming a section that is
 * already there adds to it.
 */
export function sidebar(): Array<{ title: string; items: NavItem[] }> {
  const sections: Array<{ title: string; items: NavItem[] }> = [];
  const add = (title: string, items: NavItem[]) => {
    const section = sections.find((s) => s.title === title);
    if (section) section.items.push(...items);
    else sections.push({ title, items: [...items] });
  };
  for (const m of webModules()) {
    if (!m.sidebar) continue;
    add(m.sidebar.section, m.sidebar.items);
  }
  for (const s of SECTIONS) {
    add(s.title, s.items.filter((i) => inNav(i.to)));
  }
  return sections.filter((s) => s.items.length > 0);
}

/** A sidebar entry is lit on its pages; 日报 also covers weekly and monthly reports. */
export function sidebarIsActive(item: NavItem, pathname: string): boolean {
  if (item.end) return pathname === item.to;
  if (item.to === "/daily") return /^\/(daily|weekly|monthly)(\/|$)/.test(pathname);
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

/**
 * The phone tab bar: 全部 lives beside 首页 as a switch, 热点 and 日报 are tabs, and "我的" at /more holds
 * 收藏, 外观, the tools and the site's own pages. Which tab a page sits under is declared by the page
 * itself (components/shell/screens.ts).
 */
export type TabKey =
  | "featured"
  | "hot"
  | "daily"
  | "me"
  // A module's tab.
  | (string & {});

export interface Tab {
  key: TabKey;
  to: string;
  label: string;
  icon: (p: { size?: number }) => ReactNode;
  changelog?: boolean;
}

const ENGINE_TABS: Tab[] = [
  { key: "featured", to: "/", label: "首页", icon: IconHome },
  { key: "hot", to: "/hot", label: "热点", icon: IconFlame },
  { key: "daily", to: "/daily", label: "日报", icon: IconDoc },
  { key: "me", to: "/more", label: "我的", icon: IconUser, changelog: true },
];

/** The tab bar: the engine's, the modules' before 我的. */
export function tabs(): Tab[] {
  return [...ENGINE_TABS.slice(0, -1).filter((t) => inNav(t.to)), ...webModules().flatMap((m) => m.tabs ?? []), ENGINE_TABS.at(-1)!];
}
