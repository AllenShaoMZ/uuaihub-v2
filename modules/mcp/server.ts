// MCP 导航模块的后端插口：公开 API 与站点地图。只读 mcp_servers 表，不写引擎的状态。
import type { FastifyInstance } from "fastify";
import { defineServerModule } from "@aihot/backend/modules";
import { sql } from "@aihot/backend/db";
import { getMcpServer, listMcpServers, mcpCategories, type McpServer } from "./backend/mcp.ts";

export interface McpListResponse {
  items: McpServer[];
  total: number;
  page: number;
  limit: number;
  categories: Array<{ category: string; count: number }>;
}

function intParam(value: string | undefined, fallback: number, min: number, max: number): number {
  const n = parseInt(value ?? "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

export default defineServerModule({
  name: "mcp",
  http(app: FastifyInstance) {
    app.get("/api/mcp-servers", async (req, reply) => {
      const q = req.query as Record<string, string | undefined>;
      const page = intParam(q.page, 1, 1, 1000);
      const limit = intParam(q.limit, 48, 1, 100);
      const category = q.category?.trim() || undefined;
      const search = q.q?.trim() || undefined;
      const [{ items, total }, categories] = await Promise.all([
        listMcpServers(sql, { category, q: search, limit, offset: (page - 1) * limit }),
        mcpCategories(sql),
      ]);
      const body: McpListResponse = { items, total, page, limit, categories };
      return reply.header("Cache-Control", "public, max-age=300, must-revalidate").send(body);
    });

    app.get("/api/mcp-servers/:slug", async (req, reply) => {
      const { slug } = req.params as { slug: string };
      const server = await getMcpServer(sql, slug);
      if (!server) return reply.code(404).send({ error: "not_found" });
      return reply.header("Cache-Control", "public, max-age=300, must-revalidate").send({ server });
    });
  },
  sitemap: {
    pages: [{ loc: "/mcp" }],
  },
});
