// Skills 导航模块的地址声明：页面、API 路径。代码通过 server.ts（后端）与 web.tsx（网页）接入。
import { defineModule } from "@aihot/contracts/modules";

export default defineModule({
  name: "skills",
  pages: [
    { path: "skills", file: "web/routes/skills.tsx" },
    { path: "skills/:slug", file: "web/routes/skill.tsx" },
  ],
  apiPaths: [/^\/api\/skills(\/|$)/],
});
