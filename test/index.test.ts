import { test } from "node:test"
import assert from "node:assert/strict"
import plugin from "../src/index.ts"

function fakeCtx() {
  const calls = { skills: [], commands: [], mcp: [], prompts: [], mcpTransform: 0 }
  return {
    calls,
    ctx: {
      location: { directory: "/proj" },
      options: {},
      skill: { transform: async (cb) => { cb({ add: (s) => calls.skills.push(s) }) } },
      command: { transform: async (cb) => { cb({ add: (c) => calls.commands.push(c) }) } },
      mcp: {
        transform: async (cb) => {
          calls.mcpTransform++
          cb({ get: () => undefined, set: (n, c) => calls.mcp.push([n, c]) })
        },
      },
      session: { prompt: async (p) => { calls.prompts.push(p) } },
    },
  }
}

test("setup đăng ký hai skill thật từ package root", async () => {
  const { ctx, calls } = fakeCtx()
  await plugin.setup(ctx)
  assert.deepEqual(calls.skills.map((s) => s.id), [
    "resume-tailor-init",
    "resume-tailor-generate",
  ])
  for (const skill of calls.skills) {
    assert.equal(skill.content.includes("CLAUDE_"), false)
  }
})
