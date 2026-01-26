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
        // 快速启动任务 - 使用 Conductor Agent 分析并创建 todos
        const task = rest.join(" ");
        if (!task) {
          log('Usage: smc workflow kickoff "<your task>"', "gray");
          log("", "gray");
          log("Examples:", "gray");
          log('  smc workflow kickoff "实现用户认证系统"', "gray");
          log('  smc workflow kickoff "Add payment integration"', "gray");
          log("", "gray");
          log("Options:", "gray");
          log("  --dry-run    Only show the Conductor prompt", "gray");
          log("  --parse      Parse Claude output from stdin", "gray");
          log("  --verbose    Show detailed output", "gray");
          log("", "gray");
          log("Workflow:", "gray");
          log("  1. smc workflow kickoff \"task\" --dry-run", "gray");
          log("  2. Copy prompt to Claude Code, execute", "gray");
          log("  3. Copy Claude output, run: smc workflow kickoff --parse", "gray");
          return;
        }

        const isDryRun = rest.includes("--dry-run");
        const isVerbose = rest.includes("--verbose");
        const isParse = rest.includes("--parse");
        const taskText = rest
          .filter((r) => !r.startsWith("--"))
          .join(" ");

        // 提前加载依赖
        const todoBridge = require("../agent-orchestrator/todo-bridge");

        // --parse 模式：从 stdin 读取 Claude 输出并创建 todos
        if (isParse) {
          log("", "gray");
          log("📥 解析模式: 粘贴 Claude 的任务分解输出", "blue");
          log("   (输入完成后按 Ctrl+D)", "gray");
          log("", "gray");

          let input = "";
          process.stdin.setEncoding("utf8");
          process.stdin.on("data", (chunk) => {
            input += chunk;
          });
          process.stdin.on("end", async () => {
            const tasks = todoBridge.extractTasksFromInstruction(input);

            if (tasks.length === 0) {
              log("❌ 未找到有效任务，请确保输出格式正确", "red");
              log("   期望格式: [Agent] 任务描述", "gray");
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

        log("", "gray");
        log("🚀 Kickoff: 任务分析与规划", "blue");
        log("=====================================", "gray");
        log("", "gray");
        log(`任务: ${taskText}`, "cyan");
        log("", "gray");

        // 强制使用 Conductor Agent 进行任务分析
        const orchestrator = require("../agent-orchestrator");
        const { buildInstruction } = require("../agent-orchestrator/prompts");

        // 直接构建 Conductor 指令，绕过路由
        const conductorInstruction = buildInstruction('conductor', taskText, {
          projectInfo: `项目: ${require('../../package.json').name}\n版本: ${require('../../package.json').version}`
        });

        // 模拟 Conductor 执行结果
        const mockResult = {
          routing: {
            agent: 'conductor',
            confidence: 1.0,
            reason: 'Kickoff always uses Conductor for task analysis'
          },
          execution: {
            agent: 'conductor',
            task: taskText,
            instruction: conductorInstruction,
            dryRun: isDryRun
          }
        };

        Promise.resolve(mockResult)
          .then(async (result) => {
            const { routing, execution } = result;

            log(`📍 Agent: ${routing.agent}`, "gray");
            log("", "gray");

            if (isDryRun) {
              log("─".repeat(50), "gray");
              log("", "gray");
              log("📝 生成的 Conductor 指令:", "blue");
              log("", "gray");
              log("复制以下内容到 Claude Code 执行:", "yellow");
              log("", "gray");
              log("─".repeat(50), "gray");
              log(execution.instruction, "gray");
              log("─".repeat(50), "gray");
              log("", "gray");
              log("💡 提示: 执行后，Claude 会输出任务分解", "gray");
              log("   然后运行: smc workflow kickoff --from-output", "gray");
              return;
            }

            // 显示简化的指令
            log("─".repeat(50), "gray");
            log("", "gray");
            log("📋 任务分析指令已生成", "blue");
            log("", "gray");
            log("请将以下任务描述发送给 Claude Code:", "cyan");
            log("", "gray");
            log(`  分析并分解任务: "${taskText}"`, "yellow");
            log("", "gray");
            log("  使用以下格式输出:", "gray");
            log("  [Architect] 设计任务", "gray");
            log("  [Builder] 实现任务", "gray");
            log("  [Reviewer] 审查任务", "gray");
            log("", "gray");
            log("─".repeat(50), "gray");
            log("", "gray");

            // 创建占位任务
            const placeholderTask = {
              agent: 'conductor',
              title: taskText,
              description: `待分析: ${taskText}`,
              subtasks: ['等待任务分解'],
              priority: 'P1'
            };

            log("📁 创建占位任务...", "gray");
            const created = await todoBridge.createTodosFromAnalysis([placeholderTask]);

            if (created.length > 0) {
              log(`✅ 已创建任务文件: ${created[0].filename}`, "green");
            }

            log("", "gray");
            log("=====================================", "gray");
            log("", "gray");
            log("📌 下一步:", "blue");
            log("  1. 在 Claude Code 中分析任务", "gray");
            log("  2. 根据分解结果更新任务文件", "gray");
            log("  3. 开始开发: /tdd --from-todo", "gray");
            log("", "gray");
          })
          .catch((err) => {
            log(`❌ Error: ${err.message}`, "red");
            if (isVerbose) {
              console.error(err);
            }
          });
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
