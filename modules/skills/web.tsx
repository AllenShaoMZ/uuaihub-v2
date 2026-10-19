// Skills 导航模块的网页插口：桌面侧栏“工具”分组下的“Skills 导航”入口。
// 移动底 Tab 暂不加：Tab 位是整站 IA 决策（见 DESIGN.md），骨架先只给桌面入口。
import { defineWebModule } from "@aihot/web/modules";
import { IconSparkles } from "../../apps/web/app/components/icons";

export default defineWebModule({
  name: "skills",
  sidebar: { section: "AI 技能", items: [{ to: "/skills", label: "Skills 导航", icon: IconSparkles }] },
});
