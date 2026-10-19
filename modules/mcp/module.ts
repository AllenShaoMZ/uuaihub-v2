// MCP 导航模块的地址声明：页面、API 路径。代码通过 server.ts（后端）与 web.tsx（网页）接入。
import { defineModule } from "@aihot/contracts/modules";

export default defineModule({
  name: "mcp",
  pages: [
    { path: "mcp", file: "web/routes/mcp.tsx" },
    { path: "mcp/:slug", file: "web/routes/mcp-server.tsx" },
  ],
  apiPaths: [/^\/api\/mcp(\/|$)/],
});
