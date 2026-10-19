// The backend of the site's modules, installed by the api and the worker when they start (site/modules/index.ts).
import type { ServerModule } from "@aihot/backend/modules";
import toolsServer from "@aihot/tools/server";
import skillsServer from "@aihot/skills/server";
import mcpServer from "@aihot/mcp/server";

export const SERVER_MODULES: readonly ServerModule[] = [toolsServer, skillsServer, mcpServer];
