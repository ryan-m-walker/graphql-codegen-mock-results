import { convertFactory } from "@graphql-codegen/visitor-plugin-common"
import {
  DocumentNode,
  FieldNode,
  getNamedType,
  getNullableType,
  getOperationRootType,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLSchema,
  isEnumType,
  isInterfaceType,
  isListType,
  isObjectType,
  isScalarType,
  isUnionType,
  Kind,
  OperationDefinitionNode,
  SelectionSetNode,
} from "graphql"

import { MocksPluginConfig } from "./config"
import { randomFactory, RandomFn } from "./random"
import { renderCustomScalarValue } from "./render"
import {
  ExecutionContext,
  FieldsMap,
  FragmentMap,
  VisitedFragmentNames,
} from "./types"

export function execute(
  schema: GraphQLSchema,
  document: DocumentNode,
  operationName: string,
  config: MocksPluginConfig,
  random: RandomFn
): string {
  const context = buildExecutionContext(
    schema,
    document,
    operationName,
    config,
    random
  )
  const result = executeOperation(context, context.operation, config)
  return result
}

// This is a very trimmed down version of this function, only taking what we need:
// https://github.com/graphql/graphql-js/blob/d6e760cf7060217bd25fa934bd104ff2400aad96/src/execution/execute.js#L300
function buildExecutionContext(
  schema: GraphQLSchema,
  document: DocumentNode,
  operationName: string,
  config: MocksPluginConfig,
  random: RandomFn
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
    random: randomFactory(random),
  }
}

function executeOperation(
  context: ExecutionContext,
  operation: OperationDefinitionNode,
  config: MocksPluginConfig
) {
  const type = getOperationRootType(context.schema, context.operation)
  const res = executeSelectionSet(context, type, operation.selectionSet, config)
  return res
}

function executeSelectionSet(
  context: ExecutionContext,
  parentType: GraphQLObjectType,
  selectionSet: SelectionSetNode,
  config: MocksPluginConfig
) {
  const fields = collectFields(
    context,
    parentType,
    selectionSet,
    Object.create(null),
    Object.create(null)
  )

  const result = []

  if (context.config.addTypename && !fields["__typename"]) {
    result.push(`__typename: '${parentType.name}'`)
  }

  for (const fieldName of Object.keys(fields)) {
    const field = resolveField(context, parentType, fields[fieldName], config)
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
  fieldNodes: FieldNode[],
  config: MocksPluginConfig
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

  if (isListType(unwrapped)) {
    const values: string[] = new Array(Math.floor(context.random() * 3) + 1)
      .fill(0)
      .map(() => handleNamedType(context, type, fieldNode, config))
    return `${fieldReturnName}: [${values.join(", ")}]`
  }

  return `${fieldReturnName}: ${handleNamedType(
    context,
    type,
    fieldNode,
    config
  )}`
}

function handleNamedType(
  context: ExecutionContext,
  type: GraphQLNamedType,
  fieldNode: FieldNode,
  config: MocksPluginConfig
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
    Int: () => context.random.int(-100, 100),
    Float: () => context.random.float(-100, 100, 2),
    Boolean: () => context.random.bool(),
    ID: () => `'${uuidv4()}'`,
  }

  if (isScalarType(type)) {
    const customScalarValue = context.config?.customScalarValues?.[type.name]
    if (customScalarValue !== undefined) {
      return renderCustomScalarValue(customScalarValue)
    } else if (scalarToValue[type.name]) {
      return `${scalarToValue[type.name]()}`
    }
    return `'${type.name}'`
  }

  if (isObjectType(type)) {
    return executeSelectionSet(context, type, fieldNode.selectionSet, config)
  }

  if (isInterfaceType(type)) {
    const types = context.schema.getImplementations(type).objects
    return `${executeSelectionSet(
      context,
      types[0],
      fieldNode.selectionSet,
      config
    )}`
  }

  if (isUnionType(type)) {
    const selectedType = type.getTypes()[0]
    return `${executeSelectionSet(
      context,
      selectedType,
      fieldNode.selectionSet,
      config
    )}`
  }

  if (isEnumType(type)) {
    const value = type.getValues()[0]?.name

    if (config.enumValues === "type-value") {
      const convertEnum = convertFactory({
        namingConvention: config.enumValuesConvention,
      })

      const convertType = convertFactory({
        namingConvention: config.typenamesConvention,
      })

      return `${convertType(type.name)}.${convertEnum(value)}`
    }

    return `'${value}'`
  }

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
