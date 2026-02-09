function formatContext(context) {
  const parts = [];
  if (context?.projectInfo) {
    parts.push(`项目: ${context.projectInfo}`);
  }
  if (context?.relevantFiles?.length) {
    parts.push('相关文件:\n' + context.relevantFiles.map((f) => `- ${f}`).join('\n'));
  }
  if (context?.todos?.length) {
    parts.push('相关任务:\n' + context.todos.map((t) => `- ${t}`).join('\n'));
  }
  return parts.length ? parts.join('\n\n') : '';
}

function formatSkills(skills) {
  if (!skills?.length) return '';
  const blocks = skills.map((skill) => {
    const header = `### Skill: ${skill.name}`;
    const meta = [skill.description, skill.trigger].filter(Boolean).join('\n');
    const content = skill.content ? `\n\n${skill.content}` : '';
    return `${header}\n${meta}${content}`.trim();
  });
  return ['## 自动加载的技能上下文', ...blocks].join('\n\n');
}

function formatPrompts(prompts) {
  if (!prompts?.length) return '';
  const blocks = prompts.map((prompt) => {
    const header = `### Prompt: ${prompt.name}`;
    const meta = prompt.path ? `来源: ${prompt.path}` : '';
    return [header, meta, prompt.content].filter(Boolean).join('\n');
  });
  return ['## 自动加载的系统 Prompt', ...blocks].join('\n\n');
}

function buildExecutionPrompt({ task, context, skills, mode, prompts, uiPro }) {
  const isPlan = mode === 'plan';
  const deepCofounder = Array.isArray(skills) && skills.some((s) => s?.name === 'technical-cofounder');
  const rules = isPlan
    ? [
        '当前模式: PLAN（仅输出计划，不修改任何文件）。',
        '禁止生成补丁、命令或实际代码修改。',
        '所有实现内容仅以计划与步骤形式给出。'
      ]
    : [
        '当前模式: RUN（需要真实实现代码）。',
        '允许修改文件并实现功能。',
        '完成后必须给出测试用例与达标标准。'
      ];

  const cofounderRules = deepCofounder
    ? [
        'Cofounder 深模式已启用（检测到 Skill: technical-cofounder）。',
        '必须执行 Phase gate：从用户输入读取 PHASE=1..5（或 Phase 1..5），缺省为 PHASE=1（Discovery）。',
        '只推进一个 Phase；严禁提前输出后续 Phase。',
        'PHASE=1/2 阶段：即使当前模式为 RUN，也禁止输出任何补丁/命令/真实代码修改；只做问题、假设、范围与计划。',
        '每个 Phase 末尾必须给出编号选项，要求 PO 明确确认后才能进入下一 Phase。'
      ]
    : [];

  const formatRules = deepCofounder
    ? [
        '必须严格按以下角色顺序输出：Conductor → Architect → Builder → Reviewer。',
        'Conductor 必须严格遵循 Skill: technical-cofounder 的 Phase 模板，并明确当前 PHASE。',
        'Architect/Builder/Reviewer 在未获 PO 确认前只输出占位（不得提前设计/实现）。',
        '输出语言：中文为主，可夹带必要英文术语。'
      ]
    : [
        '必须严格按以下角色顺序输出：Conductor → Architect → Builder → Reviewer。',
        '每个角色都要包含四段：规划 → 执行计划 → 测试用例（验证） → 达标标准。',
        '输出语言：中文为主，可夹带必要英文术语。'
      ];

  const contextBlock = formatContext(context);
  const skillsBlock = formatSkills(skills);
  const promptBlock = formatPrompts(prompts);
  const uiBlock = uiPro ? '## UI/UX 工具\n- ui-ux-pro-max 已启用（如未初始化将自动执行 uipro init）' : '';

  const tail = deepCofounder
    ? [
        '# Conductor',
        '## PHASE',
        '-',
        '',
        '## 规划',
        '-',
        '',
        '## 执行计划',
        '-',
        '',
        '## 测试用例（验证）',
        '-',
        '',
        '## 达标标准',
        '-',
        '',
        '## 人类确认点（必须）',
        '请选择下一步：',
        '1. 进入下一 Phase（请在下一次输入中明确 PHASE=<next> 并提供本 Phase 所需答案/确认）',
        '2. 修正本 Phase 输出（仍停留在当前 PHASE）',
        '3. 切换为 quick fix 模式（跳出 cofounder phases）',
        '',
        '# Architect',
        '(等待 PO 确认后继续；当前处于 cofounder 深模式)',
        '',
        '# Builder',
        '(等待 PO 确认后继续；当前处于 cofounder 深模式)',
        '',
        '# Reviewer',
        '(等待 PO 确认后继续；当前处于 cofounder 深模式)',
        ''
      ].join('\n')
    : [
        '# Conductor\n## 规划\n-\n\n## 执行计划\n-\n\n## 测试用例（验证）\n-\n\n## 达标标准\n-\n',
        '# Architect\n## 规划\n-\n\n## 执行计划\n-\n\n## 测试用例（验证）\n-\n\n## 达标标准\n-\n',
        '# Builder\n## 规划\n-\n\n## 执行计划\n-\n\n## 测试用例（验证）\n-\n\n## 达标标准\n-\n',
        '# Reviewer\n## 规划\n-\n\n## 执行计划\n-\n\n## 测试用例（验证）\n-\n\n## 达标标准\n-\n'
      ].join('\n');

  return [
    '你正在使用 sumulige-claude 的执行范式。',
    ...rules,
    ...cofounderRules,
    ...formatRules,
    '',
    '## 任务',
    task,
    contextBlock ? `\n## 上下文\n${contextBlock}` : '',
    promptBlock ? `\n${promptBlock}` : '',
    uiBlock ? `\n${uiBlock}` : '',
    skillsBlock ? `\n${skillsBlock}` : '',
    '\n---\n',
    tail
  ].filter(Boolean).join('\n');
}

function buildKickoffPrompt({ task, context, skills, prompts, uiPro }) {
  const contextBlock = formatContext(context);
  const skillsBlock = formatSkills(skills);
  const promptBlock = formatPrompts(prompts);
  const uiBlock = uiPro ? '## UI/UX 工具\n- ui-ux-pro-max 已启用（如未初始化将自动执行 uipro init）' : '';

  return [
    '你正在进行项目级 Kickoff 规划。必须严格遵循以下模板：',
    '1) 规划 → 2) 执行计划 → 3) 测试用例（验证） → 4) 达标标准',
    '输出语言：中文为主，可夹带必要英文术语。',
    '',
    '要求：',
    '- 先给出清晰项目架构说明。',
    '- 对每个架构模块，固定输出：做什么 / 最佳实践 / 什么是标准 / 如何验证符合标准 / 建议。',
    '- 做产品必要性划分，拆分模块。',
    '- 进一步拆分为子任务计划。',
    '- 每个子任务必须包含测试用例与达标标准。',
    '',
    '## 任务',
    task,
    contextBlock ? `\n## 上下文\n${contextBlock}` : '',
    promptBlock ? `\n${promptBlock}` : '',
    uiBlock ? `\n${uiBlock}` : '',
    skillsBlock ? `\n${skillsBlock}` : '',
    '\n---\n',
    '# 架构说明\n- 模块A\n  - 做什么：\n  - 最佳实践：\n  - 标准：\n  - 验证：\n  - 建议：\n',
    '# 产品必要性划分\n-\n',
    '# 模块拆分\n-\n',
    '# 子任务计划\n## 子任务1\n### 规划\n-\n### 执行计划\n-\n### 测试用例（验证）\n-\n### 达标标准\n-\n',
    '# 总体达标标准\n-\n'
  ].filter(Boolean).join('\n');
}

module.exports = {
  buildExecutionPrompt,
  buildKickoffPrompt
};
