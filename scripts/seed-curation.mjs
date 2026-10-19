#!/usr/bin/env node
// scripts/seed-curation.mjs — 收录数据种子：skills / mcp_servers / tools 三张表。
//
// 读取仓库内 curation/*.json（CI 布局），或 ../curation/*.json（本地 workspace 布局），
// INSERT … ON CONFLICT (slug) DO NOTHING，可重复跑、幂等。
//
// 零依赖：内置最小 PostgreSQL wire 协议客户端（TCP + SCRAM-SHA-256 + simple query），
// node 24 直接跑，不需要 psql 也不需要任何 npm 包。
//
// 用法：node --env-file=.env scripts/seed-curation.mjs   # 需要 DATABASE_URL

import { createConnection } from "node:net";
import { randomBytes, pbkdf2Sync, createHmac, createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/* ---------------- 最小 PG wire 协议客户端（无依赖） ---------------- */

function parseDatabaseUrl(s) {
  const u = new URL(s);
  if (u.protocol !== "postgres:" && u.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must start with postgres:// or postgresql://");
  }
  return {
    host: u.hostname || "127.0.0.1",
    port: u.port ? Number(u.port) : 5432,
    user: decodeURIComponent(u.username || "postgres"),
    password: decodeURIComponent(u.password || ""),
    database: decodeURIComponent(u.pathname.replace(/^\//, "") || "postgres"),
  };
}

const te = new TextEncoder();
function cstr(s) {
  const b = te.encode(s);
  const out = Buffer.alloc(b.length + 1);
  Buffer.from(b).copy(out);
  out[b.length] = 0; // NUL 结尾
  return out;
}
// type: 单字符（如 "Q"/"p"），null 表示 startup 消息（无类型字节，改放协议号；长度含自身 8 字节头）
function frame(type, payload) {
  if (type) {
    const head = Buffer.alloc(5);
    head.writeUInt8(type.charCodeAt(0), 0);
    head.writeInt32BE(payload.length + 4, 1);
    return Buffer.concat([head, payload]);
  }
  const head = Buffer.alloc(8);
  head.writeInt32BE(payload.length + 8, 0);
  head.writeInt32BE(196608, 4); // protocol 3.0
  return Buffer.concat([head, payload]);
}
function errText(payload) {
  let msg = "";
  let i = 0;
  while (i < payload.length) {
    const code = payload[i++];
    const end = payload.indexOf(0, i);
    if (end < 0) break;
    if (code === 77) msg = payload.subarray(i, end).toString("utf8"); // 'M'
    i = end + 1;
  }
  return msg || "unknown postgres error";
}

class Pg {
  constructor(cfg) {
    this.cfg = cfg;
    this.buf = Buffer.alloc(0);
    this.notify = null;
  }
  async connect(timeoutMs = 15000) {
    const { host, port, user, password, database } = this.cfg;
    this.user = user;
    this.password = password;
    this.sock = await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`connect timeout ${host}:${port}`)), timeoutMs);
      const s = createConnection({ host, port }, () => {
        clearTimeout(t);
        resolve(s);
      });
      s.on("error", (e) => {
        clearTimeout(t);
        reject(e);
      });
    });
    this.sock.on("data", (chunk) => {
      this.buf = Buffer.concat([this.buf, chunk]);
      if (this.notify) {
        const n = this.notify;
        this.notify = null;
        n();
      }
    });
    this.sock.on("error", () => {});
    const startup = Buffer.concat([
      cstr("user"),
      cstr(user),
      cstr("database"),
      cstr(database),
      Buffer.from([0]),
    ]);
    this.sock.write(frame(null, startup));
    await this.#auth();
  }
  readMessage() {
    // 严格串行调用：一次只等一个消息
    return new Promise((resolve) => {
      const tryRead = () => {
        if (this.buf.length >= 5) {
          const len = this.buf.readInt32BE(1);
          if (this.buf.length >= 1 + len) {
            const type = String.fromCharCode(this.buf[0]);
            const payload = this.buf.subarray(5, 1 + len);
            this.buf = this.buf.subarray(1 + len);
            resolve({ type, payload });
            return;
          }
        }
        this.notify = tryRead;
      };
      tryRead();
    });
  }
  async #auth() {
    for (;;) {
      const m = await this.readMessage();
      if (m.type === "R") {
        const kind = m.payload.readInt32BE(0);
        if (kind === 0) continue; // AuthenticationOk
        else if (kind === 10) this.#scramStart(); // AuthenticationSASL
        else if (kind === 11) this.#scramContinue(m.payload.subarray(4)); // SASLContinue
        else if (kind === 12) this.#scramFinish(m.payload.subarray(4)); // SASLFinal
        else throw new Error(`unsupported postgres auth method ${kind}`);
      } else if (m.type === "E") {
        throw new Error(`postgres auth failed: ${errText(m.payload)}`);
      } else if (m.type === "Z") {
        return; // ReadyForQuery
      }
      // 'S' ParameterStatus / 'K' BackendKeyData / 'N' NoticeResponse：忽略
    }
  }
  #scramStart() {
    this.cnonce = randomBytes(18).toString("base64");
    this.clientFirstBare = `n=${this.user},r=${this.cnonce}`;
    const data = Buffer.from(`n,,${this.clientFirstBare}`, "utf8"); // gs2 头 "n,," = 无 channel binding
    const mech = "SCRAM-SHA-256";
    const head = Buffer.alloc(mech.length + 1 + 4);
    head.write(mech, 0, "utf8");
    head.writeUInt8(0, mech.length);
    head.writeInt32BE(data.length, mech.length + 1);
    this.sock.write(frame("p", Buffer.concat([head, data])));
  }
  #scramContinue(payload) {
    const s = payload.toString("utf8");
    const attrs = {};
    for (const kv of s.split(",")) {
      const i = kv.indexOf("=");
      attrs[kv.slice(0, i)] = kv.slice(i + 1);
    }
    if (!attrs.r || !attrs.r.startsWith(this.cnonce)) throw new Error("bad SCRAM server nonce");
    const salted = pbkdf2Sync(this.password, Buffer.from(attrs.s, "base64"), parseInt(attrs.i, 10), 32, "sha256");
    const clientKey = createHmac("sha256", salted).update("Client Key").digest();
    const storedKey = createHash("sha256").update(clientKey).digest();
    const clientFinalNoProof = `c=biws,r=${attrs.r}`; // biws = base64("n,,")
    const authMessage = `${this.clientFirstBare},${s},${clientFinalNoProof}`;
    const sig = createHmac("sha256", storedKey).update(authMessage).digest();
    const proof = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) proof[i] = clientKey[i] ^ sig[i];
    const serverKey = createHmac("sha256", salted).update("Server Key").digest();
    this.expectedServerSig = createHmac("sha256", serverKey).update(authMessage).digest("base64");
    this.sock.write(frame("p", Buffer.from(`${clientFinalNoProof},p=${proof.toString("base64")}`, "utf8")));
  }
  #scramFinish(payload) {
    const s = payload.toString("utf8");
    const v = s.startsWith("v=") ? s.slice(2) : null;
    if (v !== this.expectedServerSig) throw new Error("SCRAM server signature mismatch");
  }
  // simple query 协议：一次一条语句；返回 DataRow 行（数组的数组，值为文本或 null）
  async queryRows(sqlText) {
    this.sock.write(frame("Q", cstr(sqlText)));
    const rows = [];
    for (;;) {
      const m = await this.readMessage();
      if (m.type === "D") {
        const ncols = m.payload.readInt16BE(0);
        let off = 2;
        const row = [];
        for (let i = 0; i < ncols; i++) {
          const len = m.payload.readInt32BE(off);
          off += 4;
          row.push(len < 0 ? null : m.payload.subarray(off, off + len).toString("utf8"));
          off += Math.max(len, 0);
        }
        rows.push(row);
      } else if (m.type === "C") {
        // CommandComplete
      } else if (m.type === "E") {
        throw new Error(`query failed: ${errText(m.payload)}\n-- ${sqlText.slice(0, 160)}`);
      } else if (m.type === "Z") {
        return rows; // ReadyForQuery
      }
      // 'T' RowDescription / 'N' Notice / 'S' ParameterStatus：忽略
    }
  }
  close() {
    try {
      this.sock.end();
    } catch {}
    try {
      this.sock.destroy();
    } catch {}
  }
}

/* ---------------- SQL 转义与种子数据 ---------------- */

const lit = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const pgBool = (v) => (v ? "TRUE" : "FALSE");
const pgTextArray = (a) => {
  const items = (a || []).map((x) => `"${String(x).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",");
  return `'{${items}}'`;
};
const sqlVal = (v) => (Array.isArray(v) ? pgTextArray(v) : typeof v === "boolean" ? pgBool(v) : lit(v));
const insertSql = (table, row) => {
  const cols = Object.keys(row);
  return (
    `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map((c) => sqlVal(row[c])).join(", ")}) ` +
    `ON CONFLICT (slug) DO NOTHING`
  );
};

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
// CI 布局：curation 在仓库内；本地 workspace 布局：在仓库上一级
const curationDir = existsSync(join(ROOT, "curation")) ? join(ROOT, "curation") : join(ROOT, "..", "curation");

const DIRECTORY_COLS = [
  "slug",
  "name",
  "tagline",
  "description",
  "url",
  "logo_url",
  "category",
  "tags",
  "pricing",
  "zh_support",
  "needs_proxy",
  "ecosystem",
  "featured",
];
const TOOL_COLS = ["slug", "name", "tagline", "url", "logo_url", "category", "tags", "featured"];

// 演示用 10 工具（正式 299 条由迁移线灌入）
const DEMO_TOOLS = [
  { slug: "chatgpt", name: "ChatGPT", tagline: "OpenAI 的 AI 对话助手，写代码写文章都行", url: "https://chat.openai.com", logo_url: null, category: "对话", tags: ["对话", "写作"], featured: true },
  { slug: "claude", name: "Claude", tagline: "Anthropic 的 AI 助手，长文本和代码能力强", url: "https://claude.ai", logo_url: null, category: "对话", tags: ["对话", "写作"], featured: true },
  { slug: "midjourney", name: "Midjourney", tagline: "文字生成高质量 AI 绘画", url: "https://www.midjourney.com", logo_url: null, category: "绘画", tags: ["绘画", "设计"], featured: true },
  { slug: "github-copilot", name: "GitHub Copilot", tagline: "AI 结对编程，编辑器里直接补全代码", url: "https://github.com/features/copilot", logo_url: null, category: "编程", tags: ["编程", "代码"], featured: false },
  { slug: "cursor", name: "Cursor", tagline: "为 AI 而生的代码编辑器", url: "https://cursor.sh", logo_url: null, category: "编程", tags: ["编程", "代码"], featured: true },
  { slug: "perplexity", name: "Perplexity", tagline: "AI 搜索引擎，带引用回答问题", url: "https://www.perplexity.ai", logo_url: null, category: "搜索", tags: ["搜索", "问答"], featured: false },
  { slug: "notion-ai", name: "Notion AI", tagline: "笔记里的 AI 写作助手", url: "https://www.notion.so", logo_url: null, category: "写作", tags: ["写作", "办公"], featured: false },
  { slug: "runway", name: "Runway", tagline: "AI 视频生成与剪辑", url: "https://runway.ml", logo_url: null, category: "视频", tags: ["视频", "创作"], featured: false },
  { slug: "suno", name: "Suno", tagline: "一句话生成完整歌曲", url: "https://suno.com", logo_url: null, category: "音乐", tags: ["音乐", "创作"], featured: false },
  { slug: "dalle3", name: "DALL-E 3", tagline: "OpenAI 的图像生成模型", url: "https://openai.com/dall-e-3", logo_url: null, category: "绘画", tags: ["绘画", "设计"], featured: false },
];

/* ---------------- 主流程 ---------------- */

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("seed-curation: 需要 DATABASE_URL 环境变量");
  process.exit(1);
}

const watchdog = setTimeout(() => {
  console.error("seed-curation: 超时（5 分钟）");
  process.exit(1);
}, 5 * 60 * 1000);

const pg = new Pg(parseDatabaseUrl(DATABASE_URL));
try {
  await pg.connect();
  const seed = async (table, cols, items, label) => {
    for (const item of items) {
      const row = {};
      for (const c of cols) row[c] = item[c] ?? null;
      await pg.queryRows(insertSql(table, row));
    }
    const [[total]] = await pg.queryRows(`SELECT count(*)::int AS n FROM ${table}`);
    console.log(`seed-curation: ${label}: 处理 ${items.length} 条，${table} 现有 ${total} 条`);
  };
  await seed(
    "skills",
    DIRECTORY_COLS,
    JSON.parse(readFileSync(join(curationDir, "skills-batch1.json"), "utf8")),
    "skills"
  );
  await seed(
    "mcp_servers",
    DIRECTORY_COLS,
    JSON.parse(readFileSync(join(curationDir, "mcp-batch1.json"), "utf8")),
    "mcp_servers"
  );
  await seed("tools", TOOL_COLS, DEMO_TOOLS, "tools（演示数据）");
  console.log("seed-curation: 完成");
} finally {
  clearTimeout(watchdog);
  pg.close();
}
