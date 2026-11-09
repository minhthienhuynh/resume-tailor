import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { Plugin } from "@opencode/plugin"
import { loadRegisterInput } from "./load.ts"
import { register } from "./register.ts"

const pluginRoot = dirname(fileURLToPath(import.meta.url))

export default Plugin.define({
  id: "resume-tailor-opencode",
  async setup(ctx) {
    await register(
      ctx,
      loadRegisterInput({
        pluginRoot,
        projectDir: ctx.location.directory,
        playwright: ctx.options.playwright !== false,
      }),
    )
  },
})
