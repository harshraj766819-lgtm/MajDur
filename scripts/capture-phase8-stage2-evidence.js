/**
 * MajDur Phase 8 Stage 2: Chrome Screenshot & Visual QA Runner
 * Developer: Harsh Singh
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = path.resolve(__dirname, "../test-evidence/phase8-stage2");

const VIEWPORTS = [
  { name: "desktop-1920x1080", width: 1920, height: 1080, category: "responsive" },
  { name: "laptop-1366x768", width: 1366, height: 768, category: "responsive" },
  { name: "tablet-768x1024", width: 768, height: 1024, category: "responsive" },
  { name: "mobile-390x844", width: 390, height: 844, category: "responsive" },
  { name: "small-mobile-360x800", width: 360, height: 800, category: "responsive" },
];

const ROUTES = [
  { path: "/dashboard/notifications", name: "notifications", category: "notifications" },
  { path: "/dashboard/messages", name: "messages-inbox", category: "chat" },
  { path: "/", name: "homepage-nav-bell", category: "regression" },
  { path: "/workers", name: "workers-directory", category: "regression" },
  { path: "/dashboard/customer/bookings", name: "customer-bookings", category: "regression" },
];

async function captureEvidence() {
  console.log("======================================================");
  console.log("📸 Capturing Phase 8 Stage 2 Chrome Browser Evidence");
  console.log("======================================================\n");

  const manifest = [];

  for (const route of ROUTES) {
    const url = `${BASE_URL}${route.path}`;
    console.log(`\nNavigating to: ${url}`);

    for (const vp of VIEWPORTS) {
      const fileName = `${route.name}-${vp.name}.png`;
      const categoryDir = path.join(OUTPUT_DIR, route.category);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }
      const outPath = path.join(categoryDir, fileName);

      const cmd = `"${CHROME_PATH}" --headless=old --disable-gpu --window-size=${vp.width},${vp.height} --screenshot="${outPath}" "${url}"`;

      try {
        execSync(cmd, { stdio: "pipe", timeout: 25000 });
        const stats = fs.statSync(outPath);
        console.log(`  ✓ [${vp.name}] ${fileName} (${stats.size} bytes)`);
        manifest.push({
          route: route.path,
          viewport: vp.name,
          dimensions: `${vp.width}x${vp.height}`,
          category: route.category,
          file: fileName,
          path: outPath,
          size: stats.size,
          status: "CAPTURED",
        });
      } catch (err) {
        console.error(`  ✗ [${vp.name}] Failed to capture ${fileName}: ${err.message}`);
      }
    }
  }

  // Save manifest
  const manifestPath = path.join(OUTPUT_DIR, "reports", "screenshot-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nSaved screenshot manifest to: ${manifestPath}`);
  console.log(`Total screenshots captured: ${manifest.length}`);
}

captureEvidence();

