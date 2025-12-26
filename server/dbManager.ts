/**
 * Database Management CLI
 * Quick commands to manage alerts in the database
 */

import { exec } from "child_process";
import { promisify } from "util";
import readline from "readline";

const execAsync = promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function clearAllAlerts() {
  console.log("\n⚠️  WARNING: This will delete ALL alerts from the database!");
  const confirm = await question("Are you sure? Type 'yes' to confirm: ");
  
  if (confirm.toLowerCase() !== "yes") {
    console.log("❌ Cancelled");
    return;
  }

  console.log("\n🗑️  Deleting all alerts...");
  
  try {
    const { stdout, stderr } = await execAsync("npx convex run migration:clearAllAlerts");
    console.log(stdout);
    if (stderr && !stderr.includes("Assertion failed")) {
      console.error(stderr);
    }
    console.log("✅ All alerts deleted successfully!\n");
  } catch (error: any) {
    // Check if operation succeeded despite Node.js cleanup error
    if (error.stdout && error.stdout.includes("deleted")) {
      console.log(error.stdout);
      console.log("✅ All alerts deleted successfully!\n");
      console.log("ℹ️  (Ignoring Node.js cleanup error on Windows)\n");
    } else {
      console.error("❌ Error:", error.message || error);
    }
  }
}

async function countAlerts() {
  console.log("\n📊 Counting alerts...");
  
  try {
    const { stdout, stderr } = await execAsync("npx convex run migration:countAlerts");
    console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

async function migrateAlerts() {
  console.log("\n🔄 Migrating old format alerts to SIA DC-09...");
  
  try {
    const { stdout, stderr } = await execAsync("npx convex run migration:migrateContactIdToSiaDC09");
    console.log(stdout);
    if (stderr) console.error(stderr);
    console.log("✅ Migration complete!\n");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

async function listAlerts() {
  console.log("\n📋 Listing recent alerts...");
  
  try {
    const { stdout, stderr } = await execAsync("npx convex run migration:listAlerts");
    console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

async function showMenu() {
  console.log("\n" + "═".repeat(60));
  console.log("🗄️  Database Management CLI");
  console.log("═".repeat(60));
  console.log("\n1. 📊 Count alerts");
  console.log("2. 📋 List recent alerts (last 20)");
  console.log("3. 🔄 Migrate old format to SIA DC-09");
  console.log("4. 🗑️  Clear ALL alerts (⚠️  DANGER)");
  console.log("5. ❌ Exit");
  console.log("\n" + "─".repeat(60));
  
  const choice = await question("\nSelect option (1-5): ");
  
  switch (choice.trim()) {
    case "1":
      await countAlerts();
      break;
    case "2":
      await listAlerts();
      break;
    case "3":
      await migrateAlerts();
      break;
    case "4":
      await clearAllAlerts();
      break;
    case "5":
      console.log("\n👋 Goodbye!\n");
      rl.close();
      return false;
    default:
      console.log("\n❌ Invalid option");
  }
  
  return true;
}

async function main() {
  let continueRunning = true;
  
  while (continueRunning) {
    continueRunning = await showMenu();
  }
}

main().catch(console.error);
