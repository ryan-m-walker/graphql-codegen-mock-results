import { convertFactory } from "@graphql-codegen/visitor-plugin-common"
import {
  GraphQLSchema,
  OperationDefinitionNode,
  getOperationRootType,
} from "graphql"
import type { JsonValue } from "type-fest"

import { MocksPluginConfig } from "./config"
import { PluginInfo } from "./types"

export function renderResult(
  operation: OperationDefinitionNode,
  schema: GraphQLSchema,
  data: string,
  config: MocksPluginConfig,
  isTypeScript: boolean,
  nameBuilder: ReturnType<typeof nameBuilderFactory>,
  info: PluginInfo
): string {
  const operationName = nameBuilder(operation)
  const operationType = isTypeScript
    ? buildType(operation, schema, config, info)
    : ""
  return `export const ${operationName}${operationType} = { data: ${data} };`
}

export function buildType(
  operation: OperationDefinitionNode,
  schema: GraphQLSchema,
  config: MocksPluginConfig,
  info: PluginInfo
): string {
  const typeScriptOperationsPlugin = info?.allPlugins?.find(
    (plugin) => "typescript-operations" in plugin
  )?.["typescript-operations"]

  const namingConvention =
    typeScriptOperationsPlugin?.namingConvention ?? config.namingConvention
  const typesPrefix =
    typeScriptOperationsPlugin?.typesPrefix ?? config.typesPrefix
  const typesSuffix =
    typeScriptOperationsPlugin?.typesSuffix ?? config.typesSuffix

  const root = getOperationRootType(schema, operation)
  const convert = convertFactory({ namingConvention })
  const name = convert(operation)
  const nameWithOperation = convert(name + root)
  return `: ExecutionResult<${typesPrefix + nameWithOperation + typesSuffix}>`
}

export type NameBuilderFn = (operation: OperationDefinitionNode) => string

// TODO: clean up this function
export function nameBuilderFactory(
  schema: GraphQLSchema,
  config: MocksPluginConfig
): NameBuilderFn {
  let unnamedOperationCount = 0

  return function buildName(operation: OperationDefinitionNode) {
    const convert = convertFactory({
      namingConvention: config.mockNamingConvention,
    })
    let name = ""

    name += config.mockPrefix

    const baseName =
      operation.name?.value ?? `Unnamed_${++unnamedOperationCount}_`

    name += convert(
      baseName + getOperationRootType(schema, operation).name + "Mock"
    )

    name += config.mockSuffix

    return name
  }
}

export function renderCustomScalarValue(input: JsonValue): string {
  if (input === null) return "null"
  if (typeof input === "string") return `'${input}'`
  if (typeof input === "object") return JSON.stringify(input)
  return input.toString()
}
