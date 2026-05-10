import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));

const reset = "\x1b[0m";
const bold = "\x1b[1m";
const cyan = "\x1b[36m";
const green = "\x1b[32m";
const dim = "\x1b[2m";
const yellow = "\x1b[33m";

const nodeVersion = process.version;
const appName = pkg.name;
const appVersion = pkg.version;

console.log("");
console.log(`${cyan}${bold}  ╔══════════════════════════════════════╗${reset}`);
console.log(`${cyan}${bold}  ║         ${green}${appName}${cyan}         ║${reset}`);
console.log(`${cyan}${bold}  ╚══════════════════════════════════════╝${reset}`);
console.log("");
console.log(`  ${dim}version   ${reset}${bold}${appVersion}${reset}`);
console.log(`  ${dim}node      ${reset}${bold}${nodeVersion}${reset}`);
console.log(`  ${dim}framework ${reset}${bold}Next.js ${pkg.dependencies.next}${reset}`);
console.log(`  ${dim}env       ${reset}${bold}${process.env.NODE_ENV ?? "development"}${reset}`);
console.log("");
console.log(`  ${yellow}▶ Starting dev server…${reset}`);
console.log("");

execSync("next dev", { stdio: "inherit" });
