import { test } from "node:test"
import assert from "node:assert/strict"
import { fileURLToPath } from "node:url"
import { loadRegisterInput } from "../src/load.ts"

const repoRoot = fileURLToPath(new URL("..", import.meta.url))

test("đọc đúng hai SKILL.md trong package", () => {
  const input = loadRegisterInput({
    pluginRoot: repoRoot,
    projectDir: "/proj",
    playwright: true,
  })
  assert.ok(input.skills.init.path.endsWith("/skills/init/SKILL.md"))
  assert.ok(input.skills.generate.path.endsWith("/skills/generate/SKILL.md"))
  assert.match(input.skills.generate.markdown, /description:/)
  assert.equal(input.projectDir, "/proj")
  assert.equal(input.playwright, true)
})
