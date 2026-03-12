const { execSync } = require("child_process");

const packages = [
  "@rollup/rollup-linux-x64-gnu",
  "@swc/core-linux-x64-gnu",
  "@swc/core-linux-x64-musl"
];

const isLinuxX64 = process.platform === "linux" && process.arch === "x64";
if (!isLinuxX64) {
  console.log("[ensure-native] Non-linux-x64 environment. Skipping.");
  process.exit(0);
}

console.log("[ensure-native] Checking native bindings for Linux x64...");

packages.forEach(packageName => {
  try {
    require.resolve(packageName);
    console.log(`[ensure-native] ✅ ${packageName} already installed.`);
  } catch (error) {
    console.log(`[ensure-native] ⚠️ ${packageName} missing. Installing fallback...`);
    try {
      execSync(`npm install --no-save --include=optional ${packageName}`, {
        stdio: "inherit",
      });
      console.log(`[ensure-native] ✅ ${packageName} installed successfully.`);
    } catch (installError) {
      console.error(`[ensure-native] ❌ Failed to install ${packageName}.`);
    }
  }
});
