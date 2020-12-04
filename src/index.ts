import { PluginFunction, Types } from "@graphql-codegen/plugin-helpers"
import { convertFactory } from "@graphql-codegen/visitor-plugin-common"
import {
  GraphQLSchema,
  SelectionSetNode,
  Kind,
  DocumentNode,
  FragmentDefinitionNode,
  FieldNode,
  OperationDefinitionNode,
  getOperationRootType,
  GraphQLObjectType,
  GraphQLScalarType,
  getNamedType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNamedType,
  getNullableType,
  GraphQLInputObjectType,
} from "graphql"
import seed from "seed-random"

type MocksPluginConfig = {
  customValues?: { [key: string]: any }
  noExport?: boolean
  namePrefix?: string
  nameSuffix?: string
  namingConvention?: string
}

const defaultConfig: MocksPluginConfig = {
  noExport: false,
  nameSuffix: "Mock",
}

export const plugin: PluginFunction<
  MocksPluginConfig,
  Types.ComplexPluginOutput
> = (schema, documents, config, info) => {
  const mergedConfig = {
    ...defaultConfig,
    ...config,
  }

  const isTS = !!info?.outputFile?.match(/.(ts|tsx)$/)

  const buildName = nameBuilderFactory(mergedConfig)
  const results = []

  for (const document of documents) {
    for (const definition of document.document.definitions) {
      if (definition.kind === Kind.OPERATION_DEFINITION) {
        const operationName = buildName(definition)
        const operationType = isTS
          ? buildType(definition, schema, mergedConfig)
          : ""

        const data = execute(
          schema,
          document.document,
          definition.name?.value,
          mergedConfig
        )
        const exportValue = mergedConfig.noExport ? "" : "export"
        results.push(
          `${exportValue} const ${operationName}${operationType} = { data: ${data} };`
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

type FragmentMap = { [name: string]: FragmentDefinitionNode }
type VisitedFragmentNames = { [name: string]: boolean }
type FieldsMap = { [name: string]: FieldNode[] }
type ExecutionContext = {
  schema: GraphQLSchema
  fragments: FragmentMap
  operation: OperationDefinitionNode
  config: MocksPluginConfig
  random: ReturnType<typeof seed>
}

// This is a very trimmed down version of this function, only taking what we need:
// https://github.com/graphql/graphql-js/blob/d6e760cf7060217bd25fa934bd104ff2400aad96/src/execution/execute.js#L300
function buildExecutionContext(
  schema: GraphQLSchema,
  document: DocumentNode,
  operationName: string,
  config: MocksPluginConfig
): ExecutionContext {
  let operation: OperationDefinitionNode
  const fragments: FragmentMap = Object.create(null)
  for (const definition of document.definitions) {
    switch (definition.kind) {
      case Kind.OPERATION_DEFINITION:
        if (operationName == null) {
          operation = definition
        } else if (definition.name?.value === operationName) {
          operation = definition
        }
        break
      case Kind.FRAGMENT_DEFINITION:
        fragments[definition.name.value] = definition
    }
  }

  return {
    schema,
    fragments,
    operation,
    config,
    random: seed("123"),
  }
}

function execute(
  schema: GraphQLSchema,
  document: DocumentNode,
  operationName: string,
  config: MocksPluginConfig
) {
  const context = buildExecutionContext(schema, document, operationName, config)
  const result = executeOperation(context, context.operation)
  return result
}

function executeOperation(
  context: ExecutionContext,
  operation: OperationDefinitionNode
) {
  const type = getOperationRootType(context.schema, context.operation)
  const res = executeSelectionSet(context, type, operation.selectionSet)
  return res
}

function executeSelectionSet(
  context: ExecutionContext,
  parentType: GraphQLObjectType,
  selectionSet: SelectionSetNode
) {
  const fields = collectFields(
    context,
    parentType,
    selectionSet,
    Object.create(null),
    Object.create(null)
  )

  const result = []

  for (const fieldName of Object.keys(fields)) {
    const field = resolveField(context, parentType, fields[fieldName])

    // Filter unresolved fields (like on union selection set)
    if (field) {
      result.push(field)
    }
  }

  return `{ ${result.join(", ")} }`
}

function resolveField(
  context: ExecutionContext,
  parentType: GraphQLObjectType,
  fieldNodes: FieldNode[]
) {
  const fieldNode = fieldNodes[0]
  const fieldName = fieldNode.name.value
  const fieldReturnName = fieldNode.alias?.value ?? fieldName

  if (fieldName === "__typename") {
    return `__typename: '${parentType.name}'`
  }

  const fieldDef = parentType.getFields()[fieldName]
  if (!fieldDef) {
    return ""
  }

  // unwrap NonNull types
  const unwrapped = getNullableType(fieldDef.type)
  // unwrap list types
  const type = getNamedType(fieldDef.type)

  if (unwrapped instanceof GraphQLList) {
    return `${fieldReturnName}: [${handleNamedType(context, type, fieldNode)}]`
  }

  return `${fieldReturnName}: ${handleNamedType(context, type, fieldNode)}`
}

function handleNamedType(
  context: ExecutionContext,
  type: GraphQLNamedType,
  fieldNode: FieldNode
) {
  // taken from https://github.com/ardatan/graphql-tools/blob/master/packages/mock/src/mocking.ts#L57-L64
  function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (context.random() * 16) | 0
      const v = c == "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  const scalarToValue = {
    String: () => "'Hello World'",
    Int: () => Math.round(context.random() * 200 - 100),
    Float: () => Number((context.random() * 200 - 100).toFixed(2)),
    Boolean: () => context.random() > 0.5,
    ID: () => `'${uuidv4()}'`,
  }

  if (type instanceof GraphQLScalarType) {
    const customScalarValue = context.config?.customValues?.[type.name]
    if (customScalarValue) {
      if (typeof customScalarValue === "string") {
        return `'${customScalarValue}'`
      }
      return `${customScalarValue}`
    } else if (scalarToValue[type.name]) {
      return `${scalarToValue[type.name]()}`
    }
    return `'${type.name}'`
  }

  if (type instanceof GraphQLObjectType) {
    return executeSelectionSet(context, type, fieldNode.selectionSet)
  }

  if (type instanceof GraphQLInterfaceType) {
    const types = getImplementingObjects(context.schema, type)
    return `${executeSelectionSet(context, types[0], fieldNode.selectionSet)}`
  }

  if (type instanceof GraphQLUnionType) {
    const selectedType = type.getTypes()[0]
    return `${executeSelectionSet(
      context,
      selectedType,
      fieldNode.selectionSet
    )}`
  }

  if (type instanceof GraphQLEnumType) {
    const value = type.getValues()[0]?.name
    return `'${value}'`
  }

  // if (type instanceof GraphQLInputObjectType) {
  //   console.log("HERE")
  //   return ""
  // }

  return ""
}

function collectFields(
  context: ExecutionContext,
  runtimeType: GraphQLObjectType,
  selectionSet: SelectionSetNode,
  fields: FieldsMap,
  visitedFragmentNames: VisitedFragmentNames
) {
  for (const selection of selectionSet.selections) {
    switch (selection.kind) {
      case Kind.FIELD: {
        const responseKey = selection.alias?.value ?? selection.name.value
        if (!fields[responseKey]) {
          fields[responseKey] = []
        }
        fields[responseKey].push(selection)
        break
      }
      case Kind.FRAGMENT_SPREAD: {
        const fragmentName = selection.name.value
        if (visitedFragmentNames[fragmentName]) {
          continue
        }
        visitedFragmentNames[fragmentName] = true
        const fragment = context.fragments[fragmentName]
        if (!fragment) {
          continue
        }
        collectFields(
          context,
          runtimeType,
          fragment.selectionSet,
          fields,
          visitedFragmentNames
        )
        break
      }
      case Kind.INLINE_FRAGMENT: {
        collectFields(
          context,
          runtimeType,
          selection.selectionSet,
          fields,
          visitedFragmentNames
        )
      }
    }
  }
  return fields
}

function getImplementingObjects(
  schema: GraphQLSchema,
  gqlInterface: GraphQLInterfaceType
) {
  return Object.values(schema.getTypeMap()).reduce((returnTypes, type) => {
    if (type instanceof GraphQLObjectType) {
      const interfaces = type.getInterfaces()
      if (interfaces.includes(gqlInterface)) {
        returnTypes.push(type)
      }
    }
    return returnTypes
  }, [])
}

function toPascalCase(input: string) {
  return input[0].toLowerCase() + input.slice(1)
}

function capitalize(input: string) {
  return input[0].toUpperCase() + input.slice(1)
}

// TODO: clean up this function
function nameBuilderFactory(config: MocksPluginConfig) {
  let unnamedOperationCount = 0

  return function buildName(operation: OperationDefinitionNode) {
    let name = ""

    if (config.namePrefix) {
      name += config.namePrefix
    }

    const formatter = config.namePrefix ? capitalize : toPascalCase
    const baseName =
      operation.name?.value ?? `Unnamed_${++unnamedOperationCount}_`
    name += formatter(baseName)

    name += config.nameSuffix

    return name
  }
}

function buildType(
  operation: OperationDefinitionNode,
  schema: GraphQLSchema,
  config: MocksPluginConfig
) {
  const root = getOperationRootType(schema, operation)
  const convert = convertFactory({ namingConvention: config.namePrefix })
  const name = convert(operation)
  return `: ExecutionResult<${name + root.name}>`
}
