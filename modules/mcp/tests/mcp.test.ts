// MCP 导航模块的数据读取测试：列表、详情、分类。
import { tag } from "../../../tests/setup.ts";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { sql, closeDb } from "@aihot/backend/db";
import { getMcpServer, listMcpServers, mcpCategories } from "../backend/mcp.ts";

after(async () => { await closeDb(); });

async function seed() {
  // 同一文件共享一个 DB 副本：先清本表再种，保证每个 test 的断言确定性。
  await sql`DELETE FROM mcp_servers`;
  const p = `mcp-${tag()}`; // 每次 seed 用独立前缀，避免同文件多 test 撞 slug（tools 旧测试有同类问题，本次未动）
  await sql`INSERT INTO mcp_servers (slug, name, tagline, description, url, category, tags, pricing, zh_support, needs_proxy, score, ecosystem, featured, sort) VALUES
    (${p + "-a"}, '测试ServerA', 'A 的一句话', 'A 的详细介绍', 'https://example.com/a', 'stdio', ARRAY['文件'], 'free', TRUE, FALSE, 88, 'official', TRUE, 1),
    (${p + "-b"}, '测试ServerB', 'B 的一句话', 'B 的详细介绍', 'https://example.com/b', 'stdio', ARRAY['数据库'], 'paid', FALSE, TRUE, NULL, 'community', FALSE, 2),
    (${p + "-c"}, '测试ServerC', 'C 的一句话', 'C 的详细介绍', 'https://example.com/c', 'sse', ARRAY['搜索'], 'freemium', TRUE, FALSE, 70, 'verified', FALSE, 3)`;
  return p;
}

test("listMcpServers 按接入类型过滤并分页", async () => {
  const p = await seed();
  const { items, total } = await listMcpServers(sql, { category: "stdio", limit: 10, offset: 0 });
  assert.equal(total, 2);
  assert.deepEqual(items.map((s) => s.slug), [`${p}-a`, `${p}-b`]);
  // featured 排前面
  assert.equal(items[0]!.featured, true);
  const page2 = await listMcpServers(sql, { category: "stdio", limit: 1, offset: 1 });
  assert.equal(page2.items[0]!.slug, `${p}-b`);
});

test("listMcpServers 按关键词搜索（含详细介绍）", async () => {
  const p = await seed();
  const { items, total } = await listMcpServers(sql, { q: "B 的详细介绍", limit: 10, offset: 0 });
  assert.equal(total, 1);
  assert.equal(items[0]!.slug, `${p}-b`);
});

test("getMcpServer 读详情，slug 不存在时返回 null", async () => {
  const p = await seed();
  const server = await getMcpServer(sql, `${p}-c`);
  assert.equal(server?.name, "测试ServerC");
  assert.equal(server?.url, "https://example.com/c");
  assert.equal(server?.category, "sse");
  assert.equal(server?.needsProxy, false);
  assert.equal(server?.score, 70);
  assert.equal(await getMcpServer(sql, `${p}-nope`), null);
});

test("mcpCategories 返回分类计数", async () => {
  await seed();
  const cats = await mcpCategories(sql);
  const byCat = new Map(cats.map((c) => [c.category, c.count]));
  assert.equal(byCat.get("stdio"), 2);
  assert.equal(byCat.get("sse"), 1);
});
