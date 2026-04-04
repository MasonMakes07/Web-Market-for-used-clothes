/**
 * db-test.js
 * Manual test script for verifying Supabase DB setup (Issues #1–3).
 * Tests: schema tables exist, seed data present, RLS blocks anon writes,
 * and Realtime channel WebSocket connects successfully.
 *
 * Run with:
 *   node --env-file=.env src/tests/db-test.js
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Track failures for exit code
let failures = 0;

// Helpers
function pass(msg) {
  console.log(`  ✓ PASS — ${msg}`);
}
function fail(msg, detail = "") {
  failures++;
  console.error(`  ✗ FAIL — ${msg}${detail ? `: ${detail}` : ""}`);
}
function section(title) {
  console.log(`\n── ${title} ──`);
}

// ── Test 1: Client initialises ──────────────────────────────────────────────
section("Issue #1 · Supabase client init");

if (!supabaseUrl || !supabaseAnonKey) {
  fail("Env vars missing — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
pass("Client created from env vars");

// ── Test 2: All 4 tables exist and are queryable ────────────────────────────
async function testTables() {
  section("Issue #1 · Schema — all 4 tables queryable");

  const TABLES = ["profiles", "listings", "messages", "ratings"];
  for (const table of TABLES) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      fail(`Table "${table}" query failed`, error.message);
    } else {
      pass(`Table "${table}" exists and is readable`);
    }
  }
}

// ── Test 3: Seed data — at least 5 active listings ─────────────────────────
async function testSeedData() {
  section("Issue #3 · Seed data — at least 5 listings");

  const { data, error } = await supabase
    .from("listings")
    .select("id, title, status")
    .eq("status", "active");

  if (error) {
    fail("Could not query listings", error.message);
    return;
  }

  if (data.length >= 5) {
    pass(`Found ${data.length} active listing(s)`);
  } else {
    fail(`Only ${data.length} active listing(s) — need at least 5`);
  }
}

// ── Test 4: RLS blocks anon insert on profiles ──────────────────────────────
const RLS_TEST_ID = "00000000-0000-0000-0000-000000000000";

async function testRLS() {
  section("Issue #2 · RLS — anon cannot insert into profiles");

  const { error } = await supabase.from("profiles").insert({
    id: RLS_TEST_ID,
    name: "RLS Test User",
    college: "Warren",
  });

  if (error) {
    // Expect Postgres RLS rejection (code 42501) or a policy error message
    if (error.code === "42501" || error.message?.toLowerCase().includes("policy")) {
      pass(`Anon insert blocked by RLS (${error.code})`);
    } else {
      fail("Insert failed, but NOT due to RLS — possible schema issue", error.message);
    }
  } else {
    fail("Anon insert succeeded — RLS policy on profiles may be missing");
    // Clean up the accidentally-inserted row so re-runs are not affected
    await supabase.from("profiles").delete().eq("id", RLS_TEST_ID);
  }
}

// ── Test 5: Realtime channel subscribes on messages ─────────────────────────
async function testRealtime() {
  section("Issue #3 · Realtime — messages channel WebSocket connects");

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      fail(
        "Realtime subscription timed out after 5s — check Realtime is enabled on messages table"
      );
      channel.unsubscribe();
      resolve();
    }, 5000);

    const channel = supabase
      .channel("db-test-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {}
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(timeout);
          pass(
            "Realtime WebSocket channel connected — NOTE: does not confirm table-level replication is enabled"
          );
          channel.unsubscribe();
          resolve();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          clearTimeout(timeout);
          fail(`Realtime subscription failed with status: ${status}`);
          channel.unsubscribe();
          resolve();
        }
      });
  });
}

// ── Run all tests ────────────────────────────────────────────────────────────
async function run() {
  try {
    await testTables();
    await testSeedData();
    await testRLS();
    await testRealtime();
  } catch (err) {
    console.error("\nUnexpected error during tests:", err);
    failures++;
  }

  console.log(`\nDone. ${failures === 0 ? "All tests passed." : `${failures} test(s) failed.`}`);
  process.exit(failures > 0 ? 1 : 0);
}

run();
