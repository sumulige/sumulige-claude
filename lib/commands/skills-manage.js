/**
 * Skills Management Commands
 *
 * Skills management and diagnostic commands:
 * - doctor
 * - skills:search
 * - skills:validate
 * - skills:update
 * - skills:publish
 *
 * Extracted from lib/commands.js (lines 1628-2498)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline");
const {
  COLORS,
  log,
  getHomeDir,
  getGlobalClaudeDir,
  getGlobalSkillsDir,
  getProjectSkillsDir,
  getOfficialSkillsFile,
  getSourcesFile,
  rimraf,
  listSkillDirs,
} = require("./helpers");

module.exports = {
  // ---------------------------------------------------------------------------
  // doctor - Health check for SMC installation
  // ---------------------------------------------------------------------------
  doctor: () => {
    log("", "gray");
    log("🏥 SMC Health Check", "blue");
    log("=====================================", "gray");
    log("", "gray");

    const checks = [];
    let passCount = 0;
    let warnCount = 0;
    let failCount = 0;

    // Check 1: Global config
    const globalConfigDir = getGlobalClaudeDir();
    const globalConfigFile = path.join(globalConfigDir, "config.json");

    if (fs.existsSync(globalConfigFile)) {
      checks.push({
        name: "Global config",
        status: "pass",
        msg: globalConfigFile,
      });
      passCount++;
    } else {
      checks.push({
        name: "Global config",
        status: "fail",
        msg: "Run: smc init",
      });
      failCount++;
    }

    // Check 2: Project .claude directory
    const projectDir = process.cwd();
    const projectClaudeDir = path.join(projectDir, ".claude");

    if (fs.existsSync(projectClaudeDir)) {
      checks.push({
        name: "Project .claude/",
        status: "pass",
        msg: projectClaudeDir,
      });
      passCount++;

      // Check for key files
      const agentsFile = path.join(projectClaudeDir, "AGENTS.md");
      if (fs.existsSync(agentsFile)) {
        checks.push({ name: "AGENTS.md", status: "pass", msg: "Generated" });
        passCount++;
      } else {
        checks.push({
          name: "AGENTS.md",
          status: "warn",
          msg: "Run: smc sync",
        });
        warnCount++;
      }

      // Check MEMORY.md age
      const memoryFile = path.join(projectClaudeDir, "MEMORY.md");
      if (fs.existsSync(memoryFile)) {
        const stats = fs.statSync(memoryFile);
        const daysSinceUpdate =
          (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate > 30) {
          checks.push({
            name: "MEMORY.md",
            status: "warn",
            msg: `Updated ${Math.floor(daysSinceUpdate)} days ago`,
          });
          warnCount++;
        } else {
          checks.push({
            name: "MEMORY.md",
            status: "pass",
            msg: `Updated ${Math.floor(daysSinceUpdate)} days ago`,
          });
          passCount++;
        }
      } else {
        checks.push({ name: "MEMORY.md", status: "warn", msg: "Not found" });
        warnCount++;
      }

      // Check hooks
      const hooksDir = path.join(projectClaudeDir, "hooks");
      if (fs.existsSync(hooksDir)) {
        const hookFiles = fs
          .readdirSync(hooksDir)
          .filter((f) => !f.startsWith("."));
        checks.push({
          name: "Hooks",
          status: "pass",
          msg: `${hookFiles.length} hooks`,
        });
        passCount++;
      } else {
        checks.push({
          name: "Hooks",
          status: "warn",
          msg: "No hooks directory",
        });
        warnCount++;
      }

      // Check skills
      const skillsDir = path.join(projectClaudeDir, "skills");
      if (fs.existsSync(skillsDir)) {
        const skillDirs = listSkillDirs(skillsDir);
        checks.push({
          name: "Project Skills",
          status: "pass",
          msg: `${skillDirs.length} skills`,
        });
        passCount++;
      } else {
        checks.push({
          name: "Project Skills",
          status: "warn",
          msg: "No skills directory",
        });
        warnCount++;
      }
    } else {
      checks.push({
        name: "Project .claude/",
        status: "warn",
        msg: "Run: smc template or smc sync",
      });
      warnCount++;
    }

    // Check 3: OpenSkills
    try {
      execSync("openskills --version", { stdio: "ignore" });
      const globalSkillsDir = getGlobalSkillsDir();
      if (fs.existsSync(globalSkillsDir)) {
        const skillCount = listSkillDirs(globalSkillsDir).length;
        checks.push({
          name: "OpenSkills",
          status: "pass",
          msg: `${skillCount} global skills`,
        });
        passCount++;
      } else {
        checks.push({ name: "OpenSkills", status: "pass", msg: "Installed" });
        passCount++;
      }
    } catch {
      checks.push({
        name: "OpenSkills",
        status: "warn",
        msg: "Not installed (run: npm i -g openskills)",
      });
      warnCount++;
    }

    // Check 4: Git
    try {
      execSync("git rev-parse --git-dir", { stdio: "ignore", cwd: projectDir });
      checks.push({ name: "Git", status: "pass", msg: "Repository detected" });
      passCount++;
    } catch {
      checks.push({ name: "Git", status: "warn", msg: "Not a git repository" });
      warnCount++;
    }

    // Display results
    for (const check of checks) {
      const icon =
        check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
      const color =
        check.status === "pass"
          ? "green"
          : check.status === "warn"
            ? "yellow"
            : "red";
      log(`${icon} ${check.name}`, color);
      log(`   ${check.msg}`, "gray");
      log("", "gray");
    }

    log("=====================================", "gray");
    log(
      `Summary: ${passCount} passed, ${warnCount} warnings${failCount > 0 ? `, ${failCount} failed` : ""}`,
      "gray"
    );
    log("", "gray");

    if (failCount > 0) {
      log("Fix failed checks to continue.", "red");
    }
  },

  // ---------------------------------------------------------------------------
  // skills:search - Search for skills by keyword
  // ---------------------------------------------------------------------------
  "skills:search": (keyword) => {
    if (!keyword) {
      log("Usage: smc skills:search <keyword>", "yellow");
      log("", "gray");
      log("Examples:", "gray");
      log("  smc skills:search pdf", "gray");
      log('  smc skills:search "前端设计"', "gray");
      return;
    }

    log("", "gray");
    log(`🔍 Searching for: "${keyword}"`, "blue");
    log("=====================================", "gray");
    log("", "gray");

    const results = [];
    const lowerKeyword = keyword.toLowerCase();

    // Search in official skills registry
    const officialSkillsFile = getOfficialSkillsFile();
    if (fs.existsSync(officialSkillsFile)) {
      const registry = JSON.parse(fs.readFileSync(officialSkillsFile, "utf-8"));

      for (const skill of registry.skills) {
        const matchName = skill.name.toLowerCase().includes(lowerKeyword);
        const matchDesc = skill.description
          .toLowerCase()
          .includes(lowerKeyword);
        const matchCat = registry.categories[skill.category]?.name
          .toLowerCase()
          .includes(lowerKeyword);

        if (matchName || matchDesc || matchCat) {
          results.push({
            name: skill.name,
            description: skill.description,
            category: registry.categories[skill.category]?.name,
            source: "official",
            recommended: skill.recommended,
          });
        }
      }
    }

    // Search in sources.yaml
    const sourcesFile = getSourcesFile();
    if (fs.existsSync(sourcesFile)) {
      const content = fs.readFileSync(sourcesFile, "utf-8");
      // Simple YAML parsing for skills
      const lines = content.split("\n");
      let currentSkill = null;

      for (const line of lines) {
        const nameMatch = line.match(/^\s*-\s*name:\s*(.+)$/);
        if (nameMatch) {
          currentSkill = { name: nameMatch[1].trim(), source: "marketplace" };
          if (currentSkill.name.toLowerCase().includes(lowerKeyword)) {
            results.push(currentSkill);
          }
        }
        const descMatch = line.match(/^\s+description:\s*"(.+)"$/);
        if (descMatch && currentSkill) {
          currentSkill.description = descMatch[1];
          if (currentSkill.description.toLowerCase().includes(lowerKeyword)) {
            results.push({ ...currentSkill });
          }
        }
      }
    }

    // Search in global skills
    const globalSkillsDir = getGlobalSkillsDir();
    if (fs.existsSync(globalSkillsDir)) {
      const skillDirs = listSkillDirs(globalSkillsDir);

      for (const skillName of skillDirs) {
        if (skillName.toLowerCase().includes(lowerKeyword)) {
          // Check if already in results
          if (!results.some((r) => r.name === skillName)) {
            const skillFile = path.join(globalSkillsDir, skillName, "SKILL.md");
            let description = "";
            if (fs.existsSync(skillFile)) {
              const content = fs.readFileSync(skillFile, "utf-8");
              const descMatch = content.match(/description:\s*(.+)/);
              if (descMatch) description = descMatch[1];
            }
            results.push({
              name: skillName,
              description: description || "Local skill",
              source: "installed",
            });
          }
        }
      }
    }

    // Display results
    if (results.length === 0) {
      log("No skills found matching your search.", "yellow");
    } else {
      for (const result of results) {
        const sourceIcon =
          result.source === "official"
            ? "🔷"
            : result.source === "marketplace"
              ? "📦"
              : "✓";
        const rec = result.recommended ? " [推荐]" : "";
        log(`${sourceIcon} ${result.name}${rec}`, "cyan");
        if (result.description) {
          log(`   ${result.description}`, "gray");
        }
        if (result.category) {
          log(`   分类: ${result.category}`, "gray");
        }
        log("", "gray");
      }
    }

    log("=====================================", "gray");
    log(`Found ${results.length} result(s)`, "gray");
    log("", "gray");
  },

  // ---------------------------------------------------------------------------
  // skills:validate - Validate skill structure and metadata
  // ---------------------------------------------------------------------------
  "skills:validate": (skillPath) => {
    // Default to current directory if not specified
    const targetPath =
      skillPath || path.join(process.cwd(), ".claude/skills");

    if (!fs.existsSync(targetPath)) {
      log(`❌ Path not found: ${targetPath}`, "red");
      return;
    }

    log("", "gray");
    log("🔍 Validating Skills", "blue");
    log("=====================================", "gray");
    log("", "gray");

    const checks = [];
    let passCount = 0;
    let failCount = 0;

    // Check if it's a directory or a single skill
    const stats = fs.statSync(targetPath);

    const validateSkill = (skillDir) => {
      const skillName = path.basename(skillDir);
      const skillFile = path.join(skillDir, "SKILL.md");
      const errors = [];
      const warnings = [];

      // Check SKILL.md exists
      if (!fs.existsSync(skillFile)) {
        errors.push("SKILL.md not found");
        return { name: skillName, errors, warnings };
      }

      // Parse SKILL.md
      const content = fs.readFileSync(skillFile, "utf-8");
      const frontmatterMatch = content.match(/^---\n(.*?)\n---/s);

      if (!frontmatterMatch) {
        errors.push("No frontmatter found (--- delimited YAML required)");
      } else {
        const frontmatter = frontmatterMatch[1];

        // Check required fields
        if (!frontmatter.match(/name:\s*.+/)) {
          errors.push('Missing "name" in frontmatter');
        }
        if (!frontmatter.match(/description:\s*.+/)) {
          warnings.push('Missing "description" in frontmatter (recommended)');
        }
      }

      // Check for references directory if referenced
      if (
        content.includes("references/") &&
        !fs.existsSync(path.join(skillDir, "references"))
      ) {
        warnings.push(
          'Content references "references/" but directory not found'
        );
      }

      return { name: skillName, errors, warnings };
    };

    if (stats.isDirectory()) {
      // Check if it's a skills directory or a single skill
      const skillFile = path.join(targetPath, "SKILL.md");
      if (fs.existsSync(skillFile)) {
        // Single skill
        const result = validateSkill(targetPath);
        checks.push(result);
      } else {
        // Skills directory - validate all subdirectories
        const entries = fs.readdirSync(targetPath);
        for (const entry of entries) {
          const entryPath = path.join(targetPath, entry);
          const entryStats = fs.statSync(entryPath);
          if (entryStats.isDirectory() && !entry.startsWith(".")) {
            const result = validateSkill(entryPath);
            checks.push(result);
          }
        }
      }
    }

    // Display results
    for (const check of checks) {
      if (check.errors.length === 0 && check.warnings.length === 0) {
        log(`✅ ${check.name}`, "green");
        passCount++;
      } else if (check.errors.length === 0) {
        log(`⚠️  ${check.name}`, "yellow");
        passCount++;
      } else {
        log(`❌ ${check.name}`, "red");
        failCount++;
      }

      for (const error of check.errors) {
        log(`   ❌ ${error}`, "red");
      }
      for (const warning of check.warnings) {
        log(`   ⚠️  ${warning}`, "yellow");
      }
      log("", "gray");
    }

    log("=====================================", "gray");
    log(
      `Validated ${checks.length} skill(s): ${passCount} passed${failCount > 0 ? `, ${failCount} failed` : ""}`,
      "gray"
    );
    log("", "gray");
  },

  // ---------------------------------------------------------------------------
  // skills:update - Update official skills list from anthropics/skills
  // ---------------------------------------------------------------------------
  "skills:update": () => {
    log("", "gray");
    log("🔄 Updating Official Skills List", "blue");
    log("=====================================", "gray");
    log("", "gray");

    // Fetch latest skills from anthropics/skills
    const tempDir = path.join(__dirname, "../../.tmp");
    const repoUrl = "https://github.com/anthropics/skills.git";

    try {
      // Create temp dir
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const cloneDir = path.join(tempDir, "anthropics-skills");

      // Remove existing clone if present
      rimraf(cloneDir);

      log("Cloning anthropics/skills...", "gray");
      execSync(`git clone --depth 1 ${repoUrl} ${cloneDir}`, { stdio: "pipe" });

      // Read skills directory to get available skills
      const skillsDir = path.join(cloneDir, "skills");
      const skillCategories = fs.readdirSync(skillsDir).filter((f) => {
        const dir = path.join(skillsDir, f);
        return fs.statSync(dir).isDirectory();
      });

      log(`Found ${skillCategories.length} skills in repository`, "gray");
      log("", "gray");

      // Update the registry file
      const registryFile = getOfficialSkillsFile();
      let registry = {
        version: "1.0.0",
        last_updated: new Date().toISOString().split("T")[0],
        source: "anthropics/skills",
        categories: {},
        skills: [],
      };

      if (fs.existsSync(registryFile)) {
        registry = JSON.parse(fs.readFileSync(registryFile, "utf-8"));
      }

      // Update timestamp
      registry.last_updated = new Date().toISOString().split("T")[0];

      fs.writeFileSync(registryFile, JSON.stringify(registry, null, 2));

      // Cleanup
      rimraf(cloneDir);

      log("✅ Official skills list updated", "green");
      log(`   Updated: ${registry.last_updated}`, "gray");
      log("", "gray");
      log("Run: smc skills:official", "gray");
    } catch (e) {
      log("❌ Update failed", "red");
      log(`   ${e.message}`, "gray");
    }
  },

  // ---------------------------------------------------------------------------
  // skills:publish - Publish a skill to GitHub
  // ---------------------------------------------------------------------------
  "skills:publish": (skillPath) => {
    // Default to current directory's skills folder
    const targetPath =
      skillPath || path.join(process.cwd(), ".claude/skills");

    if (!fs.existsSync(targetPath)) {
      log(`❌ Path not found: ${targetPath}`, "red");
      log("", "gray");
      log("Usage: smc skills:publish [skill-path]", "yellow");
      log("  Creates a GitHub repo with your skill", "gray");
      return;
    }

    log("", "gray");
    log("📦 Publish Skill to GitHub", "blue");
    log("=====================================", "gray");
    log("", "gray");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (prompt) => {
      return new Promise((resolve) => {
        rl.question(prompt, resolve);
      });
    };

    (async () => {
      // Get skill info
      const stat = fs.statSync(targetPath);
      let skillName, skillDir;

      if (stat.isDirectory()) {
        const skillFile = path.join(targetPath, "SKILL.md");
        if (fs.existsSync(skillFile)) {
          // Single skill directory
          skillDir = targetPath;
          skillName = path.basename(targetPath);
        } else {
          // Skills directory - ask which skill
          const entries = fs.readdirSync(targetPath).filter((f) => {
            const dir = path.join(targetPath, f);
            return (
              fs.statSync(dir).isDirectory() &&
              !f.startsWith(".") &&
              f !== "template" &&
              f !== "examples"
            );
          });

          if (entries.length === 0) {
            log("❌ No skills found in directory", "red");
            rl.close();
            return;
          }

          log("Found skills:", "gray");
          entries.forEach((e, i) => log(`  ${i + 1}. ${e}`, "gray"));
          log("", "gray");

          const choice = await question("Select skill [1]: ");
          const index = parseInt(choice || "1") - 1;
          skillName = entries[index] || entries[0];
          skillDir = path.join(targetPath, skillName);
        }
      } else {
        log("❌ Path must be a directory", "red");
        rl.close();
        return;
      }

      // Read SKILL.md to get info
      const skillFile = path.join(skillDir, "SKILL.md");
      if (!fs.existsSync(skillFile)) {
        log("❌ SKILL.md not found. A skill must have SKILL.md", "red");
        rl.close();
        return;
      }

      const skillContent = fs.readFileSync(skillFile, "utf-8");
      const nameMatch = skillContent.match(/name:\s*(.+)/);
      const descMatch = skillContent.match(/description:\s*(.+)/);
      const displayName = nameMatch ? nameMatch[1].trim() : skillName;
      const description = descMatch ? descMatch[1].trim() : "";

      log(`Skill: ${displayName}`, "cyan");
      if (description) {
        log(`Description: ${description}`, "gray");
      }
      log(`Path: ${skillDir}`, "gray");
      log("", "gray");

      // Get GitHub info
      const githubUser = await question("GitHub username: ");
      if (!githubUser) {
        log("❌ GitHub username required", "red");
        rl.close();
        return;
      }

      const repoName =
        (await question(`Repository name [${skillName}]: `)) || skillName;
      const isPrivate = await question("Private repo? [y/N]: ");

      rl.close();

      log("", "gray");
      log("📝 Instructions:", "yellow");
      log("", "gray");
      log(`1. Create GitHub repo:`, "gray");
      log(`   https://github.com/new`, "gray");
      log(`   Name: ${repoName}`, "gray");
      log(
        `   ${isPrivate.toLowerCase() === "y" ? "Private" : "Public"}`,
        "gray"
      );
      log("", "gray");
      log(`2. Initialize git and push:`, "gray");
      log(`   cd ${skillDir}`, "gray");
      log(`   git init`, "gray");
      log(`   git add .`, "gray");
      log(`   git commit -m "Initial commit"`, "gray");
      log(`   git branch -M main`, "gray");
      log(
        `   git remote add origin https://github.com/${githubUser}/${repoName}.git`,
        "gray"
      );
      log(`   git push -u origin main`, "gray");
      log("", "gray");
      log(`3. Add to sources.yaml:`, "gray");
      log(`   - name: ${skillName}`, "gray");
      log(`     source:`, "gray");
      log(`       repo: ${githubUser}/${repoName}`, "gray");
      log(`       path: .`, "gray");
      log(`     target:`, "gray");
      log(`       category: tools`, "gray");
      log(`       path: template/.claude/skills/tools/${skillName}`, "gray");
      log("", "gray");

      // Ask if user wants to auto-execute
      const rl2 = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl2.question("Auto-execute git commands? [y/N]: ", (autoExecute) => {
        rl2.close();

        if (autoExecute.toLowerCase() === "y") {
          try {
            log("", "gray");
            log("Initializing git...", "gray");
            execSync("git init", { cwd: skillDir, stdio: "pipe" });
            execSync("git add .", { cwd: skillDir, stdio: "pipe" });
            execSync('git commit -m "Initial commit"', {
              cwd: skillDir,
              stdio: "pipe",
            });
            execSync("git branch -M main", { cwd: skillDir, stdio: "pipe" });
            log("✅ Git initialized", "green");

            log("Adding remote...", "gray");
            execSync(
              `git remote add origin https://github.com/${githubUser}/${repoName}.git`,
              { cwd: skillDir, stdio: "pipe" }
            );
            log("✅ Remote added", "green");

            log("", "gray");
            log("⚠️  Please create the GitHub repo first, then run:", "yellow");
            log(`   cd ${skillDir} && git push -u origin main`, "gray");
          } catch (e) {
            log("❌ Failed to initialize git", "red");
            log(`   ${e.message}`, "gray");
          }
        }

        log("", "gray");
        log("=====================================", "gray");
        log("✅ Skill publishing guide complete", "green");
        log("", "gray");
      });
    })();
  },
};
