---
description: Scaffold resume-tailor.config.json and the input/output folders for this project. Run this once before using /resume-tailor:generate.
disable-model-invocation: true
allowed-tools: Read Write AskUserQuestion
---

# resume-tailor:init — scaffold config and folders

One-time setup for a project. Creates `${CLAUDE_PROJECT_DIR}/resume-tailor.config.json` plus the input/output folders that `resume-tailor:generate` needs.

This skill is **user-invocable only** (`disable-model-invocation: true`) — it writes files with side effects, so it should never fire automatically.

## Steps

### 1. Check for an existing config

Read `${CLAUDE_PROJECT_DIR}/resume-tailor.config.json`. If it already exists, ask the user (via `AskUserQuestion`) whether to reconfigure (overwrite) or cancel. If they cancel, stop here — do not touch the existing file.

### 2. Ask for candidate name

Ask for the candidate's full name (`candidateName`). This is used later to build output filenames.

### 3. Ask for master data

Ask whether the user already has a master data file (their source of truth for work history, skills, and projects):

- **Already have one** — ask for its path (relative to `${CLAUDE_PROJECT_DIR}`). Verify the file exists; if not, say so and ask again.
- **Don't have one yet** — ask what path to create it at (default suggestion: `MASTER_DATA.md`). Copy the content of `${CLAUDE_PLUGIN_ROOT}/templates/master-data-template.md` into that path using the `Write` tool.

### 4. Ask about the LaTeX template

Ask whether to use the plugin's default template or a custom one:

- **Use the default** — don't set the `template` field in the config at all (omitting it means "use the plugin's built-in template").
- **Use a custom `.tex` file** — ask for its path (relative to `${CLAUDE_PROJECT_DIR}`), verify it exists.

### 5. Ask for output/input folder names

Ask for `outputDir` (default `output`) and `inputDir` (default `input`). These can be accepted as-is or overridden.

### 6. Write the config and scaffold folders

Write `${CLAUDE_PROJECT_DIR}/resume-tailor.config.json`:

```json
{
  "candidateName": "<from step 2>",
  "masterData": "<from step 3>",
  "template": "<from step 4, omit field if default>",
  "outputDir": "<from step 5>",
  "inputDir": "<from step 5>"
}
```

Use the `Write` tool to create `<inputDir>/.gitkeep` and `<outputDir>/.gitkeep` (paths relative to `${CLAUDE_PROJECT_DIR}`). `Write` creates any missing parent directories, so this is also how the `<inputDir>/` and `<outputDir>/` folders themselves get created — no shell/`mkdir` permission needed.

### 7. Report back

Tell the user:

- Where the config was written.
- If a new master data file was scaffolded from the template, **make this explicit and prominent**: they must fill in real experience before running `/resume-tailor:generate` — the skill will not proceed with placeholder master data.
- They can now run `/resume-tailor:generate <jd-path-or-url>`.

## Language

All questions in this skill are asked in **English**. There is no master data or JD yet to infer a language from (see the language rule in `resume-tailor:generate`'s SKILL.md), so this skill has no language to fall back through — it always uses English.
