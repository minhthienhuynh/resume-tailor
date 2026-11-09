import { test } from "node:test"
import assert from "node:assert/strict"
import { register, buildCommandText } from "../src/register.ts"

const md = "---\ndescription: Desc\n---\n\nBody text.\n"

function input(playwright = true) {
  return {
    projectDir: "/proj",
    pluginRoot: "/plugin",
    playwright,
    skills: {
      init: { path: "/plugin/skills/init/SKILL.md", markdown: md },
      generate: { path: "/plugin/skills/generate/SKILL.md", markdown: md },
    },
  }
}

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

test("đăng ký 2 skill với đúng id và autoinvoke", async () => {
  const { ctx, calls } = fakeCtx()
  await register(ctx, input())
  assert.deepEqual(calls.skills.map((s) => s.id), [
    "resume-tailor-init",
    "resume-tailor-generate",
  ])
  assert.equal(calls.skills[0].autoinvoke, false)
  assert.equal(calls.skills[1].autoinvoke, true)
  assert.equal(calls.skills[0].content.includes("CLAUDE_"), false)
  assert.equal(calls.skills[0].content.includes("Body text."), true)
  assert.equal(calls.skills[0].path, "/plugin/skills/init/SKILL.md")
})

test("đăng ký 3 command và inject nội dung skill", async () => {
  const { ctx, calls } = fakeCtx()
  await register(ctx, input())
  assert.deepEqual(calls.commands.map((c) => c.name), [
    "resume-tailor-init",
    "resume-tailor-generate",
    "resume-tailor-gen",
  ])
  const gen = calls.commands.find((c) => c.name === "resume-tailor-generate")
  await gen.execute({ sessionID: "s1", prompt: { text: "jd.md" }, delivery: "steer" })
  assert.equal(calls.prompts.length, 1)
  assert.match(calls.prompts[0].text, /resume-tailor-generate/)
  assert.match(calls.prompts[0].text, /\/plugin\/skills\/generate/)
  assert.match(calls.prompts[0].text, /Body text\./)
  assert.match(calls.prompts[0].text, /jd\.md/)
  assert.equal(calls.prompts[0].sessionID, "s1")
  assert.equal(calls.prompts[0].delivery, "steer")

  const alias = calls.commands.find((c) => c.name === "resume-tailor-gen")
  await alias.execute({
    sessionID: "s2",
    prompt: { text: "jd2.md" },
    delivery: { mode: "steer" },
  })
  assert.equal(calls.prompts.length, 2)
  assert.match(calls.prompts[1].text, /resume-tailor-generate/)
  assert.match(calls.prompts[1].text, /\/plugin\/skills\/generate/)
  assert.match(calls.prompts[1].text, /jd2\.md/)
  assert.equal(calls.prompts[1].sessionID, "s2")
  assert.deepEqual(calls.prompts[1].delivery, { mode: "steer" })
})

test("playwright: false không đăng ký MCP", async () => {
  const { ctx, calls } = fakeCtx()
  await register(ctx, input(false))
  assert.equal(calls.mcpTransform, 0)
  assert.equal(calls.mcp.length, 0)
})

test("playwright: true đăng ký MCP đúng tên", async () => {
  const { ctx, calls } = fakeCtx()
  await register(ctx, input(true))
  assert.equal(calls.mcp.length, 1)
  assert.equal(calls.mcp[0][0], "resume-tailor-playwright")
  assert.deepEqual(calls.mcp[0][1], {
    type: "local",
    command: ["npx", "-y", "@playwright/mcp@latest"],
  })
})

test("playwright: true không ghi đè MCP đã tồn tại", async () => {
  const { ctx, calls } = fakeCtx()
  ctx.mcp.transform = async (cb) => {
    calls.mcpTransform++
    cb({
      get: (name) => (name === "resume-tailor-playwright" ? { type: "remote", url: "http://x" } : undefined),
      set: (n, c) => calls.mcp.push([n, c]),
    })
  }
  await register(ctx, input(true))
  assert.equal(calls.mcpTransform, 1)
  assert.equal(calls.mcp.length, 0)
})

test("buildCommandText nối user input khi có", () => {
  const out = buildCommandText({
    skillId: "resume-tailor-generate",
    baseDir: "/plugin/skills/generate",
    body: "Body text.",
    userText: "jd.md",
  })
  assert.equal(
    out,
    "You are running the resume-tailor `resume-tailor-generate` skill. Its base directory is `/plugin/skills/generate`. Follow these instructions exactly.\n\nBody text.\n\n---\n\nUser input: jd.md",
  )
})

test("buildCommandText bỏ phần user input khi rỗng", () => {
  const out = buildCommandText({
    skillId: "resume-tailor-init",
    baseDir: "/plugin/skills/init",
    body: "Body text.",
    userText: "   ",
  })
  assert.equal(
    out,
    "You are running the resume-tailor `resume-tailor-init` skill. Its base directory is `/plugin/skills/init`. Follow these instructions exactly.\n\nBody text.",
  )
})
