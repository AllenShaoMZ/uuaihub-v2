#!/usr/bin/env node
// scripts/export-static.mjs — 把 SSR 页面预渲染成纯静态 HTML（无 JS），部署到 GitHub Pages。
//
// 对每个路径：fetch SSR HTML → 内联所有 <link rel=stylesheet> → 删除 <script> 和
// <link rel=modulepreload>（dev 产物，静态版无 JS）→ 根路径引用改相对路径
// （project Pages 子路径 /uuaihub-v2/ 和自有域名都能用）→ 写盘。
//
// 用法：node scripts/export-static.mjs --web http://127.0.0.1:3000 --out ./dist-static
//       --api 可选，仅用于导出前健康检查。

import { mkdirSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i];
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      out[key] = val;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const WEB = (args["--web"] || "http://127.0.0.1:3000").replace(/\/+$/, "");
const API = args["--api"] ? args["--api"].replace(/\/+$/, "") : null;
const OUT = args["--out"] || join(ROOT, "dist-static");

// v1 只导出内容导航页；动态资讯页（/all /hot /daily）不导出
const PATHS = ["/", "/skills", "/mcp", "/tools", "/about"];
// 根目录静态文件：品牌资源 + PWA manifest（API 填充占位符后 serve）
const BRAND_FILES = ["favicon.ico", "icon-192.png", "apple-icon.png", "icon.png", "logo.svg"];

async function fetchText(url, { optional = false } = {}) {
  const res = await fetch(url);
  if (!res.ok) {
    if (optional && res.status === 404) return null;
    throw new Error(`GET ${url} -> ${res.status}`);
  }
  return await res.text();
}

async function inlineStylesheets(html) {
  const tags = [...html.matchAll(/<link\b[^>]*?\brel=(["'])stylesheet\1[^>]*?>/gi)];
  for (const m of tags) {
    const tag = m[0];
    const href = /\bhref=(["'])(.*?)\1/.exec(tag)?.[2];
    if (!href) continue;
    // dev 服务的 CSS 链接带 query（如 /@react-router/critical.css?pathname=/），原样带上
    const cssUrl = href.startsWith("http") ? href : WEB + href;
    const css = await fetchText(cssUrl);
    html = html.replace(tag, `<style>/* inlined: ${href} */\n${css}</style>`);
  }
  return { html, count: tags.length };
}

function stripScripts(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<link\b[^>]*?\brel=(["'])modulepreload\1[^>]*?>/gi, "");
}

// 根路径（/x）改相对路径：project Pages 子路径和自有域名都能用。
// depth: "/" -> 0（前缀 "."），"/skills" -> 1（前缀 ".."）
function relativize(html, depth) {
  const prefix = depth === 0 ? "." : new Array(depth).fill("..").join("/");
  return html.replace(/(src|href)=(")\/(?!\/)/g, (_, attr, q) => `${attr}=${q}${prefix}/`);
}

async function exportPage(path) {
  const html0 = await fetchText(WEB + path, { optional: path === "/about" });
  if (html0 === null) {
    console.log(`export-static: 跳过 ${path}（404）`);
    return null;
  }
  let { html, count } = await inlineStylesheets(html0);
  html = stripScripts(html);
  const depth = path === "/" ? 0 : path.split("/").filter(Boolean).length;
  html = relativize(html, depth);
  const file = path === "/" ? join(OUT, "index.html") : join(OUT, path.slice(1), "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  console.log(`export-static: ${path} -> ${file}（${(html.length / 1024).toFixed(1)} KB，内联 ${count} 个样式表）`);
  return file;
}

async function main() {
  if (API) {
    const res = await fetch(`${API}/api/health`);
    if (!res.ok) throw new Error(`API 健康检查失败：${API}/api/health -> ${res.status}`);
    console.log("export-static: API 健康检查通过");
  }
  mkdirSync(OUT, { recursive: true });

  const files = [];
  for (const p of PATHS) {
    const f = await exportPage(p);
    if (f) files.push(f);
  }

  // manifest：API 填充占位符后下发，改掉里面的根路径
  try {
    let manifest = await fetchText(`${WEB}/manifest.webmanifest`);
    manifest = manifest
      .replace(/"src":"\//g, '"src":"./')
      .replace(/"start_url":"\/"/g, '"start_url":"./"')
      .replace(/"scope":"\/"/g, '"scope":"./"');
    writeFileSync(join(OUT, "manifest.webmanifest"), manifest);
    console.log("export-static: manifest.webmanifest 已导出");
  } catch (e) {
    console.log(`export-static: manifest.webmanifest 跳过（${e.message}）`);
  }

  // feed.xml：静态站无 API，顺手导出一份当时快照（失败不报错）
  try {
    const feed = await fetchText(`${WEB}/feed.xml`);
    writeFileSync(join(OUT, "feed.xml"), feed);
    console.log("export-static: feed.xml 已导出");
  } catch {
    console.log("export-static: feed.xml 跳过");
  }

  for (const f of BRAND_FILES) {
    const src = join(ROOT, "site/brand", f);
    if (existsSync(src)) {
      copyFileSync(src, join(OUT, f));
      console.log(`export-static: 复制 ${f}`);
    }
  }

  writeFileSync(join(OUT, ".nojekyll"), "");
  console.log(`export-static: 完成，共 ${files.length} 个页面 -> ${OUT}`);
}

await main();
