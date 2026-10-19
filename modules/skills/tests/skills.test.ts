// Skills 导航模块的数据读取测试：列表、详情、分类。
import { tag } from "../../../tests/setup.ts";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { sql, closeDb } from "@aihot/backend/db";
import { getSkill, listSkills, skillCategories } from "../backend/skills.ts";

after(async () => { await closeDb(); });

async function seed() {
  // 同一文件共享一个 DB 副本：先清本表再种，保证每个 test 的断言确定性。
  await sql`DELETE FROM skills`;
  const p = `skills-${tag()}`; // 每次 seed 用独立前缀，避免同文件多 test 撞 slug（tools 旧测试有同类问题，本次未动）
  await sql`INSERT INTO skills (slug, name, tagline, description, url, category, tags, pricing, zh_support, needs_proxy, score, ecosystem, featured, sort) VALUES
    (${p + "-a"}, '测试SkillA', 'A 的一句话', 'A 的详细介绍', 'https://example.com/a', 'coding', ARRAY['免费'], 'free', TRUE, FALSE, 90, 'official', TRUE, 1),
    (${p + "-b"}, '测试SkillB', 'B 的一句话', 'B 的详细介绍', 'https://example.com/b', 'coding', ARRAY['付费'], 'paid', FALSE, TRUE, NULL, 'community', FALSE, 2),
    (${p + "-c"}, '测试SkillC', 'C 的一句话', 'C 的详细介绍', 'https://example.com/c', 'writing', ARRAY['免费'], 'open_source', TRUE, FALSE, 75, 'verified', FALSE, 3)`;
  return p;
}

test("listSkills 按能力分类过滤并分页", async () => {
  const p = await seed();
  const { items, total } = await listSkills(sql, { category: "coding", limit: 10, offset: 0 });
  assert.equal(total, 2);
  assert.deepEqual(items.map((s) => s.slug), [`${p}-a`, `${p}-b`]);
  // featured 排前面
  assert.equal(items[0]!.featured, true);
  const page2 = await listSkills(sql, { category: "coding", limit: 1, offset: 1 });
  assert.equal(page2.items[0]!.slug, `${p}-b`);
});

test("listSkills 按关键词搜索（含详细介绍）", async () => {
  const p = await seed();
  const { items, total } = await listSkills(sql, { q: "B 的详细介绍", limit: 10, offset: 0 });
  assert.equal(total, 1);
  assert.equal(items[0]!.slug, `${p}-b`);
});

test("getSkill 读详情，slug 不存在时返回 null", async () => {
  const p = await seed();
  const skill = await getSkill(sql, `${p}-c`);
  assert.equal(skill?.name, "测试SkillC");
  assert.equal(skill?.url, "https://example.com/c");
  assert.equal(skill?.pricing, "open_source");
  assert.equal(skill?.zhSupport, true);
  assert.equal(skill?.score, 75);
  assert.equal(await getSkill(sql, `${p}-nope`), null);
});

test("skillCategories 返回分类计数", async () => {
  await seed();
  const cats = await skillCategories(sql);
  const byCat = new Map(cats.map((c) => [c.category, c.count]));
  assert.equal(byCat.get("coding"), 2);
  assert.equal(byCat.get("writing"), 1);
});
