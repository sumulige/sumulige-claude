/**
 * Skills Core Commands
 *
 * Core skill management commands:
 * - skill:list
 * - skill:create
 * - skill:check
 * - skill:install
 *
 * Extracted from lib/commands.js (lines 721-952)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const {
  log,
  parseSimpleYaml,
  getProjectSkillsDir,
  ensureDir,
  toTitleCase,
} = require("./helpers");

const TEMPLATE_DIR = path.join(__dirname, "../../template");

module.exports = {
  // ---------------------------------------------------------------------------
  // skill:list - List installed skills via OpenSkills
  // ---------------------------------------------------------------------------
  "skill:list": () => {
    try {
      const result = execSync("openskills list", { encoding: "utf-8" });
      console.log(result);
    } catch (e) {
      console.log("⚠️  OpenSkills not installed. Run: npm i -g openskills");
    }
  },

  // ---------------------------------------------------------------------------
  // skill:create - Create a new skill from template
  // ---------------------------------------------------------------------------
  "skill:create": (skillName) => {
    if (!skillName) {
      console.log("Usage: sumulige-claude skill:create <skill-name>");
      console.log("");
      console.log("Example: sumulige-claude skill:create api-tester");
      console.log("");
      console.log("The skill will be created at:");
      console.log("  .claude/skills/<skill-name>/");
      return;
    }

    // Validate skill name (kebab-case)
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(skillName)) {
      console.log(
        "❌ Invalid skill name. Use kebab-case (e.g., api-tester, code-reviewer)"
      );
      return;
    }

    const projectDir = process.cwd();
    const skillsDir = path.join(projectDir, ".claude", "skills");
    const skillDir = path.join(skillsDir, skillName);
    const templateDir = path.join(
      TEMPLATE_DIR,
      ".claude",
      "skills",
      "template"
    );

    // Check if skill already exists
    if (fs.existsSync(skillDir)) {
      console.log(`⚠️  Skill "${skillName}" already exists at ${skillDir}`);
      return;
    }

    console.log(`📝 Creating skill: ${skillName}`);
    console.log("");

    // Create skill directory structure
    fs.mkdirSync(path.join(skillDir, "templates"), { recursive: true });
    fs.mkdirSync(path.join(skillDir, "examples"), { recursive: true });
    console.log("✅ Created directory structure");

    // Copy template files
    if (fs.existsSync(templateDir)) {
      const skillTemplate = fs.readFileSync(
        path.join(templateDir, "SKILL.md"),
        "utf-8"
      );
      const metadataTemplate = fs.readFileSync(
        path.join(templateDir, "metadata.yaml"),
        "utf-8"
      );

      // Replace placeholders
      const date = new Date().toISOString().split("T")[0];
      let skillContent = skillTemplate
        .replace(/Skill Name/g, toTitleCase(skillName.replace(/-/g, " ")))
        .replace(/{current-date}/g, date)
        .replace(/skill-name/g, skillName);

      let metadataContent = metadataTemplate.replace(/skill-name/g, skillName);

      fs.writeFileSync(path.join(skillDir, "SKILL.md"), skillContent);
      fs.writeFileSync(path.join(skillDir, "metadata.yaml"), metadataContent);
      console.log("✅ Created SKILL.md and metadata.yaml");
    }

    // Create example templates
    fs.writeFileSync(
      path.join(skillDir, "templates", "default.md"),
      `# Default Template for ${skillName}\n\nReplace this with your actual template.\n`
    );
    fs.writeFileSync(
      path.join(skillDir, "examples", "basic.md"),
      `# Basic Example for ${skillName}\n\nReplace this with your actual example.\n`
    );
    console.log("✅ Created templates and examples");

    // Update RAG index
    const ragDir = path.join(projectDir, ".claude", "rag");
    const ragIndexFile = path.join(ragDir, "skill-index.json");
    let ragIndex = { skills: [], auto_load: { enabled: true } };

    ensureDir(ragDir);

    if (fs.existsSync(ragIndexFile)) {
      try {
        ragIndex = JSON.parse(fs.readFileSync(ragIndexFile, "utf-8"));
      } catch (e) {}
    }

    // Add new skill to index
    const newSkill = {
      name: skillName,
      description: `TODO: Add description for ${skillName}`,
      keywords: [skillName.replace(/-/g, " ")],
      path: `.claude/skills/${skillName}/SKILL.md`,
    };

    // Avoid duplicates
    if (!ragIndex.skills.some((s) => s.name === skillName)) {
      ragIndex.skills.push(newSkill);
      fs.writeFileSync(ragIndexFile, JSON.stringify(ragIndex, null, 2));
      console.log("✅ Updated RAG skill index");
    }

    console.log("");
    console.log("✅ Skill created successfully!");
    console.log("");
    console.log(`Next steps:`);
    console.log(`  1. Edit .claude/skills/${skillName}/SKILL.md`);
    console.log(`  2. Add your templates and examples`);
    console.log(`  3. Use in Claude Code: /skill ${skillName}`);
  },

  // ---------------------------------------------------------------------------
  // skill:check - Check skill dependencies
  // ---------------------------------------------------------------------------
  "skill:check": (skillName) => {
    const projectDir = process.cwd();
    const skillsDir = path.join(projectDir, ".claude", "skills");

    console.log("🔍 Checking skill dependencies...");
    console.log("");

    const checkSkill = (name, visited = new Set()) => {
      if (visited.has(name)) {
        console.log(`⚠️  Circular dependency detected: ${name}`);
        return;
      }
      visited.add(name);

      const skillDir = path.join(skillsDir, name);
      const metadataFile = path.join(skillDir, "metadata.yaml");

      if (!fs.existsSync(skillDir)) {
        console.log(`❌ Skill "${name}" not found`);
        return;
      }

      if (!fs.existsSync(metadataFile)) {
        console.log(`ℹ️  ${name}: No metadata.yaml`);
        return;
      }

      const metadata = parseSimpleYaml(fs.readFileSync(metadataFile, "utf-8"));
      const deps = metadata.dependencies || [];

      if (deps.length === 0) {
        console.log(`✅ ${name}: No dependencies`);
        return;
      }

      console.log(`📦 ${name} depends on:`);
      deps.forEach((dep) => {
        const depDir = path.join(skillsDir, dep);
        if (fs.existsSync(depDir)) {
          console.log(`   ✅ ${dep}`);
          checkSkill(dep, new Set(visited));
        } else {
          console.log(`   ❌ ${dep} (missing)`);
        }
      });
    };

    if (skillName) {
      checkSkill(skillName);
    } else {
      // Check all skills
      const allSkills = fs.existsSync(skillsDir)
        ? fs.readdirSync(skillsDir).filter((f) => {
            const dir = path.join(skillsDir, f);
            return (
              fs.statSync(dir).isDirectory() &&
              f !== "template" &&
              f !== "examples"
            );
          })
        : [];

      console.log(`Found ${allSkills.length} skills\n`);
      allSkills.forEach((skill) => checkSkill(skill));
    }
  },

  // ---------------------------------------------------------------------------
  // skill:install - Install a skill from source via OpenSkills
  // ---------------------------------------------------------------------------
  "skill:install": (source) => {
    if (!source) {
      console.log("Usage: sumulige-claude skill:install <source>");
      console.log("Example: sumulige-claude skill:install anthropics/skills");
      return;
    }
    try {
      execSync(`openskills install ${source} -y`, { stdio: "inherit" });
      execSync("openskills sync -y", { stdio: "pipe" });
      console.log("✅ Skill installed and synced");
    } catch (e) {
      console.log("❌ Failed to install skill");
    }
  },
};
