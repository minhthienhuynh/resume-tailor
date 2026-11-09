import { test } from "node:test"
import assert from "node:assert/strict"
import { fileURLToPath } from "node:url"
import { loadRegisterInput } from "../src/load.ts"
import { parseSkillFile, transformBody } from "../src/transform.ts"

const repoRoot = fileURLToPath(new URL("..", import.meta.url))

const BANNED = [
  "CLAUDE_",
  "AskUserQuestion",
  "multiSelect",
  "WebFetch",
  "$ARGUMENTS",
  "mcp__plugin_",
  "allowed-tools",
]

function transformRealSkill(id: "init" | "generate"): string {
  const input = loadRegisterInput({ pluginRoot: repoRoot, projectDir: "/proj", playwright: true })
  const parsed = parseSkillFile(input.skills[id].markdown)
  return transformBody(parsed.body, {
    projectDir: input.projectDir,
    pluginRoot: input.pluginRoot,
  })
}

test("skill init thật không còn token Claude sau transform", () => {
  const out = transformRealSkill("init")
  for (const banned of BANNED) {
    assert.equal(out.includes(banned), false, `init còn token: ${banned}`)
  }
})

test("skill generate thật không còn token Claude sau transform", () => {
  const out = transformRealSkill("generate")
  for (const banned of BANNED) {
    assert.equal(out.includes(banned), false, `generate còn token: ${banned}`)
  }
})
