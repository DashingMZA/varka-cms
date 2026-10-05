// src/admin.tsx
import { readFile } from "node:fs/promises";
import path from "node:path";
import { jsx, jsxs } from "react/jsx-runtime";
async function readStatus(pluginDir2) {
  try {
    const raw = await readFile(path.join(pluginDir2, "import-status.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return { state: "idle" };
  }
}
function fmtTime(iso) {
  if (!iso) return "\u2014";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
async function WordPressImportAdmin() {
  const pluginDir2 = process.env.VARKA_PLUGIN_DIR ?? path.join(process.cwd(), "plugins", "wordpress-import");
  const status = await readStatus(pluginDir2);
  const running = status.state === "running";
  return /* @__PURE__ */ jsxs("div", { style: { maxWidth: 720 }, children: [
    /* @__PURE__ */ jsxs("p", { style: { color: "#555", marginBottom: 20 }, children: [
      "Pull posts, pages, categories, tags, authors, and media from any WordPress site's public REST API (",
      /* @__PURE__ */ jsx("code", { children: "/wp-json/wp/v2" }),
      ") into this VARKA site. The import is idempotent \u2014 re-running updates existing content instead of duplicating it."
    ] }),
    /* @__PURE__ */ jsxs(
      "section",
      {
        style: {
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
          background: "#fafafa"
        },
        children: [
          /* @__PURE__ */ jsx("h2", { style: { margin: "0 0 8px", fontSize: 16 }, children: "Status" }),
          /* @__PURE__ */ jsxs("p", { style: { margin: "0 0 4px" }, children: [
            /* @__PURE__ */ jsx("strong", { children: "State:" }),
            " ",
            /* @__PURE__ */ jsx(
              "span",
              {
                style: {
                  fontWeight: 700,
                  color: status.state === "done" ? "#1a7f37" : status.state === "error" ? "#cf222e" : status.state === "running" ? "#9a6700" : "#555"
                },
                children: status.state.toUpperCase()
              }
            )
          ] }),
          status.startedAt && /* @__PURE__ */ jsxs("p", { style: { margin: "0 0 4px", fontSize: 13, color: "#666" }, children: [
            "Started: ",
            fmtTime(status.startedAt),
            status.finishedAt ? ` \xB7 Finished: ${fmtTime(status.finishedAt)}` : ""
          ] }),
          status.message && /* @__PURE__ */ jsx("p", { style: { margin: "8px 0 0", fontSize: 13 }, children: status.message }),
          running && /* @__PURE__ */ jsx("p", { style: { margin: "8px 0 0", fontSize: 13, color: "#9a6700" }, children: "Import is running in the background. Refresh this page to check progress." })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      "section",
      {
        style: { border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 20 },
        children: [
          /* @__PURE__ */ jsx("h2", { style: { margin: "0 0 12px", fontSize: 16 }, children: "New import" }),
          /* @__PURE__ */ jsxs("form", { method: "POST", action: "/api/plugins/wordpress-import/start", children: [
            /* @__PURE__ */ jsxs("div", { style: { marginBottom: 12 }, children: [
              /* @__PURE__ */ jsx("label", { style: { display: "block", fontWeight: 600, marginBottom: 4 }, children: "WordPress site URL" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  name: "wpUrl",
                  type: "url",
                  required: true,
                  placeholder: "https://example.com",
                  defaultValue: "https://celebrtiy.com",
                  style: {
                    width: "100%",
                    padding: 8,
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    fontSize: 14
                  }
                }
              ),
              /* @__PURE__ */ jsxs("p", { style: { margin: "4px 0 0", fontSize: 12, color: "#666" }, children: [
                "The site's REST API must be reachable at ",
                /* @__PURE__ */ jsx("code", { children: "[url]/wp-json/wp/v2" }),
                "."
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 12, marginBottom: 12 }, children: [
              /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
                /* @__PURE__ */ jsxs("label", { style: { display: "block", fontWeight: 600, marginBottom: 4 }, children: [
                  "Username ",
                  /* @__PURE__ */ jsx("span", { style: { fontWeight: 400, color: "#666" }, children: "(optional)" })
                ] }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    name: "wpUsername",
                    type: "text",
                    autoComplete: "off",
                    placeholder: "For drafts & private posts",
                    style: {
                      width: "100%",
                      padding: 8,
                      border: "1px solid #ccc",
                      borderRadius: 4,
                      fontSize: 14
                    }
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
                /* @__PURE__ */ jsxs("label", { style: { display: "block", fontWeight: 600, marginBottom: 4 }, children: [
                  "Application password ",
                  /* @__PURE__ */ jsx("span", { style: { fontWeight: 400, color: "#666" }, children: "(optional)" })
                ] }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    name: "wpAppPassword",
                    type: "password",
                    autoComplete: "new-password",
                    placeholder: "WP \u2192 Users \u2192 Profile",
                    style: {
                      width: "100%",
                      padding: 8,
                      border: "1px solid #ccc",
                      borderRadius: 4,
                      fontSize: 14
                    }
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { style: { margin: "0 0 12px", fontSize: 12, color: "#666" }, children: "Without credentials only published content is imported. With an application password, drafts, pending, scheduled, and private posts are imported too." }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  disabled: running,
                  style: {
                    padding: "10px 20px",
                    background: running ? "#999" : "#0969da",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: running ? "not-allowed" : "pointer"
                  },
                  children: running ? "Import running\u2026" : "Start import"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  formAction: "/api/plugins/wordpress-import/test",
                  formMethod: "POST",
                  style: {
                    padding: "10px 20px",
                    background: "#fff",
                    color: "#0969da",
                    border: "1px solid #0969da",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer"
                  },
                  children: "Test connection"
                }
              )
            ] })
          ] })
        ]
      }
    ),
    status.log && status.log.length > 0 && /* @__PURE__ */ jsxs(
      "section",
      {
        style: { border: "1px solid #ddd", borderRadius: 8, padding: 16 },
        children: [
          /* @__PURE__ */ jsx("h2", { style: { margin: "0 0 8px", fontSize: 16 }, children: "Recent log" }),
          /* @__PURE__ */ jsx(
            "pre",
            {
              style: {
                margin: 0,
                padding: 12,
                background: "#0d1117",
                color: "#c9d1d9",
                borderRadius: 6,
                fontSize: 12,
                maxHeight: 300,
                overflow: "auto",
                whiteSpace: "pre-wrap"
              },
              children: status.log.slice(-40).join("\n")
            }
          )
        ]
      }
    )
  ] });
}

// src/handlers.ts
import { NextResponse } from "next/server";
import { readFile as readFile2, writeFile } from "node:fs/promises";
import path2 from "node:path";
import { runWordPressImport } from "@varka/content";
import { prisma } from "@varka/database";
function pluginDir() {
  return process.env.VARKA_PLUGIN_DIR ?? path2.join(process.cwd(), "plugins", "wordpress-import");
}
function storageRoot() {
  const p = process.env.LOCAL_STORAGE_PATH ?? "./public/uploads";
  return path2.isAbsolute(p) ? p : path2.join(process.cwd(), p);
}
async function readStatus2() {
  try {
    return JSON.parse(
      await readFile2(path2.join(pluginDir(), "import-status.json"), "utf8")
    );
  } catch {
    return { state: "idle" };
  }
}
async function writeStatus(s) {
  await writeFile(
    path2.join(pluginDir(), "import-status.json"),
    JSON.stringify(s, null, 2),
    "utf8"
  );
}
function pushLog(s, msg) {
  const log = s.log ?? [];
  log.push(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${msg}`);
  s.log = log.slice(-200);
}
function wpBaseFromUrl(input) {
  const u = new URL(input.trim());
  return `${u.origin}/wp-json/wp/v2`;
}
async function parseForm(req) {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const j = await req.json().catch(() => ({}));
    return {
      wpUrl: j.wpUrl ?? "",
      wpUsername: j.wpUsername ?? "",
      wpAppPassword: j.wpAppPassword ?? ""
    };
  }
  const fd = await req.formData();
  return {
    wpUrl: String(fd.get("wpUrl") ?? ""),
    wpUsername: String(fd.get("wpUsername") ?? ""),
    wpAppPassword: String(fd.get("wpAppPassword") ?? "")
  };
}
function wantsHtml(req) {
  const accept = req.headers.get("accept") ?? "";
  return accept.includes("text/html");
}
async function GET(req, _ctx) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "status";
  if (action === "status") {
    return NextResponse.json(await readStatus2());
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
async function POST(req, ctx) {
  const action = ctx.params.path[0] ?? "";
  if (action === "test") {
    const { wpUrl } = await parseForm(req);
    if (!wpUrl) {
      return NextResponse.json({ ok: false, error: "wpUrl is required" }, { status: 400 });
    }
    let base;
    try {
      base = wpBaseFromUrl(wpUrl);
    } catch {
      return NextResponse.json({ ok: false, error: "invalid URL" }, { status: 400 });
    }
    try {
      const res = await fetch(`${base}/types?per_page=1`, {
        headers: { "User-Agent": "VARKA-wp-import/1.0" },
        signal: AbortSignal.timeout(15e3)
      });
      if (!res.ok) {
        const msg = `WP API returned HTTP ${res.status}`;
        if (wantsHtml(req)) {
          const back = new URL("/plugins/wordpress-import", req.url);
          back.searchParams.set("testError", msg);
          return NextResponse.redirect(back, 303);
        }
        return NextResponse.json({ ok: false, error: msg }, { status: 502 });
      }
      if (wantsHtml(req)) {
        const back = new URL("/plugins/wordpress-import", req.url);
        back.searchParams.set("tested", "1");
        return NextResponse.redirect(back, 303);
      }
      return NextResponse.json({ ok: true, base });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "connection failed";
      if (wantsHtml(req)) {
        const back = new URL("/plugins/wordpress-import", req.url);
        back.searchParams.set("testError", msg);
        return NextResponse.redirect(back, 303);
      }
      return NextResponse.json({ ok: false, error: msg }, { status: 502 });
    }
  }
  if (action === "start") {
    const current = await readStatus2();
    if (current.state === "running") {
      return NextResponse.json({ ok: false, error: "import already running" }, { status: 409 });
    }
    const { wpUrl, wpUsername, wpAppPassword } = await parseForm(req);
    if (!wpUrl) {
      return NextResponse.json({ ok: false, error: "wpUrl is required" }, { status: 400 });
    }
    let base;
    try {
      base = wpBaseFromUrl(wpUrl);
    } catch {
      return NextResponse.json({ ok: false, error: "invalid URL" }, { status: 400 });
    }
    const status = {
      state: "running",
      startedAt: (/* @__PURE__ */ new Date()).toISOString(),
      message: `Importing from ${base}\u2026`,
      log: current.log ?? []
    };
    pushLog(status, `starting import from ${base}`);
    await writeStatus(status);
    void (async () => {
      try {
        await runWordPressImport({
          wpBaseUrl: base,
          wpUsername: wpUsername || void 0,
          wpAppPassword: wpAppPassword || void 0,
          storageRoot: storageRoot(),
          mediaPublicBase: process.env.MEDIA_PUBLIC_URL ?? "/uploads",
          prisma,
          onProgress: (msg) => {
            void (async () => {
              const s = await readStatus2();
              pushLog(s, msg);
              await writeStatus(s);
            })();
          }
        });
        const done = await readStatus2();
        done.state = "done";
        done.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
        done.message = "Import completed successfully.";
        pushLog(done, "import complete");
        await writeStatus(done);
      } catch (e) {
        const failed = await readStatus2();
        failed.state = "error";
        failed.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
        failed.message = e instanceof Error ? e.message : "import failed";
        pushLog(failed, `FAILED: ${failed.message}`);
        await writeStatus(failed);
      }
    })();
    if (wantsHtml(req)) {
      return NextResponse.redirect(new URL("/plugins/wordpress-import", req.url), 303);
    }
    return NextResponse.json({ ok: true, state: "running" });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 404 });
}
export {
  GET,
  POST,
  WordPressImportAdmin as default
};
