// 工具导航模块的数据读取测试：列表、详情、分类。
import { tag } from "../../../tests/setup.ts";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { sql, closeDb } from "@aihot/backend/db";
import { getTool, listTools, toolCategories } from "../backend/tools.ts";

const T = tag();
after(async () => { await closeDb(); });

async function seed() {
  const p = `tools-${T}`;
  await sql`INSERT INTO tools (slug, name, tagline, url, category, tags, featured, sort) VALUES
    (${p + "-a"}, '测试工具A', 'A 的一句话', 'https://example.com/a', '对话', ARRAY['免费'], TRUE, 1),
    (${p + "-b"}, '测试工具B', 'B 的一句话', 'https://example.com/b', '对话', ARRAY['付费'], FALSE, 2),
    (${p + "-c"}, '测试工具C', 'C 的一句话', 'https://example.com/c', '图像', ARRAY['免费'], FALSE, 3)`;
  return p;
}

test("listTools 按分类过滤并分页", async () => {
  const p = await seed();
  const { items, total } = await listTools(sql, { category: "对话", limit: 10, offset: 0 });
  assert.equal(total, 2);
  assert.deepEqual(items.map((t) => t.slug), [`${p}-a`, `${p}-b`]);
  // featured 排前面
  assert.equal(items[0]!.featured, true);
  const page2 = await listTools(sql, { category: "对话", limit: 1, offset: 1 });
  assert.equal(page2.items[0]!.slug, `${p}-b`);
});

test("listTools 按关键词搜索", async () => {
  const p = await seed();
  const { items, total } = await listTools(sql, { q: "B 的一句话", limit: 10, offset: 0 });
  assert.equal(total, 1);
  assert.equal(items[0]!.slug, `${p}-b`);
});

test("getTool 读详情，slug 不存在时返回 null", async () => {
  const p = await seed();
  const tool = await getTool(sql, `${p}-c`);
  assert.equal(tool?.name, "测试工具C");
  assert.equal(tool?.url, "https://example.com/c");
  assert.equal(await getTool(sql, `${p}-nope`), null);
});

test("toolCategories 返回分类计数", async () => {
  await seed();
  const cats = await toolCategories(sql);
  const byCat = new Map(cats.map((c) => [c.category, c.count]));
  assert.equal(byCat.get("对话"), 2);
  assert.equal(byCat.get("图像"), 1);
});
