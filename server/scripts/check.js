import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Find all JavaScript files inside a folder.
function collectJavaScriptFiles(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(directory, entry.name);

      // Skip the node_modules folder.
      if (entry.name === "node_modules") {
        return [];
      }

      // If it is another folder,
      // search inside it as well.
      if (entry.isDirectory()) {
        return collectJavaScriptFiles(fullPath);
      }

      // Keep only .js files.
      if (entry.name.endsWith(".js")) {
        return [fullPath];
      }

      return [];
    });
}

// Check every JavaScript file in the project.
for (const file of collectJavaScriptFiles(process.cwd())) {
  // Run Node.js syntax checking.
  const result = spawnSync(
    process.execPath,
    ["--check", file],
    {
      stdio: "inherit",
    },
  );

  // Stop immediately if a syntax error is found.
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// Print a success message if every file is valid.
console.log("Server JavaScript syntax check passed.");