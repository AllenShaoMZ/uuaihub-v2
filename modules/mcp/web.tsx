// MCP 导航模块的网页插口：桌面侧栏“工具”分组下的“MCP 导航”入口。
// 移动底 Tab 暂不加：Tab 位是整站 IA 决策（见 DESIGN.md），骨架先只给桌面入口。
import { defineWebModule } from "@aihot/web/modules";
import { IconPlug } from "../../apps/web/app/components/icons";

export default defineWebModule({
  name: "mcp",
  sidebar: { section: "AI 技能", items: [{ to: "/mcp", label: "MCP 导航", icon: IconPlug }] },
});
