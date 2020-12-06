import { convertFactory } from "@graphql-codegen/visitor-plugin-common"
import {
  GraphQLSchema,
  OperationDefinitionNode,
  getOperationRootType,
} from "graphql"
import type { JsonValue } from "type-fest"

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
  const operationName = nameBuilder(operation)
  const operationType = isTypeScript ? buildType(operation, schema, config) : ""
  return `export const ${operationName}${operationType} = { data: ${data} };`
}

export function buildType(
  operation: OperationDefinitionNode,
  schema: GraphQLSchema,
  config: MocksPluginConfig
): string {
  const root = getOperationRootType(schema, operation)
  const convert = convertFactory({ namingConvention: config.namingConvention })
  const name = convert(operation)
  return `: ExecutionResult<${name + root.name}>`
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

    if (config.mockPrefix != null) {
      name += config.mockPrefix
    }

    const formatter = config.mockPrefix ? capitalize : toPascalCase
    const baseName =
      operation.name?.value ?? `Unnamed_${++unnamedOperationCount}_`
    name += formatter(baseName)

    if (config.mockSuffix != null) {
      name += config.mockSuffix
    } else {
      const operationTypeName = getOperationRootType(schema, operation).name
      name += operationTypeName + "Mock"
    }

    return name
  }
}

export function renderCustomScalarValue(input: JsonValue): string {
  if (input === null) return "null"
  if (typeof input === "string") return `'${input}'`
  if (typeof input === "object") return JSON.stringify(input)
  return input.toString()
}
