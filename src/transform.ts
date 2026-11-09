export interface ParsedSkill {
  description: string
  body: string
}

export interface TransformContext {
  projectDir: string
  pluginRoot: string
}

export const OPENCODE_APPENDIX = `## OpenCode notes

- Ask the user with the \`question\` tool. Every question always offers a free-form answer.
- If the Playwright MCP is available, reach its tools through \`execute\` under the \`resume-tailor-playwright\` namespace (e.g. \`tools["resume-tailor-playwright"].browser_navigate\`). If it is not available, use \`webfetch\` first and mention enabling Playwright only when the JD is JS-rendered.
- Run \`build.py\` with the \`shell\` tool.
- For multi-select questions, set \`multiple: true\` on the \`question\` tool input.`

export function parseSkillFile(markdown: string): ParsedSkill {
  if (!markdown.startsWith("---\n")) {
    return { description: "", body: markdown.trimStart() }
  }

  const end = markdown.indexOf("\n---\n", 4)
  if (end === -1) {
    return { description: "", body: markdown.trimStart() }
  }

  const data: Record<string, string> = {}
  for (const line of markdown.slice(4, end).split("\n")) {
    const colon = line.indexOf(":")
    if (colon === -1) continue
    data[line.slice(0, colon).trim()] = line.slice(colon + 1).trim()
  }

  return {
    description: data.description ?? "",
    body: markdown.slice(end + 5).trimStart(),
  }
}

export function transformBody(body: string, ctx: TransformContext): string {
  let out = body
  out = out.replaceAll("${CLAUDE_PROJECT_DIR}", ctx.projectDir)
  out = out.replaceAll("${CLAUDE_PLUGIN_ROOT}", ctx.pluginRoot)
  out = out.replaceAll("AskUserQuestion", "question")
  out = out.replaceAll("multiSelect", "multiple")
  out = out.replaceAll("WebFetch", "webfetch")
  out = out.replaceAll("`Write`", "`write`")
  out = out.replaceAll("`Bash`", "`shell`")
  out = out.replaceAll("$ARGUMENTS[0]", "the JD argument passed with the command")
  out = out.replaceAll("/resume-tailor:init", "/resume-tailor-init")
  out = out.replaceAll("/resume-tailor:generate", "/resume-tailor-generate")
  out = out.replaceAll("/resume-tailor:gen", "/resume-tailor-gen")
  return out.trimEnd() + "\n\n" + OPENCODE_APPENDIX
}
