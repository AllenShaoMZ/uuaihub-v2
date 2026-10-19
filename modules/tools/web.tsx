// 工具导航模块的网页插口：桌面侧栏的“工具”分组、手机底栏的“工具” Tab（在“我的”之前）。
import { defineWebModule } from "@aihot/web/modules";
import { IconGrid } from "../../apps/web/app/components/icons";

export default defineWebModule({
  name: "tools",
  sidebar: { section: "AI 技能", items: [{ to: "/tools", label: "工具导航", icon: IconGrid }] },
  tabs: [{ key: "tools", to: "/tools", label: "工具", icon: IconGrid }],
});
