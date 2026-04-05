/**
 * Windows EPERM fix: Prisma cannot rename query_engine-windows.dll.node when another
 * process (Next dev server, IDE) holds a lock. Removing .prisma/client first often helps.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const clientDir = path.join(root, "node_modules", ".prisma", "client");

try {
  fs.rmSync(clientDir, { recursive: true, force: true });
  console.log("[prisma-generate] removed node_modules/.prisma/client");
} catch (e) {
  console.warn(
    "[prisma-generate] could not remove client dir — stop `next dev` and retry:",
    e instanceof Error ? e.message : e
  );
}

const r = spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  shell: true,
  cwd: root,
});

process.exit(typeof r.status === "number" ? r.status : 1);
