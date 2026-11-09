import { dirname } from "node:path"
import { Skill } from "@opencode/plugin"
import { parseSkillFile, transformBody } from "./transform.ts"

export type SkillSource = { path: string; markdown: string }

export type RegisterInput = {
  projectDir: string
  pluginRoot: string
  playwright: boolean
  skills: { init: SkillSource; generate: SkillSource }
}

type Editor<T> = { add(value: T): void }
type McpEditor = { get(name: string): unknown; set(name: string, config: unknown): void }

export interface CommandInvocation {
  sessionID: string
  prompt: { text: string } & Record<string, unknown>
  delivery?: unknown
}

export interface CommandDefinition {
  name: string
  description?: string
  execute(input: CommandInvocation): Promise<void>
}

export interface RegisterContext {
  location: { directory: string }
  options: Record<string, unknown>
  skill: { transform(cb: (editor: Editor<unknown>) => void): Promise<unknown> }
  command: { transform(cb: (editor: Editor<CommandDefinition>) => void): Promise<unknown> }
  mcp: { transform(cb: (editor: McpEditor) => void): Promise<unknown> }
  session: { prompt(input: Record<string, unknown>): Promise<unknown> }
}

const MCP_NAME = "resume-tailor-playwright"
const MCP_CONFIG = {
  type: "local" as const,
  command: ["npx", "-y", "@playwright/mcp@latest"],
}

const INIT_SKILL_ID = "resume-tailor-init"
const GENERATE_SKILL_ID = "resume-tailor-generate"

type PreparedSkill = {
  id: string
  name: string
  description: string
  path: string
  body: string
  autoinvoke: boolean
}

function prepareSkill(
  source: SkillSource,
  id: string,
  name: string,
  autoinvoke: boolean,
  input: RegisterInput,
): PreparedSkill {
  const parsed = parseSkillFile(source.markdown)
  return {
    id,
    name,
    description: parsed.description,
    path: source.path,
    body: transformBody(parsed.body, {
      projectDir: input.projectDir,
      pluginRoot: input.pluginRoot,
    }),
    autoinvoke,
  }
}

export function buildCommandText(input: {
  skillId: string
  baseDir: string
  body: string
  userText: string
}): string {
  const text = `You are running the resume-tailor \`${input.skillId}\` skill. Its base directory is \`${input.baseDir}\`. Follow these instructions exactly.\n\n${input.body}`
  return input.userText.trim() ? `${text}\n\n---\n\nUser input: ${input.userText}` : text
}

const COMMANDS: Array<{
  name: string
  description: string
  skill: "init" | "generate"
}> = [
  {
    name: INIT_SKILL_ID,
    description: "Set up resume-tailor in this project: config, master data and template.",
    skill: "init",
  },
  {
    name: GENERATE_SKILL_ID,
    description: "Generate a tailored LaTeX resume from a job description.",
    skill: "generate",
  },
  {
    name: "resume-tailor-gen",
    description: "Generate a tailored LaTeX resume from a job description (alias).",
    skill: "generate",
  },
]

export async function register(ctx: RegisterContext, input: RegisterInput): Promise<void> {
  const init = prepareSkill(input.skills.init, INIT_SKILL_ID, "Resume Tailor Init", false, input)
  const generate = prepareSkill(
    input.skills.generate,
    GENERATE_SKILL_ID,
    "Resume Tailor Generate",
    true,
    input,
  )

  await ctx.skill.transform((editor) => {
    editor.add({
      id: Skill.ID.make(init.id),
      name: Skill.Name.make(init.name),
      description: init.description,
      path: Skill.Info.fields.path.make(init.path),
      content: init.body,
      autoinvoke: init.autoinvoke,
    })
    editor.add({
      id: Skill.ID.make(generate.id),
      name: Skill.Name.make(generate.name),
      description: generate.description,
      path: Skill.Info.fields.path.make(generate.path),
      content: generate.body,
      autoinvoke: generate.autoinvoke,
    })
  })

  const prepared = { init, generate }
  await ctx.command.transform((editor) => {
    for (const command of COMMANDS) {
      const skill = prepared[command.skill]
      editor.add({
        name: command.name,
        description: command.description,
        async execute({ sessionID, prompt, delivery }) {
          await ctx.session.prompt({
            ...prompt,
            sessionID,
            text: buildCommandText({
              skillId: skill.id,
              baseDir: dirname(skill.path),
              body: skill.body,
              userText: prompt.text,
            }),
            delivery,
          })
        },
      })
    }
  })

  if (input.playwright) {
    await ctx.mcp.transform((editor) => {
      if (!editor.get(MCP_NAME)) editor.set(MCP_NAME, MCP_CONFIG)
    })
  }
}
