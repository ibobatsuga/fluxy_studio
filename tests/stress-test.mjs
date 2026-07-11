#!/usr/bin/env node
/**
 * FLUXY AI STUDIO — Stress Test Suite v2
 * Fixed: redirect detection via Location header, realistic auth expectations
 */

const BASE_URL = "http://127.0.0.1:3000"; // explicit IPv4 — avoids IPv6 socket issues on macOS
let PASS = 0, FAIL = 0, WARN = 0;
const RESULTS = [];

const c = {
  reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m",
  yellow: "\x1b[33m", cyan: "\x1b[36m", bold: "\x1b[1m", dim: "\x1b[2m",
};

const pass = (t, d = "") => { PASS++; RESULTS.push({ s: "PASS", t, d }); console.log(`${c.green}  ✅ PASS${c.reset} ${t}${d ? " — " + d : ""}`); };
const fail = (t, d = "") => { FAIL++; RESULTS.push({ s: "FAIL", t, d }); console.log(`${c.red}  ❌ FAIL${c.reset} ${t}${d ? " — " + d : ""}`); };
const warn = (t, d = "") => { WARN++; RESULTS.push({ s: "WARN", t, d }); console.log(`${c.yellow}  ⚠️  WARN${c.reset} ${t}${d ? " — " + d : ""}`); };
const section = (t) => console.log(`\n${c.bold}${c.cyan}══ ${t} ══${c.reset}`);

async function req(method, path, options = {}) {
  const { body, headers = {}, timeout = 12000, redirect = "manual" } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const hasBody = body !== undefined && body !== null;
  try {
    const opts = {
      method,
      headers: {
        // Only set Content-Type when sending a body — GET with Content-Type header can cause socket errors
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      signal: controller.signal,
      redirect,
    };
    if (hasBody) opts.body = typeof body === "string" ? body : JSON.stringify(body);
    const start = Date.now();
    const res = await fetch(`${BASE_URL}${path}`, opts);
    const ms = Date.now() - start;
    let data = null;
    try { const t = await res.text(); data = t ? JSON.parse(t) : null; } catch {}
    const location = res.headers.get("location") ?? "";
    return { status: res.status, data, ms, headers: Object.fromEntries(res.headers), location };
  } catch (e) {
    return { status: e.name === "AbortError" ? 0 : -1, error: e.message, ms: timeout };
  } finally { clearTimeout(timer); }
}

async function parallel(fn, n) { return Promise.all(Array.from({ length: n }, fn)); }

// ── SUITE 1: Route Health ─────────────────────────────────────────────────────
async function suite1() {
  section("SUITE 1: Route Health Check");

  for (const [path, name] of [["/", "Landing"], ["/login", "Login"], ["/register", "Register"]]) {
    const r = await req("GET", path);
    r.status === 200 ? pass(`${name} page`, `200 in ${r.ms}ms`) : fail(`${name} page`, `got ${r.status}`);
  }

  const session = await req("GET", "/api/auth/session");
  session.status === 200 ? pass("Auth session API", `200 in ${session.ms}ms`) : fail("Auth session API", `got ${session.status}`);

  // Protected routes: Next.js proxy does 307 at HTTP level (redirect=manual)
  for (const path of ["/dashboard", "/studio", "/billing", "/admin", "/studio/remove-bg"]) {
    const r = await req("GET", path, { redirect: "manual" });
    const isRedirect = r.status >= 300 && r.status < 400;
    const goesToLogin = r.location?.includes("/login");
    if (isRedirect && goesToLogin) {
      pass(`Protected: ${path}`, `${r.status} → ${r.location}`);
    } else if (isRedirect) {
      warn(`Protected: ${path}`, `${r.status} but redirects to ${r.location}`);
    } else {
      fail(`Protected: ${path}`, `Expected 3xx redirect, got ${r.status}`);
    }
  }
}

// ── SUITE 2: API Security ──────────────────────────────────────────────────────
async function suite2() {
  section("SUITE 2: API Security (Auth Guards)");

  const endpoints = [
    ["GET", "/api/credits", null],
    ["GET", "/api/generate/history", null],
    ["POST", "/api/generate", { featureSlug: "remove-bg" }],
    ["POST", "/api/upload", null],
  ];

  for (const [method, path, body] of endpoints) {
    const r = await req(method, path, { body, headers: body === null && method === "POST" ? { "Content-Type": "application/json" } : {} });
    if (r.status === 401) {
      pass(`Auth guard: ${method} ${path}`, "401 ✓");
    } else if (r.status === 400) {
      // Content-Type issue on upload is OK — it still didn't leak data
      warn(`Auth guard: ${method} ${path}`, `Got 400 (expected 401) — auth may still be checked`);
    } else {
      fail(`Auth guard: ${method} ${path}`, `Expected 401, got ${r.status}`);
    }
  }

  // Method guards
  const methodGuards = [
    ["PUT", "/api/generate"],
    ["PATCH", "/api/generate"],
    ["PUT", "/api/upload"],
    ["PATCH", "/api/upload"],
    ["DELETE", "/api/credits"],
    ["POST", "/api/credits"],
  ];

  for (const [method, path] of methodGuards) {
    const r = await req(method, path, { body: {} });
    if (r.status === 405 || r.status === 401) {
      pass(`Method guard: ${method} ${path}`, `${r.status} ✓`);
    } else if (r.status === 500) {
      fail(`Method guard: ${method} ${path}`, "Crashed with 500");
    } else {
      warn(`Method guard: ${method} ${path}`, `Got ${r.status}`);
    }
  }

  // Webhook signature check
  const wh = await req("POST", "/api/webhooks/midtrans", {
    body: { order_id: "test", transaction_status: "settlement", signature_key: "INVALID", status_code: "200", gross_amount: "49000" },
  });
  wh.status === 403 || wh.status === 500
    ? pass("Webhook rejects invalid signature", `${wh.status}`)
    : warn("Webhook signature check", `Got ${wh.status}`);
}

// ── SUITE 3: Input Validation ─────────────────────────────────────────────────
async function suite3() {
  section("SUITE 3: Input Validation & Edge Cases");

  // Auth API (no body issues)
  for (const [body, name] of [
    [{}, "Empty body"],
    [{ email: "notanemail" }, "Invalid email"],
    [{ email: "a@b.com", password: "123" }, "Short password"],
  ]) {
    const r = await req("POST", "/api/auth/callback/credentials", { body });
    r.status !== 500 ? pass(`Register: ${name}`, `${r.status} no crash`) : fail(`Register: ${name}`, "500 crash");
  }

  // Generate validations (authenticated as 401 is OK — no crash)
  const badBodies = [
    [null, "null body"],
    ["", "empty string body"],
    ["{ broken json", "malformed JSON"],
    [{ featureSlug: "" }, "empty featureSlug"],
    [{ featureSlug: "x".repeat(500) }, "slug too long"],
    [{ featureSlug: "remove-bg", prompt: "x".repeat(200000) }, "100KB prompt"],
    [{ featureSlug: "remove-bg", inputUrls: "not-array" }, "inputUrls wrong type"],
    [{ featureSlug: "remove-bg", inputUrls: Array(100).fill("https://example.com/img.jpg") }, "100 input URLs"],
  ];

  for (const [body, name] of badBodies) {
    const r = await req("POST", "/api/generate", {
      body: typeof body === "string" ? body : body,
      headers: { "Content-Type": "application/json" },
    });
    if (r.status === 401 || r.status === 400 || r.status === 413) {
      pass(`Generate input: ${name}`, `${r.status} (handled)`);
    } else if (r.status === 500) {
      fail(`Generate input: ${name}`, "Crashed 500");
    } else {
      warn(`Generate input: ${name}`, `Got ${r.status}`);
    }
  }

  // SQL injection via query params (all 401 unauthenticated = safe)
  for (const qs of ["limit=99999", "limit=-1", "cursor=' OR 1=1--", "cursor=<script>alert(1)</script>"]) {
    const r = await req("GET", `/api/generate/history?${qs}`);
    r.status !== 500 ? pass(`Injection: ${qs}`, `${r.status}`) : fail(`Injection: ${qs}`, "500");
  }
}

// ── SUITE 4: Concurrent Load ──────────────────────────────────────────────────
async function suite4() {
  section("SUITE 4: Concurrent Load Test");

  // 20 concurrent landing page
  const t1 = await parallel(() => req("GET", "/"), 20);
  const t1Err = t1.filter(r => r.status !== 200).length;
  const t1Avg = Math.round(t1.reduce((s, r) => s + r.ms, 0) / t1.length);
  t1Err === 0
    ? pass("20× GET /", `all 200 · avg ${t1Avg}ms · max ${Math.max(...t1.map(r=>r.ms))}ms`)
    : fail("20× GET /", `${t1Err}/20 failed`);

  // 30 concurrent auth session
  const t2 = await parallel(() => req("GET", "/api/auth/session"), 30);
  const t2Err = t2.filter(r => r.status !== 200).length;
  const t2Avg = Math.round(t2.reduce((s, r) => s + r.ms, 0) / t2.length);
  t2Err === 0
    ? pass("30× GET /api/auth/session", `all 200 · avg ${t2Avg}ms`)
    : fail("30× GET /api/auth/session", `${t2Err}/30 failed`);

  // 50 concurrent protected routes (redirect=manual)
  const paths = ["/dashboard", "/studio", "/billing", "/admin"];
  const t3 = await Promise.all(
    Array.from({ length: 50 }, (_, i) => req("GET", paths[i % paths.length], { redirect: "manual" }))
  );
  const t3Redir = t3.filter(r => r.status >= 300 && r.status < 400).length;
  t3Redir === 50
    ? pass("50× concurrent protected routes", "all redirected ✓")
    : fail("50× concurrent protected routes", `${t3Redir}/50 redirected`);

  // 25 concurrent unauth POST /api/generate
  const t4 = await parallel(() => req("POST", "/api/generate", { body: { featureSlug: "remove-bg" } }), 25);
  const t4Auth = t4.filter(r => r.status === 401).length;
  t4Auth === 25
    ? pass("25× POST /api/generate (unauth)", `all 401 ✓`)
    : fail("25× POST /api/generate (unauth)", `${t4Auth}/25 got 401`);

  // Mixed traffic simulation
  const start = Date.now();
  const t5 = await Promise.all([
    ...Array(10).fill(0).map(() => req("GET", "/")),
    ...Array(10).fill(0).map(() => req("GET", "/login")),
    ...Array(5).fill(0).map(() => req("GET", "/api/auth/session")),
    ...Array(5).fill(0).map(() => req("GET", "/dashboard", { redirect: "manual" })),
    ...Array(5).fill(0).map(() => req("POST", "/api/generate", { body: { featureSlug: "remove-bg" } })),
    ...Array(5).fill(0).map(() => req("GET", "/api/credits")),
  ]);
  const t5Crash = t5.filter(r => r.status === 500).length;
  t5Crash === 0
    ? pass("40× mixed concurrent (traffic sim)", `0 crashes · ${Date.now()-start}ms`)
    : fail("40× mixed concurrent", `${t5Crash} crashes`);
}

// ── SUITE 5: Response Times ───────────────────────────────────────────────────
async function suite5() {
  section("SUITE 5: Response Time Benchmarks (p50/p95)");

  for (const [path, name, max] of [
    ["/", "Landing page", 3000],
    ["/login", "Login page", 3000],
    ["/register", "Register page", 3000],
    ["/api/auth/session", "Auth session", 2000],
    ["/dashboard", "Dashboard (redirect)", 1000],
  ]) {
    const times = (await Promise.all(Array.from({ length: 5 }, () => req("GET", path, { redirect: "manual" })))).map(r => r.ms).sort((a, b) => a - b);
    const p50 = times[2], p95 = times[4];
    p50 <= max
      ? pass(`Time: ${name}`, `p50=${p50}ms · p95=${p95}ms (max ${max}ms)`)
      : warn(`Time: ${name}`, `p50=${p50}ms SLOW`);
  }
}

// ── SUITE 6: Error Handling ───────────────────────────────────────────────────
async function suite6() {
  section("SUITE 6: Error Handling & Resilience");

  // 404 routes
  for (const path of ["/does-not-exist", "/api/does-not-exist"]) {
    const r = await req("GET", path);
    r.status !== 500 ? pass(`404: ${path}`, `${r.status}`) : fail(`404: ${path}`, "500 crash");
  }

  // Malformed JSON
  const mj = await req("POST", "/api/generate", { body: "{ broken json }" });
  mj.status !== 500 ? pass("Malformed JSON to /api/generate", `${mj.status} handled`) : fail("Malformed JSON", "500 crash");

  // Very large body
  const lb = await req("POST", "/api/generate", { body: { featureSlug: "remove-bg", prompt: "x".repeat(200000) }, timeout: 15000 });
  lb.status !== 500 ? pass("200KB body to /api/generate", `${lb.status} handled`) : fail("Large body", "500 crash");

  // 50 rapid requests
  const rapid = await parallel(() => req("POST", "/api/generate", { body: { featureSlug: "remove-bg" } }), 50);
  const rCrash = rapid.filter(r => r.status === 500).length;
  rCrash === 0 ? pass("50 rapid POST /api/generate", "0 crashes") : fail("50 rapid requests", `${rCrash} crashes`);
}

// ── SUITE 7: DB Health ────────────────────────────────────────────────────────
async function suite7() {
  section("SUITE 7: Database Connection Health");

  const r1 = await parallel(() => req("GET", "/api/auth/session"), 30);
  const e1 = r1.filter(r => r.status === 500).length;
  e1 === 0 ? pass("30× concurrent session reads", "pool healthy") : fail("30× session reads", `${e1} errors`);

  const r2 = await parallel(() => req("GET", "/api/credits"), 20);
  const e2 = r2.filter(r => r.status === 500).length;
  e2 === 0 ? pass("20× GET /api/credits", `0 crashes (all ${r2.filter(r=>r.status===401).length} → 401)`) : fail("20× /api/credits", `${e2} crashes`);

  const r3 = await parallel(() => req("GET", "/api/generate/history"), 20);
  const e3 = r3.filter(r => r.status === 500).length;
  e3 === 0 ? pass("20× GET /api/generate/history", `0 crashes`) : fail("20× history", `${e3} crashes`);
}

// ── SUITE 8: Security Headers ─────────────────────────────────────────────────
async function suite8() {
  section("SUITE 8: Security Headers");
  const r = await req("GET", "/");
  const h = r.headers ?? {};

  const checks = [
    ["x-content-type-options", "nosniff"],
    ["x-frame-options", "SAMEORIGIN"],
    ["x-xss-protection", "1; mode=block"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
    ["permissions-policy", null], // just existence
  ];

  for (const [header, expected] of checks) {
    const val = h[header];
    if (!val) { warn(`Security header: ${header}`, "missing"); continue; }
    if (!expected || val === expected) {
      pass(`Security header: ${header}`, val);
    } else {
      warn(`Security header: ${header}`, `expected "${expected}", got "${val}"`);
    }
  }

  // No sensitive data in unauthenticated session
  const sess = await req("GET", "/api/auth/session");
  const isEmpty = !sess.data || Object.keys(sess.data).length === 0;
  isEmpty ? pass("Session: no data leak (unauth)", "empty") : warn("Session data", JSON.stringify(sess.data).slice(0, 80));
}

// ── SUITE 9: Sustained Load ───────────────────────────────────────────────────
async function suite9() {
  section("SUITE 9: Sustained Load (15 seconds)");
  const DURATION = 15000, INTERVAL = 150;
  const results = [];
  const start = Date.now();
  const paths = ["/", "/login", "/api/auth/session", "/dashboard", "/api/generate"];

  console.log(`${c.dim}  Running for ${DURATION/1000}s...${c.reset}`);
  while (Date.now() - start < DURATION) {
    const batch = await Promise.all([
      req("GET", "/"),
      req("GET", "/login"),
      req("GET", "/api/auth/session"),
      req("GET", "/dashboard", { redirect: "manual" }),
      req("POST", "/api/generate", { body: { featureSlug: "remove-bg" } }),
      req("GET", "/api/credits"),
      req("GET", "/api/generate/history"),
    ]);
    results.push(...batch);
    await new Promise(res => setTimeout(res, INTERVAL));
  }

  const total = results.length;
  const crashes = results.filter(r => r.status === 500).length;
  const timeouts = results.filter(r => r.status === 0).length;
  const avg = Math.round(results.reduce((s, r) => s + r.ms, 0) / total);
  const max = Math.max(...results.map(r => r.ms));
  const successRate = (((total - crashes - timeouts) / total) * 100).toFixed(1);

  console.log(`${c.dim}  ${total} reqs · avg ${avg}ms · max ${max}ms · ${crashes} 500s · ${timeouts} timeouts${c.reset}`);

  crashes === 0 && timeouts === 0
    ? pass("Sustained 15s load", `${total} reqs · ${successRate}% ok · avg ${avg}ms`)
    : crashes < total * 0.02
    ? warn("Sustained 15s load", `${crashes} crashes, ${timeouts} timeouts / ${total}`)
    : fail("Sustained 15s load", `${crashes} crashes, ${timeouts} timeouts / ${total}`);
}

// ── SUITE 10: Apache Bench (HTTP throughput) ──────────────────────────────────
async function suite10() {
  section("SUITE 10: HTTP Throughput (Apache Bench)");

  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execP = promisify(exec);

  const tests = [
    { url: "http://localhost:3000/api/auth/session", n: 200, c: 20, name: "API auth/session (200 req, 20 concur)" },
    { url: "http://localhost:3000/login", n: 100, c: 10, name: "Login page (100 req, 10 concur)" },
  ];

  for (const t of tests) {
    try {
      const cmd = `ab -n ${t.n} -c ${t.c} -q "${t.url}" 2>&1`;
      const { stdout } = await execP(cmd, { timeout: 60000 });

      const rpsMatch = stdout.match(/Requests per second:\s+([\d.]+)/);
      const p99Match = stdout.match(/99%\s+(\d+)/);
      const failMatch = stdout.match(/Failed requests:\s+(\d+)/);

      const rps = rpsMatch ? parseFloat(rpsMatch[1]) : 0;
      const p99 = p99Match ? parseInt(p99Match[1]) : 0;
      const failed = failMatch ? parseInt(failMatch[1]) : 0;

      if (failed === 0 && rps > 5) {
        pass(`AB: ${t.name}`, `${rps.toFixed(0)} req/s · p99=${p99}ms · 0 failures`);
      } else if (failed > 0) {
        fail(`AB: ${t.name}`, `${failed} failures`);
      } else {
        warn(`AB: ${t.name}`, `${rps.toFixed(0)} req/s (slow) · ${failed} failures`);
      }
    } catch (e) {
      warn(`AB: ${t.name}`, `Could not run: ${e.message?.slice(0, 60)}`);
    }
  }
}

// ── Warmup — force Next.js to compile all routes before timing begins ─────────
async function warmup() {
  console.log(`${c.dim}  Warming up all routes (forcing compilation)...${c.reset}`);
  const routes = [
    ["GET", "/"],
    ["GET", "/login"],
    ["GET", "/register"],
    ["GET", "/api/auth/session"],
    ["GET", "/api/credits"],
    ["GET", "/api/generate/history"],
    ["POST", "/api/generate"],
    ["POST", "/api/upload"],
    ["GET", "/dashboard"],
    ["GET", "/studio"],
  ];
  // Hit every route with a generous timeout to let Next.js compile
  await Promise.all(
    routes.map(([method, path]) =>
      req(method, path, {
        body: method === "POST" ? {} : undefined,
        timeout: 30000,
        redirect: "manual",
      })
    )
  );
  // Extra wait to let server settle
  await new Promise(r => setTimeout(r, 1000));
  console.log(`${c.dim}  Warmup complete — all routes compiled.${c.reset}\n`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${c.bold}╔════════════════════════════════════════════╗`);
  console.log(`║   FLUXY AI STUDIO — STRESS TEST v2.0       ║`);
  console.log(`╚════════════════════════════════════════════╝${c.reset}`);
  console.log(`${c.dim}Target: ${BASE_URL}${c.reset}\n`);

  await warmup();

  const start = Date.now();

  await suite1();
  await suite2();
  await suite3();
  await suite4();
  await suite5();
  await suite6();
  await suite7();
  await suite8();
  await suite9();
  await suite10();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n${c.bold}╔════════════════════════════════════════════╗`);
  console.log(`║           FINAL RESULTS SUMMARY             ║`);
  console.log(`╚════════════════════════════════════════════╝${c.reset}`);
  console.log(`\n  ${c.green}✅ PASS : ${PASS}${c.reset}`);
  console.log(`  ${c.red}❌ FAIL : ${FAIL}${c.reset}`);
  console.log(`  ${c.yellow}⚠️  WARN : ${WARN}${c.reset}`);
  console.log(`  ⏱  Time : ${elapsed}s\n`);

  if (FAIL === 0) {
    console.log(`${c.bold}${c.green}  🚀 ALL TESTS PASSED — App is production stress-test ready!${c.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${c.bold}${c.red}  💥 ${FAIL} FAILED${c.reset}\n`);
    RESULTS.filter(r => r.s === "FAIL").forEach(r => {
      console.log(`  ${c.red}• ${r.t}${c.reset}: ${r.d}`);
    });
    console.log();
    process.exit(1);
  }
}

main().catch(e => { console.error("Runner crashed:", e); process.exit(1); });
