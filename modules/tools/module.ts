// 工具导航模块的地址声明：页面、API 路径。代码通过 server.ts（后端）与 web.tsx（网页）接入。
import { defineModule } from "@aihot/contracts/modules";

export default defineModule({
  name: "tools",
  pages: [
    { path: "tools", file: "web/routes/tools.tsx" },
    { path: "tools/:slug", file: "web/routes/tool.tsx" },
  ],
  apiPaths: [/^\/api\/tools(\/|$)/],
});
