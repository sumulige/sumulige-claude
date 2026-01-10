#!/usr/bin/env node
/**
 * Oh My Claude - CLI Entry Point
 * Agent harness for Claude Code
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG_DIR = path.join(process.env.HOME, '.claude');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const SKILLS_DIR = path.join(CONFIG_DIR, 'skills');

// 默认配置
const DEFAULT_CONFIG = {
  version: '1.0.0',
  agents: {
    conductor: { model: 'claude-opus-4.5', role: 'Task coordination and decomposition' },
    architect: { model: 'claude-sonnet-4.5', role: 'Architecture design and decisions' },
    builder: { model: 'claude-sonnet-4.5', role: 'Code implementation and testing' },
    reviewer: { model: 'claude-haiku-4.5', role: 'Code review and quality check' },
    librarian: { model: 'claude-sonnet-4.5', role: 'Documentation and knowledge' }
  },
  skills: [
    'anthropics/skills',
    'numman-ali/n-skills'
  ],
  hooks: {
    preTask: [],
    postTask: []
  },
  thinkingLens: {
    enabled: true,
    autoSync: true,
    syncInterval: 20
  }
};

// 命令处理
const commands = {
  init: () => {
    console.log('🚀 Initializing Oh My Claude...');

    // 创建配置目录
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    // 创建配置文件
    if (!fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
      console.log('✅ Created config:', CONFIG_FILE);
    } else {
      console.log('ℹ️  Config already exists:', CONFIG_FILE);
    }

    // 创建技能目录
    if (!fs.existsSync(SKILLS_DIR)) {
      fs.mkdirSync(SKILLS_DIR, { recursive: true });
      console.log('✅ Created skills directory:', SKILLS_DIR);
    }

    // 安装 openskills（如果未安装）
    try {
      execSync('openskills --version', { stdio: 'ignore' });
      console.log('✅ OpenSkills already installed');
    } catch {
      console.log('📦 Installing OpenSkills...');
      try {
        execSync('npm i -g openskills', { stdio: 'inherit' });
        console.log('✅ OpenSkills installed');
      } catch (e) {
        console.log('⚠️  Failed to install OpenSkills. Run: npm i -g openskills');
      }
    }

    console.log('');
    console.log('🎉 Oh My Claude initialized!');
    console.log('');
    console.log('Next steps:');
    console.log('  oh-my-claude sync      # Sync to current project');
    console.log('  oh-my-claude agent     # Run agent orchestration');
    console.log('  oh-my-claude status    # Show configuration');
  },

  sync: () => {
    console.log('🔄 Syncing Oh My Claude to current project...');

    const projectDir = process.cwd();
    const projectConfigDir = path.join(projectDir, '.claude');
    const agentsFile = path.join(projectConfigDir, 'AGENTS.md');

    // 创建 .claude 目录
    if (!fs.existsSync(projectConfigDir)) {
      fs.mkdirSync(projectConfigDir, { recursive: true });
      console.log('✅ Created .claude directory');
    }

    // 同步配置
    const config = loadConfig();

    // 生成 AGENTS.md
    const agentsMd = generateAgentsMd(config);
    fs.writeFileSync(agentsFile, agentsMd);
    console.log('✅ Created AGENTS.md');

    // 同步技能
    try {
      execSync('openskills sync -y', { stdio: 'pipe' });
      console.log('✅ Synced skills');
    } catch (e) {
      console.log('⚠️  Failed to sync skills');
    }

    console.log('');
    console.log('✅ Sync complete!');
  },

  agent: (task) => {
    if (!task) {
      console.log('Usage: oh-my-claude agent <task>');
      console.log('');
      console.log('Example: oh-my-claude agent "Build a React dashboard"');
      return;
    }

    const config = loadConfig();
    console.log('🤖 Starting Agent Orchestration...');
    console.log('');
    console.log('Task:', task);
    console.log('');
    console.log('Available Agents:');
    Object.entries(config.agents).forEach(([name, agent]) => {
      console.log(`  - ${name}: ${agent.model} (${agent.role})`);
    });
    console.log('');
    console.log('💡 In Claude Code, use /skill <name> to invoke specific agent capabilities');
  },

  status: () => {
    const config = loadConfig();
    console.log('📊 Oh My Claude Status');
    console.log('');
    console.log('Config:', CONFIG_FILE);
    console.log('');
    console.log('Agents:');
    Object.entries(config.agents).forEach(([name, agent]) => {
      console.log(`  ${name.padEnd(12)} ${agent.model.padEnd(20)} (${agent.role})`);
    });
    console.log('');
    console.log('Skills:', config.skills.join(', '));
    console.log('');
    console.log('ThinkingLens:', config.thinkingLens.enabled ? '✅ Enabled' : '❌ Disabled');
  },

  'skill:list': () => {
    try {
      const result = execSync('openskills list', { encoding: 'utf-8' });
      console.log(result);
    } catch (e) {
      console.log('⚠️  OpenSkills not installed. Run: npm i -g openskills');
    }
  },

  'skill:install': (source) => {
    if (!source) {
      console.log('Usage: oh-my-claude skill:install <source>');
      console.log('Example: oh-my-claude skill:install anthropics/skills');
      return;
    }
    try {
      execSync(`openskills install ${source} -y`, { stdio: 'inherit' });
      execSync('openskills sync -y', { stdio: 'pipe' });
      console.log('✅ Skill installed and synced');
    } catch (e) {
      console.log('❌ Failed to install skill');
    }
  }
};

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  }
  return DEFAULT_CONFIG;
}

function generateAgentsMd(config) {
  const agentsList = Object.entries(config.agents)
    .map(([name, agent]) => `### ${name}\n- **Model**: ${agent.model}\n- **Role**: ${agent.role}`)
    .join('\n\n');

  return `# AGENTS

<skills_system priority="1">

## Agent Orchestration

This project uses **Oh My Claude** for multi-agent collaboration.

${agentsList}

## Usage

\`\`\`bash
# View agent status
oh-my-claude status

# Run agent task
oh-my-claude agent <task>

# List skills
oh-my-claude skill:list
\`\`\`

</skills_system>
`;
}

// CLI 入口
function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const arg = args[1];

  if (cmd === 'init') {
    commands.init();
  } else if (cmd === 'sync') {
    commands.sync();
  } else if (cmd === 'agent') {
    commands.agent(arg);
  } else if (cmd === 'status') {
    commands.status();
  } else if (cmd === 'skill:list') {
    commands['skill:list']();
  } else if (cmd === 'skill:install') {
    commands['skill:install'](arg);
  } else {
    console.log('Oh My Claude - Agent Harness for Claude Code');
    console.log('');
    console.log('Usage: oh-my-claude <command> [args]');
    console.log('');
    console.log('Commands:');
    console.log('  init              Initialize configuration');
    console.log('  sync              Sync to current project');
    console.log('  agent <task>      Run agent orchestration');
    console.log('  status            Show configuration status');
    console.log('  skill:list        List installed skills');
    console.log('  skill:install <s> Install a skill');
    console.log('');
    console.log('Examples:');
    console.log('  oh-my-claude init');
    console.log('  oh-my-claude sync');
    console.log('  oh-my-claude agent "Build a REST API"');
    console.log('  oh-my-claude skill:install anthropics/skills');
  }
}

main();
