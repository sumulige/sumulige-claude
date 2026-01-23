/**
 * Skills Official Commands
 *
 * Official skills registry commands:
 * - skills:official
 * - skills:install-official
 * - skills:install-all
 *
 * Extracted from lib/commands.js (lines 1388-1625)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const {
  COLORS,
  log,
  getGlobalSkillsDir,
  getOfficialSkillsFile,
  listSkillDirs,
} = require("./helpers");

module.exports = {
  // ---------------------------------------------------------------------------
  // skills:official - List official skills from anthropics/skills registry
  // ---------------------------------------------------------------------------
  "skills:official": () => {
    const officialSkillsFile = getOfficialSkillsFile();

    if (!fs.existsSync(officialSkillsFile)) {
      log("⚠ Official skills registry not found", "yellow");
      return;
    }

    const registry = JSON.parse(fs.readFileSync(officialSkillsFile, "utf-8"));

    log("", "gray");
    log("📚 Official Skills (anthropics/skills)", "blue");
    log("=====================================", "gray");
    log("", "gray");
    log(`Source: ${registry.source}`, "gray");
    log(`Updated: ${registry.last_updated}`, "gray");
    log("", "gray");

    // Check which skills are already installed
    const skillsDir = getGlobalSkillsDir();
    const installedSkills = listSkillDirs(skillsDir);

    // Group by category
    const byCategory = {};
    for (const cat of Object.values(registry.categories)) {
      byCategory[cat.name] = { skills: [], ...cat };
    }

    for (const skill of registry.skills) {
      const catName = registry.categories[skill.category].name;
      const isInstalled = installedSkills.includes(skill.name);
      byCategory[catName].skills.push({ ...skill, isInstalled });
    }

    // Display by category
    for (const [catName, cat] of Object.entries(byCategory)) {
      if (cat.skills.length === 0) continue;

      log(`${cat.icon} ${catName}`, "cyan");
      log(`   ${cat.description}`, "gray");
      log("", "gray");

      for (const skill of cat.skills) {
        const status = skill.isInstalled ? "✓" : " ";
        const rec = skill.recommended ? " [推荐]" : "";
        const color = skill.isInstalled ? "green" : "reset";
        log(`  [${status}] ${skill.name}${rec}`, color);
        log(`      ${skill.description}`, "gray");
      }
      log("", "gray");
    }

    log("=====================================", "gray");
    log("", "gray");
    log("Commands:", "gray");
    log("  smc skills:install-official <name>   Install a skill", "gray");
    log(
      "  smc skills:install-all               Install all recommended",
      "gray"
    );
    log("", "gray");
  },

  // ---------------------------------------------------------------------------
  // skills:install-official - Install a specific official skill
  // ---------------------------------------------------------------------------
  "skills:install-official": (skillName) => {
    const officialSkillsFile = getOfficialSkillsFile();

    if (!fs.existsSync(officialSkillsFile)) {
      log("⚠ Official skills registry not found", "yellow");
      return;
    }

    const registry = JSON.parse(fs.readFileSync(officialSkillsFile, "utf-8"));

    // Check if openskills is installed
    try {
      execSync("openskills --version", { stdio: "ignore" });
    } catch {
      log("⚠ OpenSkills not installed", "yellow");
      log("", "gray");
      log("Installing OpenSkills...", "gray");
      try {
        execSync("npm i -g openskills", { stdio: "inherit" });
        log("✅ OpenSkills installed", "green");
      } catch (e) {
        log("❌ Failed to install OpenSkills", "red");
        log("   Run: npm i -g openskills", "gray");
        return;
      }
    }

    // Find the skill
    const skill = registry.skills.find((s) => s.name === skillName);

    if (!skill) {
      log(`❌ Skill "${skillName}" not found in official registry`, "red");
      log("", "gray");
      log("Run: smc skills:official");
      log("to see available skills.", "gray");
      return;
    }

    log(`📦 Installing: ${skillName}`, "blue");
    log("", "gray");
    log(`Source: ${skill.source}`, "gray");
    log(`License: ${skill.license}`, "gray");
    log("", "gray");

    try {
      execSync(`openskills install ${skill.source} -y`, { stdio: "inherit" });
      execSync("openskills sync -y", { stdio: "pipe" });
      log("", "gray");
      log("✅ Skill installed successfully", "green");
      log("", "gray");
      log("The skill is now available in your conversations.", "gray");
    } catch (e) {
      log("❌ Installation failed", "red");
    }
  },

  // ---------------------------------------------------------------------------
  // skills:install-all - Install all recommended official skills
  // ---------------------------------------------------------------------------
  "skills:install-all": () => {
    const officialSkillsFile = getOfficialSkillsFile();

    if (!fs.existsSync(officialSkillsFile)) {
      log("⚠ Official skills registry not found", "yellow");
      return;
    }

    const registry = JSON.parse(fs.readFileSync(officialSkillsFile, "utf-8"));
    const recommended = registry.skills.filter((s) => s.recommended);

    log("", "gray");
    log("📦 Installing All Recommended Skills", "blue");
    log("=====================================", "gray");
    log("", "gray");
    log(`Installing ${recommended.length} skills...`, "gray");
    log("", "gray");

    // Check if openskills is installed
    try {
      execSync("openskills --version", { stdio: "ignore" });
    } catch {
      log("⚠ OpenSkills not installed. Installing...", "yellow");
      try {
        execSync("npm i -g openskills", { stdio: "inherit" });
        log("✅ OpenSkills installed", "green");
        log("", "gray");
      } catch (e) {
        log("❌ Failed to install OpenSkills", "red");
        return;
      }
    }

    // Install anthropics/skills (includes all skills)
    try {
      log(`Installing ${registry.source}...`, "cyan");
      execSync(`openskills install ${registry.source} -y`, {
        stdio: "inherit",
      });
      execSync("openskills sync -y", { stdio: "pipe" });
      log("", "gray");
      log("✅ All skills installed successfully", "green");
      log("", "gray");
      log("Installed skills:", "gray");
      recommended.forEach((s) => log(`  • ${s.name}`, "gray"));
      log("", "gray");
      log("These skills are now available in your conversations.", "gray");
    } catch (e) {
      log("❌ Installation failed", "red");
    }
  },
};
