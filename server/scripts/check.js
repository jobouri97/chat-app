import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function collectJavaScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.name === "node_modules") return [];
    return entry.isDirectory() ? collectJavaScriptFiles(fullPath) : (entry.name.endsWith(".js") ? [fullPath] : []);
  });
}

for (const file of collectJavaScriptFiles(process.cwd())) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("Server JavaScript syntax check passed.");
