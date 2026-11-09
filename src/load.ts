import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import type { RegisterInput, SkillSource } from "./register.ts"

function readSkill(pluginRoot: string, id: "init" | "generate"): SkillSource {
  const path = resolve(pluginRoot, "skills", id, "SKILL.md")
  return { path, markdown: readFileSync(path, "utf8") }
}

export function loadRegisterInput(opts: {
  pluginRoot: string
  projectDir: string
  playwright: boolean
}): RegisterInput {
  return {
    projectDir: opts.projectDir,
    pluginRoot: opts.pluginRoot,
    playwright: opts.playwright,
    skills: {
      init: readSkill(opts.pluginRoot, "init"),
      generate: readSkill(opts.pluginRoot, "generate"),
    },
  }
}
