---
description: Run comprehensive pre-PR verification (5-phase quality check)
---

# /verify - Pre-PR Verification Loop

Run all quality checks to ensure code is ready for PR submission.

## Usage

```
/verify           # Run all 5 phases
/verify --quick   # Skip coverage check (faster)
/verify --fix     # Auto-fix formatting issues before check
```

## Verification Phases

Execute each phase sequentially. If a blocking phase fails, stop and fix before continuing.

---

### Phase 1: Sanity Check (Build)

Verify the CLI loads without errors:

```bash
node cli.js --version
```

| Result | Meaning |
|--------|---------|
| Version displayed | PASS |
| Error thrown | FAIL (blocking) |

---

### Phase 2: Format Check (Lint)

Check code formatting with Prettier:

```bash
npx prettier --check "**/*.{js,cjs,mjs,json,md}" --ignore-path .gitignore
```

If issues found (`--fix` mode):

```bash
npx prettier --write "**/*.{js,cjs,mjs,json,md}" --ignore-path .gitignore
```

| Result | Meaning |
|--------|---------|
| All files formatted | PASS |
| Files need formatting | WARN (non-blocking, fixable) |

---

### Phase 3: Test Suite

Run all tests with coverage:

```bash
npm run test:coverage
```

**Coverage Requirements** (from `.claude/rules/testing.md`):

| Code Type | Minimum |
|-----------|---------|
| General business logic | 80% |
| Financial/Auth/Security | 100% |

| Result | Meaning |
|--------|---------|
| Tests pass, coverage >= 80% | PASS |
| Tests pass, coverage < 80% | FAIL (blocking) |
| Tests fail | FAIL (blocking) |

For `--quick` mode, run without coverage:

```bash
npm test
```

---

### Phase 4: Security Scan

Scan for hardcoded secrets and debugging statements:

**4.1 Check for console.log in production code:**

```bash
grep -rn "console\.log\|console\.debug\|console\.info" --include="*.js" --include="*.cjs" --exclude-dir=node_modules --exclude-dir=tests --exclude-dir=coverage lib/ cli.js 2>/dev/null || echo "No console logs found"
```

**4.2 Check for hardcoded secrets:**

```bash
grep -rn "sk-[a-zA-Z0-9]\{20,\}\|ghp_[a-zA-Z0-9]\{36\}\|AKIA[A-Z0-9]\{16\}" --include="*.js" --include="*.cjs" --exclude-dir=node_modules lib/ cli.js 2>/dev/null || echo "No secrets found"
```

**4.3 Check for hardcoded passwords:**

```bash
grep -rn "password\s*[:=]\s*['\"][^'\"]\+['\"]\|secret\s*[:=]\s*['\"][^'\"]\{10,\}['\"]" --include="*.js" --include="*.cjs" --exclude-dir=node_modules lib/ cli.js 2>/dev/null || echo "No hardcoded passwords found"
```

| Result | Meaning |
|--------|---------|
| No issues found | PASS |
| console.log found | WARN (non-blocking) |
| Secrets/passwords found | FAIL (blocking) |

---

### Phase 5: Diff Review

Review all changed files:

```bash
# Unstaged changes
git diff --stat

# Staged changes
git diff --cached --stat

# Changes since main branch
git diff main...HEAD --stat 2>/dev/null || git diff HEAD~5 --stat
```

**Manual Review Checklist:**

- [ ] No unintended changes
- [ ] Code follows Linus style (eliminate special cases)
- [ ] Tests updated for new/changed code
- [ ] No debug code left behind
- [ ] Error handling is complete

| Result | Meaning |
|--------|---------|
| Review complete | PASS |
| Issues found | Address before PR |

---

## Output Report

After running all phases, generate this report:

```
+==============================================================+
|                 /verify - Verification Report                 |
+==============================================================+
|                                                              |
|  Phase 1: Sanity Check     [STATUS] [MESSAGE]                |
|  Phase 2: Format Check     [STATUS] [MESSAGE]                |
|  Phase 3: Test Suite       [STATUS] [MESSAGE]                |
|  Phase 4: Security Scan    [STATUS] [MESSAGE]                |
|  Phase 5: Diff Review      [STATUS] [MESSAGE]                |
|                                                              |
+--------------------------------------------------------------+
|                                                              |
|  Overall Status: [READY FOR PR / NOT READY / WARNINGS]       |
|                                                              |
|  Issues (if any):                                            |
|  - [Issue 1]                                                 |
|  - [Issue 2]                                                 |
|                                                              |
+==============================================================+
```

**Status Icons:**

| Icon | Meaning |
|------|---------|
| PASS | Check passed |
| WARN | Non-blocking warning |
| FAIL | Blocking failure |

---

## Blocking vs Non-Blocking

### Blocking (FAIL = NOT READY)

- Phase 1: Sanity check fails
- Phase 3: Tests fail OR coverage < 80%
- Phase 4: Hardcoded secrets detected

### Non-Blocking (WARN = WARNINGS)

- Phase 2: Format issues (fixable with `--fix`)
- Phase 4: console.log statements
- Phase 5: Manual review items

---

## Integration

### After Verification

If **READY FOR PR**:

```
/commit    # Create commit with proper message
/pr        # Create pull request
```

If **NOT READY**:

```
/fix       # Quick fix for common issues
```

### Related Configuration

- `.claude/quality-gate.json` - Quality thresholds
- `.claude/rules/testing.md` - Coverage requirements
- `.claude/rules/security.md` - Security checklist

---

## Examples

### Full Verification

```
> /verify

Running Phase 1: Sanity Check...
  node cli.js --version
  sumulige-claude v1.6.0
  PASS

Running Phase 2: Format Check...
  npx prettier --check "**/*.{js,cjs,mjs,json,md}"
  All matched files use Prettier code style!
  PASS

Running Phase 3: Test Suite...
  npm run test:coverage
  Test Suites: 15 passed, 15 total
  Coverage: 85.2%
  PASS (85.2% coverage)

Running Phase 4: Security Scan...
  Checking for console.log... none found
  Checking for secrets... none found
  PASS (0 issues)

Running Phase 5: Diff Review...
  5 files changed, 120 insertions(+), 30 deletions(-)
  PASS

+==============================================================+
|  Overall Status: READY FOR PR                                |
+==============================================================+
```

### Quick Mode (Skip Coverage)

```
> /verify --quick

Skipping coverage check for faster verification...
[Phases 1, 2, 4, 5 run normally]
[Phase 3 runs `npm test` without coverage]
```

### Auto-Fix Mode

```
> /verify --fix

Running Phase 2 with auto-fix...
  npx prettier --write "**/*.{js,cjs,mjs,json,md}"
  Fixed 3 files

[Continue with other phases]
```
