/**
 * Workflow Commands Module
 *
 * Extracted from lib/commands.js (lines 2989-3451)
 * Contains: workflow command with all subcommands (start, status, validate, phase, approve, next)
 */

const fs = require("fs");
const path = require("path");

// ============================================================================
// Commands
// ============================================================================

const commands = {
  workflow: (...args) => {
    const [action, ...rest] = args;

    const COLORS = {
      reset: "\x1b[0m",
      green: "\x1b[32m",
      blue: "\x1b[34m",
      yellow: "\x1b[33m",
      gray: "\x1b[90m",
      red: "\x1b[31m",
      cyan: "\x1b[36m",
    };

    const log = (msg, color = "reset") => {
      console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
    };

    switch (action) {
      case "kickoff": {
        const options = {
          dryRun: false,
          verbose: false,
          parse: false,
          runner: 'auto',
          sandbox: 'read-only',
          fullAuto: false,
          permissionMode: 'plan',
          noSkills: false
        };
        const taskParts = [];

        for (let i = 0; i < rest.length; i += 1) {
          const arg = rest[i];
          if (arg === "--dry-run") options.dryRun = true;
          else if (arg === "--verbose" || arg === "-v") options.verbose = true;
          else if (arg === "--parse") options.parse = true;
          else if (arg === "--no-skills") options.noSkills = true;
          else if (arg === "--runner" && rest[i + 1]) options.runner = rest[++i];
          else if (arg.startsWith("--runner=")) options.runner = arg.split("=")[1];
          else if (arg === "--sandbox" && rest[i + 1]) options.sandbox = rest[++i];
          else if (arg.startsWith("--sandbox=")) options.sandbox = arg.split("=")[1];
          else if (arg === "--full-auto") options.fullAuto = true;
          else if (arg === "--no-full-auto") options.fullAuto = false;
          else if (arg === "--permission-mode" && rest[i + 1]) options.permissionMode = rest[++i];
          else if (arg.startsWith("--permission-mode=")) options.permissionMode = arg.split("=")[1];
          else taskParts.push(arg);
        }

        const taskText = taskParts.join(" ").trim();

        if (options.parse) {
          log("", "gray");
          log("📥 解析模式: 粘贴 Kickoff 输出", "blue");
          log("   (输入完成后按 Ctrl+D)", "gray");
          log("", "gray");

          const todoBridge = require("../agent-orchestrator/todo-bridge");
          let input = "";
          process.stdin.setEncoding("utf8");
          process.stdin.on("data", (chunk) => {
            input += chunk;
          });
          process.stdin.on("end", async () => {
            const tasks = todoBridge.extractTasksFromKickoff(input);

            if (tasks.length === 0) {
              log("❌ 未找到有效任务，请确保输出格式正确", "red");
              return;
            }

            log(`📋 解析到 ${tasks.length} 个任务:`, "green");
            tasks.forEach((t, i) => {
              log(`  ${i + 1}. [${t.agent}] ${t.title}`, "cyan");
            });
            log("", "gray");

            log("📁 创建任务文件...", "gray");
            const created = await todoBridge.createTodosFromAnalysis(tasks);

            if (created.length > 0) {
              log(`✅ 已创建 ${created.length} 个任务文件`, "green");
              created.forEach((c) => {
                log(`   - ${c.filename}`, "gray");
              });
            }

            log("", "gray");
            log("📌 下一步: /tdd --from-todo", "blue");
            log("", "gray");
          });
          return;
        }

        if (!taskText) {
          log('Usage: smc workflow kickoff "<your task>"', "gray");
          log("", "gray");
          log("Examples:", "gray");
          log('  smc workflow kickoff "实现用户认证系统"', "gray");
          log('  smc workflow kickoff "Add payment integration"', "gray");
          log("", "gray");
          log("Options:", "gray");
          log("  --dry-run          Print prompt only", "gray");
          log("  --parse            Parse kickoff output from stdin", "gray");
          log("  --verbose          Show detailed output", "gray");
          log("  --runner <name>    codex|claude|gemini|auto", "gray");
          log("  --sandbox <mode>   read-only|workspace-write|danger-full-access (codex)", "gray");
          log("  --permission-mode  plan|acceptEdits (claude)", "gray");
          log("  --full-auto        Enable codex full-auto", "gray");
          log("  --no-skills        Disable auto skill activation", "gray");
          log("", "gray");
          return;
        }

        log("", "gray");
        log("🚀 Kickoff: 任务分析与规划", "blue");
        log("=====================================", "gray");
        log("", "gray");
        log(`任务: ${taskText}`, "cyan");
        log("Mode: plan", "gray");
        log("", "gray");

        const { buildContext } = require("../context");
        const { autoActivateSkills } = require("../skills/auto-activate");
        const { buildKickoffPrompt } = require("../agent-orchestrator/execution-prompts");
        const { detectAvailableRunners, resolveRunner, runRunner } = require("../agent-orchestrator/runner");
        const { routePrompts } = require("../agent-orchestrator/prompt-router");
        const { initUiPro } = require("../agent-orchestrator/ui-pro");
        const { extractTasksFromKickoff, createTodosFromAnalysis } = require("../agent-orchestrator/todo-bridge");

        const projectDir = process.cwd();
        const context = buildContext('conductor', { projectDir });
        const skills = options.noSkills ? [] : autoActivateSkills({ task: taskText, projectDir });
        const routed = routePrompts({ task: taskText, kind: 'kickoff' });
        const prompt = buildKickoffPrompt({
          task: taskText,
          context,
          skills,
          prompts: routed.prompts,
          uiPro: routed.flags.globalUI
        });

        if (routed.missing?.length) {
          routed.missing.forEach((m) => {
            console.log(`⚠️  未找到 Prompt: ${m.name} (${m.path})`);
          });
        }

        if (options.dryRun) {
          log("", "gray");
          log(prompt, "gray");
          return;
        }

        const available = detectAvailableRunners();
        const runner = resolveRunner(options.runner, available);
        if (!runner) {
          log("⚠️  未检测到可用的 CLI Runner (codex/claude/gemini)", "yellow");
          log("", "gray");
          log(prompt, "gray");
          return;
        }

        const sandbox = options.sandbox || 'read-only';
        const fullAuto = typeof options.fullAuto === 'boolean' ? options.fullAuto : false;
        const permissionMode = options.permissionMode || 'plan';

        if (options.verbose) {
          log(`Runner: ${runner}`, "gray");
          log(`Sandbox: ${sandbox}`, "gray");
          log(`Full-auto: ${fullAuto ? 'yes' : 'no'}`, "gray");
          log(`Permission-mode: ${permissionMode}`, "gray");
          log("", "gray");
        }

        if (routed.flags.globalUI) {
          const uipro = initUiPro({ runner, projectDir });
          if (!uipro.ok && uipro.reason === 'missing') {
            log(`⚠️  未检测到 uipro，可手动执行: uipro init --ai ${runner}`, "yellow");
          }
        }

        (async () => {
          try {
            const result = await runRunner({
              runner,
              prompt,
              projectDir,
              sandbox,
              fullAuto,
              permissionMode,
              capture: true
            });
            const output = result?.stdout || '';
            if (output) {
              const tasks = extractTasksFromKickoff(output);
              if (tasks.length > 0) {
                log("📁 自动创建子任务...", "gray");
                const created = await createTodosFromAnalysis(tasks);
                if (created.length > 0) {
                  log(`✅ 已创建 ${created.length} 个任务文件`, "green");
                  created.forEach((c) => {
                    log(`   - development/todos/active/${c.filename}`, "gray");
                  });
                } else {
                  log("ℹ️  任务文件已存在", "gray");
                }
              } else {
                log("⚠️  未解析到子任务，未创建 todos", "yellow");
              }
            }
          } catch (err) {
            log(`❌ Error: ${err.message}`, "red");
            if (options.verbose) console.error(err);
          }
        })();
        break;
      }

      case "start": {
        const idea = rest.join(" ");
        if (!idea) {
          log('Usage: smc workflow start "<your idea>" [context...]', "gray");
          log("", "gray");
          log(
            'Example: smc workflow start "Build a REST API for task management"',
            "gray",
          );
          return;
        }

        // Import workflow modules
        const {
          createProject,
          generateProjectId,
        } = require("../../.claude/workflow/phases/phase1-research");

        log("", "gray");
        log("🚀 Starting Phase 1: Research", "blue");
        log("=====================================", "gray");
        log("", "gray");
        log(`Idea: ${idea}`, "cyan");
        log("", "gray");

        createProject(idea)
          .then((projectId) => {
            log("", "gray");
            log("✅ Project initialized!", "green");
            log(`   Project ID: ${projectId}`, "gray");
            log(
              `   Report: development/projects/${projectId}/phase1/feasibility-report.md`,
              "gray",
            );
            log("", "gray");
            log("Next steps:", "gray");
            log("  1. Complete the feasibility report", "gray");
            log("  2. Validate: smc workflow validate", "gray");
            log("  3. Proceed to Phase 2: Claude approval", "gray");
            log("", "gray");
          })
          .catch((err) => {
            log("", "gray");
            log(`❌ Error: ${err.message}`, "red");
            process.exit(1);
          });
        break;
      }

      case "status": {
        const {
          getAllProjectsWithPhases,
        } = require("../../.claude/workflow/phases/phase4-develop");
        const projects = getAllProjectsWithPhases();

        log("", "gray");
        log("📋 Workflow Projects", "blue");
        log("=====================================", "gray");
        log("", "gray");

        if (projects.length === 0) {
          log("No projects yet.", "gray");
          log('Start one with: smc workflow start "<your idea>"', "gray");
        } else {
          projects.forEach((p) => {
            const phaseNames = [
              "",
              "Research",
              "Approval",
              "Planning",
              "Development",
              "Deployment",
            ];
            const phaseIcons = ["", "🔍", "🤝", "📐", "💻", "🚀"];
            const phaseIcon = phaseIcons[p.currentPhase] || "📋";
            log(`${phaseIcon} ${p.id}`, "gray");
            log(
              `   Phase: ${p.currentPhase} - ${phaseNames[p.currentPhase] || "Unknown"}`,
              "gray",
            );
            if (p.hasPhase1) {
              log(`   ✅ Phase 1: feasibility-report.md`, "gray");
            }
            if (p.hasPhase2) {
              log(`   ✅ Phase 2: requirements.md`, "gray");
            }
            if (p.hasPhase3) {
              log(`   ✅ Phase 3: PRD.md`, "gray");
            }
            if (p.hasPhase4) {
              log(`   ✅ Phase 4: source/`, "gray");
            }
          });
        }
        log("", "gray");
        break;
      }

      case "validate": {
        const [reportPath] = rest;

        if (!reportPath) {
          log("Usage: smc workflow validate <file-path|project-id>", "gray");
          log("", "gray");
          log("Validates:", "gray");
          log("  - Phase 1: feasibility-report.md", "gray");
          log("  - Phase 2: requirements.md", "gray");
          log("  - Phase 3: PRD.md or TASK_PLAN.md", "gray");
          log("  - Phase 4: Pass project-id to validate development", "gray");
          return;
        }

        // Check if it's a project ID (for Phase 4 validation)
        if (reportPath.startsWith("proj_")) {
          const {
            DevelopmentValidator,
          } = require("../../.claude/workflow/phases/phase4-develop");
          const result = DevelopmentValidator.validateProjectDir(reportPath);
          log(DevelopmentValidator.generateReport(result));
          process.exit(result.passed ? 0 : 1);
        }

        // Determine which validator to use based on file name
        const isPhase3 =
          reportPath.includes("PRD") ||
          reportPath.includes("TASK_PLAN") ||
          reportPath.includes("phase3");
        const isPhase2 =
          reportPath.includes("requirements") || reportPath.includes("phase2");

        if (isPhase3) {
          const {
            PlanningValidator,
          } = require("../../.claude/workflow/phases/phase3-plan");
          const result = PlanningValidator.validateFile(reportPath);
          log(PlanningValidator.generateReport(result));
          process.exit(result.passed ? 0 : 1);
        } else if (isPhase2) {
          const {
            ApprovalValidator,
          } = require("../../.claude/workflow/phases/phase2-approve");
          const result = ApprovalValidator.validateFile(reportPath);
          log(ApprovalValidator.generateReport(result));
          process.exit(result.passed ? 0 : 1);
        } else {
          const {
            FeasibilityValidator,
          } = require("../../.claude/workflow/phases/phase1-research");
          const result = FeasibilityValidator.validateFile(reportPath);
          log(FeasibilityValidator.generateReport(result));
          process.exit(result.passed ? 0 : 1);
        }
      }

      case "phase": {
        const [phaseNum] = rest;
        const phases = [
          "1 - Research (NotebookLM)",
          "2 - Approval (Claude)",
          "3 - Planning (Claude)",
          "4 - Development (Claude)",
          "5 - Deployment",
        ];

        if (phaseNum) {
          log(
            `Phase ${phaseNum}: ${phases[parseInt(phaseNum) - 1] || "Unknown"}`,
            "cyan",
          );
        } else {
          log("", "gray");
          log("🔄 Workflow Phases", "blue");
          log("=====================================", "gray");
          log("", "gray");
          phases.forEach((p, i) => {
            log(`  Phase ${i + 1}: ${p}`, "gray");
          });
          log("", "gray");
        }
        break;
      }

      case "approve":
      case "next": {
        // Determine project ID
        let projectId;

        if (action === "approve") {
          projectId = rest[0];
        } else {
          // 'next' - find the latest project that needs the next phase
          const {
            getAllProjectsWithPhases,
          } = require("../../.claude/workflow/phases/phase4-develop");
          const projects = getAllProjectsWithPhases();

          // Find project ready for next phase
          const readyForPhase4 = projects.find(
            (p) => p.hasPhase3 && !p.hasPhase4,
          );
          const readyForPhase3 = projects.find(
            (p) => p.hasPhase2 && !p.hasPhase3,
          );
          const readyForPhase2 = projects.find(
            (p) => p.hasPhase1 && !p.hasPhase2,
          );

          if (readyForPhase4) {
            projectId = readyForPhase4.id;
          } else if (readyForPhase3) {
            projectId = readyForPhase3.id;
          } else if (readyForPhase2) {
            projectId = readyForPhase2.id;
          } else if (projects.length === 0) {
            log(
              'No projects found. Start one with: smc workflow start "<your idea>"',
              "gray",
            );
            return;
          } else {
            log(
              'All projects are at the latest phase. Start a new project with: smc workflow start "<your idea>"',
              "yellow",
            );
            return;
          }
        }

        if (!projectId) {
          log("Usage: smc workflow approve <project-id>", "gray");
          log(
            "Or use: smc workflow next (auto-selects and advances latest project)",
            "gray",
          );
          return;
        }

        // Determine which phase to execute
        const {
          getAllProjectsWithPhases,
        } = require("../../.claude/workflow/phases/phase4-develop");
        const projects = getAllProjectsWithPhases();
        const project = projects.find((p) => p.id === projectId);

        if (!project) {
          log(`Project not found: ${projectId}`, "red");
          return;
        }

        // Execute the appropriate phase
        if (project.hasPhase3 && !project.hasPhase4) {
          // Execute Phase 4
          const {
            Phase4DevelopmentExecutor,
          } = require("../../.claude/workflow/phases/phase4-develop");

          log("", "gray");
          log("💻 Starting Phase 4: Development", "blue");
          log("=====================================", "gray");
          log("", "gray");
          log(`Project: ${projectId}`, "cyan");
          log("", "gray");

          const executor = new Phase4DevelopmentExecutor(projectId);

          // Check if Phase 3 task plan exists
          if (!fs.existsSync(executor.taskPlanPath)) {
            log(
              `❌ Phase 3 task plan not found: ${executor.taskPlanPath}`,
              "red",
            );
            log("Complete Phase 3 first.", "yellow");
            process.exit(1);
          }

          executor
            .execute((msg, current, total) => {
              const progress = Math.round((current / total) * 100);
              log(`[${progress}%] ${msg}`, "gray");
            })
            .then((result) => {
              log("", "gray");
              log("✅ Phase 4 initialized!", "green");
              log(`   Source: ${result.sourceDir}`, "gray");
              log(`   Tasks: ${result.tasksPath}`, "gray");
              log(`   Dev Log: ${result.devLogPath}`, "gray");
              log("", "gray");
              log("Next steps:", "gray");
              log("  1. Review the generated scaffold", "gray");
              log("  2. Implement tasks according to TASK_PLAN.md", "gray");
              log("  3. Write tests for each feature", "gray");
              log("  4. Update task progress in TASKS.md", "gray");
              log("  5. Validate: smc workflow validate " + projectId, "gray");
              log("", "gray");
            })
            .catch((err) => {
              log("", "gray");
              log(`❌ Error: ${err.message}`, "red");
              process.exit(1);
            });
        } else if (project.hasPhase2 && !project.hasPhase3) {
          // Execute Phase 3
          const {
            Phase3PlanningExecutor,
          } = require("../../.claude/workflow/phases/phase3-plan");

          log("", "gray");
          log("📐 Starting Phase 3: Planning", "blue");
          log("=====================================", "gray");
          log("", "gray");
          log(`Project: ${projectId}`, "cyan");
          log("", "gray");

          const executor = new Phase3PlanningExecutor(projectId);

          // Check if Phase 2 requirements exist
          if (!fs.existsSync(executor.phase2RequirementsPath)) {
            log(
              `❌ Phase 2 requirements not found: ${executor.phase2RequirementsPath}`,
              "red",
            );
            log("Complete Phase 2 first.", "yellow");
            process.exit(1);
          }

          executor
            .execute((msg, current, total) => {
              const progress = Math.round((current / total) * 100);
              log(`[${progress}%] ${msg}`, "gray");
            })
            .then((result) => {
              log("", "gray");
              log("✅ Phase 3 initialized!", "green");
              log(`   PRD: ${result.prdPath}`, "gray");
              log(`   Task Plan: ${result.taskPlanPath}`, "gray");
              log(`   Prototype: ${result.prototypeDir}`, "gray");
              log("", "gray");
              log("Next steps:", "gray");
              log("  1. Review and complete the PRD", "gray");
              log("  2. Review and adjust the task plan", "gray");
              log("  3. Create prototypes/proofs-of-concept", "gray");
              log(
                "  4. Validate: smc workflow validate " + result.prdPath,
                "gray",
              );
              log("  5. Proceed to Phase 4", "gray");
              log("", "gray");
            })
            .catch((err) => {
              log("", "gray");
              log(`❌ Error: ${err.message}`, "red");
              process.exit(1);
            });
        } else {
          // Execute Phase 2 (original logic)
          const {
            Phase2ApprovalExecutor,
          } = require("../../.claude/workflow/phases/phase2-approve");

          log("", "gray");
          log("🤝 Starting Phase 2: Approval", "blue");
          log("=====================================", "gray");
          log("", "gray");
          log(`Project: ${projectId}`, "cyan");
          log("", "gray");

          const executor = new Phase2ApprovalExecutor(projectId);

          // Check if Phase 1 report exists
          if (!fs.existsSync(executor.phase1ReportPath)) {
            log(
              `❌ Phase 1 report not found: ${executor.phase1ReportPath}`,
              "red",
            );
            log("Complete Phase 1 first.", "yellow");
            process.exit(1);
          }

          executor
            .execute((msg, current, total) => {
              const progress = Math.round((current / total) * 100);
              log(`[${progress}%] ${msg}`, "gray");
            })
            .then((result) => {
              log("", "gray");
              log("✅ Phase 2 initialized!", "green");
              log(`   Requirements: ${result.requirementsPath}`, "gray");
              log("", "gray");
              log("Next steps:", "gray");
              log("  1. Review and answer clarification questions", "gray");
              log(
                "  2. Define functional requirements with acceptance criteria",
                "gray",
              );
              log(
                "  3. Validate: smc workflow validate " +
                  result.requirementsPath,
                "gray",
              );
              log("  4. Proceed to Phase 3", "gray");
              log("", "gray");
            })
            .catch((err) => {
              log("", "gray");
              log(`❌ Error: ${err.message}`, "red");
              process.exit(1);
            });
        }
        break;
      }

      default:
        log("", "gray");
        log("🔄 Workflow Commands", "blue");
        log("=====================================", "gray");
        log("", "gray");
        log("Usage: smc workflow <action> [args...]", "gray");
        log("", "gray");
        log("Actions:", "gray");
        log(
          "  kickoff <task>   Quick start: analyze task & create todos",
          "gray",
        );
        log(
          "  start <idea>     Start a new project workflow (Phase 1)",
          "gray",
        );
        log("  approve <id>     Start Phase 2 approval for a project", "gray");
        log("  next             Auto-advance to next phase", "gray");
        log("  status           Show all projects and their phases", "gray");
        log(
          "  validate <file>  Validate a report (feasibility or requirements)",
          "gray",
        );
        log("  phase [n]        Show phase information", "gray");
        log("", "gray");
        log("Examples:", "gray");
        log('  smc workflow kickoff "实现用户认证"', "gray");
        log('  smc workflow start "Build a REST API"', "gray");
        log("  smc workflow approve proj_abc123", "gray");
        log("  smc workflow next", "gray");
        log("  smc workflow status", "gray");
        log(
          "  smc workflow validate development/projects/xxx/phase1/feasibility-report.md",
          "gray",
        );
        log("  smc workflow phase 1", "gray");
        log("", "gray");
    }
  },
};

module.exports = commands;
