const { execSync } = require("child_process");

const packageName = "@rollup/rollup-linux-x64-gnu";

const isLinuxX64 = process.platform === "linux" && process.arch === "x64";
if (!isLinuxX64) {
  console.log("[ensure-rollup-native] Non-linux-x64 environment. Skipping.");
  process.exit(0);
}

try {
  require.resolve(packageName);
  console.log(`[ensure-rollup-native] ${packageName} already installed.`);
  process.exit(0);
} catch (error) {
  console.log(
    `[ensure-rollup-native] ${packageName} missing. Installing fallback...`
  );
}

try {
  execSync(`npm install --no-save --include=optional ${packageName}`, {
    stdio: "inherit",
  });
  console.log(`[ensure-rollup-native] ${packageName} installed successfully.`);
} catch (error) {
  console.error(
    `[ensure-rollup-native] Failed to install ${packageName}. Build may fail if optional deps are omitted by host.`
  );
  process.exit(1);
}
