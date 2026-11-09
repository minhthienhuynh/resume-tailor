import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))

test("reference.md không còn đường dẫn Claude", () => {
  const text = readFileSync(root + "skills/generate/reference.md", "utf8")
  assert.equal(text.includes("${CLAUDE_PLUGIN_ROOT}"), false)
  assert.match(text, /two directories above this skill/i)
})

test("master-data-template.md không nhắc command Claude", () => {
  const text = readFileSync(root + "templates/master-data-template.md", "utf8")
  assert.equal(text.includes("resume-tailor:generate"), false)
  assert.match(text, /resume-tailor generate command/)
})
