// What the site's modules add to the web pages (site/modules/index.ts).
import type { WebModule } from "@aihot/web/modules";
import toolsWeb from "@aihot/tools/web";
import skillsWeb from "@aihot/skills/web";
import mcpWeb from "@aihot/mcp/web";

export const WEB_MODULES: readonly WebModule[] = [skillsWeb, mcpWeb, toolsWeb];
