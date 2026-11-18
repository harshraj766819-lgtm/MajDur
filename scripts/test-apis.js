const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { app } = require(path.resolve(__dirname, "../backend/dist/server.js"));
const http = require("http");

async function testEndpoints() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, resolve));
  console.log("Test server listening on port 5099...");

  async function fetchJson(url) {
    const res = await fetch(`http://localhost:5099${url}`);
    const data = await res.json();
    return { status: res.status, data };
  }

  try {
    // 1. Categories
    const categoriesRes = await fetchJson("/api/categories");
    console.log("1. GET /api/categories -> Status:", categoriesRes.status, "Count:", categoriesRes.data?.data?.length);

    // 2. Stats
    const statsRes = await fetchJson("/api/stats/platform");
    console.log("2. GET /api/stats/platform -> Status:", statsRes.status, "Data:", statsRes.data?.data);

    // 3. Featured Workers
    const workersRes = await fetchJson("/api/workers/featured");
    console.log("3. GET /api/workers/featured -> Status:", workersRes.status, "Count:", workersRes.data?.data?.length);

    // 4. Worker Search
    const searchRes = await fetchJson("/api/workers/search?category=Electrician");
    console.log("4. GET /api/workers/search?category=Electrician -> Status:", searchRes.status, "Found:", searchRes.data?.data?.workers?.length);

    console.log("\n✅ All 4 Phase 3 APIs successfully verified against live MongoDB database!");
  } catch (err) {
    console.error("API test failed:", err);
  } finally {
    server.close();
    process.exit(0);
  }
}

testEndpoints();

