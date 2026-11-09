import { test } from "node:test"
import assert from "node:assert/strict"
import { parseSkillFile, transformBody } from "../src/transform.ts"

const ctx = { projectDir: "/proj", pluginRoot: "/plugin" }

test("parseSkillFile tách frontmatter khỏi body", () => {
  const out = parseSkillFile(
    "---\ndescription: Do the thing\ndisable-model-invocation: true\n---\n\n# Title\n\nBody\n",
  )
  assert.equal(out.description, "Do the thing")
  assert.equal(out.body.startsWith("# Title"), true)
  assert.equal(out.body.includes("disable-model-invocation"), false)
})

test("transformBody thay hết token Claude", () => {
  const body = [
    "Read `${CLAUDE_PROJECT_DIR}/resume-tailor.config.json`.",
    "Ask via `AskUserQuestion` with `multiSelect`.",
    "Fetch with `WebFetch`; write with `Write`; run `Bash`.",
    "JD from `$ARGUMENTS[0]`.",
    "Commands: `/resume-tailor:init`, `/resume-tailor:generate`, `/resume-tailor:gen`.",
    "Script: `${CLAUDE_PLUGIN_ROOT}/scripts/build.py`.",
  ].join("\n")

  const out = transformBody(body, ctx)

  for (const banned of [
    "CLAUDE_",
    "AskUserQuestion",
    "multiSelect",
    "WebFetch",
    "$ARGUMENTS",
    "mcp__plugin_",
    "/resume-tailor:",
  ]) {
    assert.equal(out.includes(banned), false, `còn token: ${banned}`)
  }
  assert.match(out, /\/proj\/resume-tailor\.config\.json/)
  assert.match(out, /\/plugin\/scripts\/build\.py/)
  assert.match(out, /`question`/)
  assert.match(out, /`multiple`/)
  assert.match(out, /`webfetch`/)
  assert.match(out, /`write`/)
  assert.match(out, /`shell`/)
  assert.match(out, /\/resume-tailor-init/)
  assert.match(out, /OpenCode notes/)
})
