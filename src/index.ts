import { PluginFunction, Types } from "@graphql-codegen/plugin-helpers"
import { Kind } from "graphql"
import seed from "seed-random"

import { MocksPluginConfig } from "./config"
import { execute } from "./execute"
import { nameBuilderFactory, renderResult } from "./render"
import { isTypeScript } from "./utils"

// Use a constant seed so that all random results are consistent
const SEED = "123"

const defaultConfig: MocksPluginConfig = {
  noExport: false,
  addTypename: false,
  immutableResults: false,
}

export const plugin: PluginFunction<
  MocksPluginConfig,
  Types.ComplexPluginOutput
> = (schema, documents, config, info) => {
  const mergedConfig = {
    ...defaultConfig,
    ...config,
  }

  const isTS = isTypeScript(info?.outputFile)
  const results = []
  const buildName = nameBuilderFactory(schema, config)

  const random = seed(SEED)

  for (const document of documents) {
    for (const definition of document.document.definitions) {
      if (definition.kind === Kind.OPERATION_DEFINITION) {
        const data = execute(
          schema,
          document.document,
          definition.name?.value,
          mergedConfig,
          random
        )

        results.push(
          renderResult(definition, schema, data, mergedConfig, isTS, buildName)
        )
      }
    }
  }

  const imports = []
  if (isTS) {
    imports.push("import { ExecutionResult } from 'graphql'")
  }

  return {
    prepend: imports,
    content: results.join("\n\n"),
  }
}
