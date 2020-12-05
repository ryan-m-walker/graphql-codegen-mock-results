import { convertFactory } from "@graphql-codegen/visitor-plugin-common"
import {
  GraphQLSchema,
  OperationDefinitionNode,
  getOperationRootType,
} from "graphql"

import { MocksPluginConfig } from "./config"
import { capitalize, toPascalCase } from "./utils"

export function renderResult(
  operation: OperationDefinitionNode,
  schema: GraphQLSchema,
  data: string,
  config: MocksPluginConfig,
  isTypeScript: boolean,
  nameBuilder: ReturnType<typeof nameBuilderFactory>
): string {
  let result = ""

  const operationName = nameBuilder(operation)
  const operationType = isTypeScript ? buildType(operation, schema, config) : ""

  if (!config.noExport) {
    result += "export "
  }

  result += `const ${operationName}${operationType} = { data: ${data} }`

  if (config.immutableResults && isTypeScript) {
    result += " as const"
  }

  result += ";"
  return result
}

export function buildType(
  operation: OperationDefinitionNode,
  schema: GraphQLSchema,
  config: MocksPluginConfig
): string {
  const root = getOperationRootType(schema, operation)
  const convert = convertFactory({ namingConvention: config.namePrefix })
  const name = convert(operation)
  return `: ExecutionResult<${renderReadOnly(
    name + root.name,
    config?.immutableResults
  )}>`
}

export type NameBuilderFn = (operation: OperationDefinitionNode) => string

// TODO: clean up this function
export function nameBuilderFactory(
  schema: GraphQLSchema,
  config: MocksPluginConfig
): NameBuilderFn {
  let unnamedOperationCount = 0

  return function buildName(operation: OperationDefinitionNode) {
    let name = ""

    if (config.namePrefix != null) {
      name += config.namePrefix
    }

    const formatter = config.namePrefix ? capitalize : toPascalCase
    const baseName =
      operation.name?.value ?? `Unnamed_${++unnamedOperationCount}_`
    name += formatter(baseName)

    if (config.nameSuffix != null) {
      name += config.nameSuffix
    } else {
      const operationTypeName = getOperationRootType(schema, operation).name
      name += operationTypeName + "Mock"
    }

    return name
  }
}

function renderReadOnly(value: string, shouldRender: boolean) {
  if (!shouldRender) {
    return value
  }

  return `ReadOnly<${value}>`
}
