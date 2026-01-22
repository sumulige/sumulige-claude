/**
 * Phase 4: Development - Execute Implementation Tasks
 *
 * Input: Phase 3 TASK_PLAN.md
 * Output: Source code, tests, documentation
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Configuration
// ============================================================================

const PROJECTS_DIR = path.join(process.cwd(), 'development/projects');

// ============================================================================
// Development Validator
// ============================================================================

class DevelopmentValidator {
  /**
   * Validate development completion from project state
   */
  static validateProject(projectDir) {
    const checks = [];
    const blockers = [];
    const warnings = [];

    const sourceDir = path.join(projectDir, 'phase4', 'source');

    // Check 1: Source directory exists
    const hasSourceDir = fs.existsSync(sourceDir);
    checks.push({
      name: 'Source Directory',
      passed: hasSourceDir,
      message: hasSourceDir
        ? 'Source code directory exists'
        : 'Source code directory not found'
    });

    if (!hasSourceDir) {
      blockers.push('Create source code directory with implementation');
    }

    // Check 2: Has main application file
    const mainFiles = [
        'index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts',
        'server.js', 'server.ts', 'api.js', 'api.ts'
      ];
    const hasMainFile = hasSourceDir && mainFiles.some(file =>
        fs.existsSync(path.join(sourceDir, file)) ||
        fs.existsSync(path.join(sourceDir, 'src', file))
      );
    checks.push({
      name: 'Main Application File',
      passed: hasMainFile,
      message: hasMainFile
        ? 'Main application file exists'
        : 'Missing main application file'
    });

    if (!hasMainFile) {
      blockers.push('Create main application entry point');
    }

    // Check 3: Has package.json
    const packageJsonPath = path.join(projectDir, 'phase4', 'source', 'package.json');
    const hasPackageJson = fs.existsSync(packageJsonPath);
    checks.push({
      name: 'Package Configuration',
      passed: hasPackageJson,
      message: hasPackageJson
        ? 'package.json exists'
        : 'Missing package.json'
    });

    if (!hasPackageJson) {
      warnings.push('Add package.json with dependencies and scripts');
    }

    // Check 4: Has README
    const readmePath = path.join(projectDir, 'phase4', 'source', 'README.md');
    const hasReadme = fs.existsSync(readmePath);
    checks.push({
      name: 'Documentation',
      passed: hasReadme,
      message: hasReadme
        ? 'README.md exists'
        : 'Missing README.md'
    });

    if (!hasReadme) {
      warnings.push('Add README.md with setup and usage instructions');
    }

    // Check 5: Has test directory
    const testDir = path.join(projectDir, 'phase4', 'source', 'tests');
    const hasTests = fs.existsSync(testDir);
    checks.push({
      name: 'Test Directory',
      passed: hasTests,
      message: hasTests
        ? 'Test directory exists'
        : 'Missing test directory'
    });

    if (!hasTests) {
      warnings.push('Add test directory with test cases');
    }

    // Check 6: Has .gitignore
    const gitignorePath = path.join(projectDir, 'phase4', 'source', '.gitignore');
    const hasGitignore = fs.existsSync(gitignorePath);
    checks.push({
      name: 'Git Configuration',
      passed: hasGitignore,
      message: hasGitignore
        ? '.gitignore exists'
        : 'Missing .gitignore'
    });

    if (!hasGitignore) {
      warnings.push('Add .gitignore for version control');
    }

    // Calculate score
    const passedChecks = checks.filter(c => c.passed).length;
    const score = Math.round((passedChecks / checks.length) * 100);

    // Determine if passed (need at least 80% and no blockers)
    const passed = score >= 80 && blockers.length === 0;

    return {
      passed,
      score,
      checks,
      blockers,
      warnings
    };
  }

  /**
   * Validate a project directory
   */
  static validateProjectDir(projectId) {
    const projectDir = path.join(PROJECTS_DIR, projectId);

    if (!fs.existsSync(projectDir)) {
      return {
        passed: false,
        score: 0,
        checks: [],
        blockers: [`Project not found: ${projectId}`],
        warnings: []
      };
    }

    return this.validateProject(projectDir);
  }

  /**
   * Generate a validation report for display
   */
  static generateReport(result) {
    const lines = [];

    lines.push('═══════════════════════════════════════════════════════');
    lines.push('           Development Phase Validation');
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('');

    // Status
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    const statusColor = result.passed ? '🟢' : '🔴';
    lines.push(`Status: ${statusColor} ${status} (Score: ${result.score}/100)`);
    lines.push('');

    // Checks
    lines.push('Quality Checks:');
    lines.push('───────────────────────────────────────────────────────');

    result.checks.forEach(check => {
      const icon = check.passed ? '✅' : '❌';
      lines.push(`  ${icon} ${check.name}: ${check.message || 'Failed'}`);
    });

    lines.push('');

    // Blockers
    if (result.blockers.length > 0) {
      lines.push('🚫 BLOCKERS (must fix before proceeding):');
      lines.push('───────────────────────────────────────────────────────');
      result.blockers.forEach((blocker, i) => {
        lines.push(`  ${i + 1}. ${blocker}`);
      });
      lines.push('');
    }

    // Warnings
    if (result.warnings.length > 0) {
      lines.push('⚠️  WARNINGS (recommended improvements):');
      lines.push('───────────────────────────────────────────────────────');
      result.warnings.forEach((warning, i) => {
        lines.push(`  ${i + 1}. ${warning}`);
      });
      lines.push('');
    }

    // Recommendation
    if (result.passed) {
      lines.push('🎉 Development phase complete! Ready for Phase 5 (Deployment).');
    } else {
      lines.push('📝 Development phase needs work. Address blockers and re-validate.');
    }

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════');

    return lines.join('\n');
  }
}

// ============================================================================
// Phase 4 Development Executor
// ============================================================================

class Phase4DevelopmentExecutor {
  constructor(projectId) {
    this.projectId = projectId;
    this.projectDir = path.join(PROJECTS_DIR, projectId);
    this.phaseDir = path.join(this.projectDir, 'phase4');
    this.sourceDir = path.join(this.phaseDir, 'source');
    this.taskPlanPath = path.join(this.projectDir, 'phase3', 'TASK_PLAN.md');
    this.prdPath = path.join(this.projectDir, 'phase3', 'PRD.md');
  }

  /**
   * Ensure project directories exist
   */
  ensureDirectories() {
    if (!fs.existsSync(this.phaseDir)) {
      fs.mkdirSync(this.phaseDir, { recursive: true });
    }
    if (!fs.existsSync(this.sourceDir)) {
      fs.mkdirSync(this.sourceDir, { recursive: true });
    }
  }

  /**
   * Read Phase 3 task plan
   */
  readTaskPlan() {
    if (!fs.existsSync(this.taskPlanPath)) {
      return null;
    }
    return fs.readFileSync(this.taskPlanPath, 'utf-8');
  }

  /**
   * Read Phase 3 PRD
   */
  readPRD() {
    if (!fs.existsSync(this.prdPath)) {
      return null;
    }
    return fs.readFileSync(this.prdPath, 'utf-8');
  }

  /**
   * Extract project info from PRD
   */
  extractProjectInfo() {
    const prdContent = this.readPRD();
    if (!prdContent) {
      return { name: this.projectId, description: '' };
    }

    // Extract project name/vision
    const visionMatch = prdContent.match(/### Vision\s+([\s\S]*?)(?=###|\n\n|\*\*|$)/);
    const goalsMatch = prdContent.match(/### Goals\s+([\s\S]*?)(?=###|\n\n|$)/);

    return {
      name: this.projectId,
      vision: visionMatch ? visionMatch[1].trim() : '',
      goals: goalsMatch ? goalsMatch[1].trim() : ''
    };
  }

  /**
   * Extract tech stack from PRD
   */
  extractTechStack() {
    const prdContent = this.readPRD();
    if (!prdContent) {
      return { frontend: 'To be decided', backend: 'To be decided' };
    }

    // Look for tech stack section
    const techStackMatch = prdContent.match(/## Components\s+([\s\S]*?)(?=##|$)/);
    if (techStackMatch) {
      // Extract frontend/backend technologies
      const frontendMatch = techStackMatch[1].match(/Frontend.*?\|.*?\| ([^\n]+)/i);
      const backendMatch = techStackMatch[1].match(/Backend.*?\|.*?\| ([^\n]+)/i);

      return {
        frontend: frontendMatch ? frontendMatch[1].trim() : 'To be decided',
        backend: backendMatch ? backendMatch[1].trim() : 'To be decided'
      };
    }

    return { frontend: 'To be decided', backend: 'To be decided' };
  }

  /**
   * Generate project scaffold
   */
  async generateScaffold(progressCallback) {
    await progressCallback?.('Creating project structure...', 1, 7);

    const projectInfo = this.extractProjectInfo();
    const techStack = this.extractTechStack();

    // Create subdirectories
    const subdirs = ['src', 'tests', 'docs', 'scripts'];
    for (const subdir of subdirs) {
      fs.mkdirSync(path.join(this.sourceDir, subdir), { recursive: true });
    }

    // Generate package.json
    await progressCallback?.('Generating package.json...', 2, 7);

    const packageJson = {
      name: this.projectId.replace('proj_', ''),
      version: '0.1.0',
      description: projectInfo.vision || 'Project from AI workflow',
      main: 'src/index.js',
      scripts: {
        start: 'node src/index.js',
        test: 'jest',
        lint: 'eslint src/**/*.js',
        format: 'prettier --write "src/**/*.js"'
      },
      dependencies: {
        express: '^4.18.0',
        dotenv: '^16.0.0'
      },
      devDependencies: {
        jest: '^29.0.0',
        eslint: '^8.0.0',
        prettier: '^3.0.0',
        nodemon: '^3.0.0'
      },
      engines: {
        node: '>=16.0.0'
      }
    };

    await fs.promises.writeFile(
      path.join(this.sourceDir, 'package.json'),
      JSON.stringify(packageJson, null, 2),
      'utf-8'
    );

    // Generate .gitignore
    await fs.promises.writeFile(
      path.join(this.sourceDir, '.gitignore'),
      `# Dependencies
node_modules/

# Environment
.env
.env.local
.env.*.local

# Logs
logs
*.log
npm-debug.log*

# Coverage
coverage/
*.lcov

# Build
dist/
build/

# IDE
.idea/
.vscode/
*.swp
*.swo
*.DS_Store

# OS
Thumbs.db
`,
      'utf-8'
    );

    // Generate .env.example
    await fs.promises.writeFile(
      path.join(this.sourceDir, '.env.example'),
      `# Environment Variables
PORT=3000
NODE_ENV=development

# Add your environment variables here
`,
      'utf-8'
    );

    // Generate README.md
    await progressCallback?.('Generating README.md...', 3, 7);

    const readmeContent = `# ${projectInfo.name}

${projectInfo.vision ? projectInfo.vision + '\n\n' : ''}## Installation

\`\`\`bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm start
\`\`\`

## Development

\`\`\`bash
# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
\`\`\`

## Project Structure

\`\`\`
src/
  index.js       # Application entry point
  routes/         # API routes
  controllers/    # Business logic
  models/         # Data models
  middleware/     # Custom middleware
  services/       # External services
tests/
  unit/           # Unit tests
  integration/    # Integration tests
docs/            # Documentation
\`\`\`

## API Documentation

[API documentation will be added here]

## Contributing

[Contributing guidelines]

## License

[License information]
`;

    await fs.promises.writeFile(
      path.join(this.sourceDir, 'README.md'),
      readmeContent,
      'utf-8'
    );

    // Generate main application scaffold
    await progressCallback?.('Creating application scaffold...', 4, 7);

    // Generate main index.js
    const indexJs = `/**
 * Main Application Entry Point
 * Generated by Phase 4 Development Workflow
 */

const express = require('express');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(\`\${new Date().toISOString()} \${req.method} \${req.path}\`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/v1', require('./routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(\`🚀 Server running on port \${PORT}\`);
    console.log(\`📖 Health check: http://localhost:\${PORT}/health\`);
  });
}

module.exports = app;
`;

    await fs.promises.writeFile(
      path.join(this.sourceDir, 'src', 'index.js'),
      indexJs,
      'utf-8'
    );

    // Generate routes scaffold
    await fs.promises.mkdir(path.join(this.sourceDir, 'src', 'routes'), { recursive: true });

    const routesIndexJs = `/**
 * API Routes v1
 */

const express = require('express');
const router = express.Router();

// Example: Resource routes
router.get('/resources', (req, res) => {
  res.json({
    data: [],
    meta: {
      page: 1,
      limit: 20,
      total: 0
    }
  });
});

router.post('/resources', (req, res) => {
  res.status(201).json({
    message: 'Resource created',
    data: req.body
  });
});

router.get('/resources/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id,
    // Resource details
  });
});

router.put('/resources/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id,
    ...req.body,
    message: 'Resource updated'
  });
});

router.delete('/resources/:id', (req, res) => {
  res.status(204).send();
});

module.exports = router;
`;

    await fs.promises.writeFile(
      path.join(this.sourceDir, 'src', 'routes', 'index.js'),
      routesIndexJs,
      'utf-8'
    );

    // Generate test scaffold
    await progressCallback?.('Creating test scaffold...', 5, 7);

    const testSetupJs = `/**
 * Test Configuration
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
`;

    await fs.promises.writeFile(
      path.join(this.sourceDir, 'tests', 'jest.config.js'),
      testSetupJs,
      'utf-8'
    );

    // Generate example test
    const exampleTestJs = `/**
 * Health Check API Test
 */

const request = require('supertest');
const app = require('../src/index');

describe('Health Check API', () => {
  describe('GET /health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
        });
    });
  });
});
`;

    await fs.promises.writeFile(
      path.join(this.sourceDir, 'tests', 'health.test.js'),
      exampleTestJs,
      'utf-8'
    );

    // Generate task tracking file
    await progressCallback?.('Creating task tracking...', 6, 7);

    const tasksPath = path.join(this.phaseDir, 'TASKS.md');
    const tasksContent = `# Development Tasks Tracker

**Project**: ${this.projectId}
**Started**: ${new Date().toLocaleDateString()}

---

## Task Progress

| Task | Status | Assignee | Notes |
|------|--------|----------|-------|
| TASK-001 | 🔲 Pending | - | Project setup |
| TASK-002 | 🔲 Pending | - | Database schema |
| TASK-003 | 🔲 Pending | - | API infrastructure |
| TASK-004 | 🔲 Pending | - | Feature A |
| TASK-005 | 🔲 Pending | - | Feature B |

---

## Status Legend

- 🔲 Pending
- 🔳 In Progress
- ✅ Complete
- ⏸ Blocked
- ❌ Cancelled

---

## Notes

Use this file to track task progress during development.

Update status as work progresses.
`;

    await fs.promises.writeFile(tasksPath, tasksContent, 'utf-8');

    // Generate development log
    const devLogPath = path.join(this.phaseDir, 'DEVELOPMENT_LOG.md');
    const devLogContent = `# Development Log

**Project**: ${this.projectId}
**Phase**: 4 - Development

---

## Session History

### Session 1 - ${new Date().toLocaleDateString()}

#### Setup
- [x] Project scaffold created
- [x] Directory structure initialized
- [x] package.json generated
- [x] README.md created

#### Next Steps
1. Review generated scaffold
2. Implement TASK-001: [Description]
3. Implement TASK-002: [Description]

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| ${new Date().toLocaleDateString()} | Initial scaffold generated | Claude |

---

## Notes

Add development notes, decisions, and learnings here.
`;

    await fs.promises.writeFile(devLogPath, devLogContent, 'utf-8');

    await progressCallback?.('Scaffold generation complete!', 7, 7);
  }

  /**
   * Execute Phase 4 development workflow
   */
  async execute(progressCallback) {
    await progressCallback?.('Initializing Phase 4 development...', 0, 8);

    // Ensure directories exist
    this.ensureDirectories();

    // Step 1: Read task plan
    await progressCallback?.('Reading task plan...', 1, 8);
    const taskPlan = this.readTaskPlan();

    if (!taskPlan) {
      throw new Error(`Task plan not found: ${this.taskPlanPath}`);
    }

    // Step 2: Generate project scaffold
    await this.generateScaffold(progressCallback);

    await progressCallback?.('Phase 4 development initialized. Ready for coding!', 8, 8);

    return {
      projectId: this.projectId,
      sourceDir: this.sourceDir,
      tasksPath: path.join(this.phaseDir, 'TASKS.md'),
      devLogPath: path.join(this.phaseDir, 'DEVELOPMENT_LOG.md'),
      nextSteps: [
        'Review the generated scaffold',
        'Implement tasks according to TASK_PLAN.md',
        'Write tests for each feature',
        'Update task progress in TASKS.md',
        'Validate when complete: smc workflow validate'
      ]
    };
  }

  /**
   * Check if source directory exists
   */
  sourceExists() {
    return fs.existsSync(this.sourceDir);
  }

  /**
   * Get phase info
   */
  getPhaseInfo() {
    return {
      phase: 4,
      name: 'Development',
      description: 'Execute implementation tasks',
      input: 'Phase 3 Task Plan',
      output: 'Source code, tests, documentation',
      status: this.sourceExists() ? 'In Progress' : 'Not Started',
      files: {
        source: this.sourceDir,
        tasks: path.join(this.phaseDir, 'TASKS.md'),
        devLog: path.join(this.phaseDir, 'DEVELOPMENT_LOG.md'),
        taskPlan: this.taskPlanPath,
        prd: this.prdPath
      }
    };
  }
}

// ============================================================================
// Project Management Helpers
// ============================================================================

function getAllProjectsWithPhases() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return [];
  }

  const projects = [];
  const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('proj_')) {
      const projectPath = path.join(PROJECTS_DIR, entry.name);
      const phase1Report = path.join(projectPath, 'phase1', 'feasibility-report.md');
      const phase2Requirements = path.join(projectPath, 'phase2', 'requirements.md');
      const phase3PRD = path.join(projectPath, 'phase3', 'PRD.md');
      const phase4Source = path.join(projectPath, 'phase4', 'source');

      let currentPhase = 1;
      let status = 'draft';

      if (fs.existsSync(phase4Source)) {
        currentPhase = 4;
        status = 'development';
      } else if (fs.existsSync(phase3PRD)) {
        currentPhase = 3;
        status = 'planned';
      } else if (fs.existsSync(phase2Requirements)) {
        currentPhase = 2;
        status = 'in_progress';
      } else if (fs.existsSync(phase1Report)) {
        currentPhase = 1;
        status = 'review';
      }

      projects.push({
        id: entry.name,
        path: projectPath,
        currentPhase,
        status,
        hasPhase1: fs.existsSync(phase1Report),
        hasPhase2: fs.existsSync(phase2Requirements),
        hasPhase3: fs.existsSync(phase3PRD),
        hasPhase4: fs.existsSync(phase4Source)
      });
    }
  }

  return projects.sort((a, b) => b.id.localeCompare(a.id));
}

module.exports = {
  Phase4DevelopmentExecutor,
  DevelopmentValidator,
  getAllProjectsWithPhases
};
