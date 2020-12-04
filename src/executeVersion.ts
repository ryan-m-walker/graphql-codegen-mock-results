import { Types } from "@graphql-codegen/plugin-helpers"
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
} from "graphql"

const scalarToValue = {
  String: "'Hello World'",
  Int: 123456,
  Float: 123.456,
  Boolean: true,
  ID: "'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'",
}

export const plugin = (
  schema: GraphQLSchema,
  documents: Types.DocumentFile[],
  config?: object
) => {
  let unnamedOperationCount = 0
  const results = []

  for (const document of documents) {
    for (const definition of document.document.definitions) {
      if (definition.kind === Kind.OPERATION_DEFINITION) {
        const operationName =
          definition?.name?.value ?? `Unnamed_${++unnamedOperationCount}_`
        const data = execute(
          schema,
          document.document,
          definition.name?.value,
          config
        )
        results.push(`const ${operationName}Mock = { data: ${data} };`)
      }
    }
  }

  return results.join("\n\n")
}

type FragmentMap = { [name: string]: FragmentDefinitionNode }
type VisitedFragmentNames = { [name: string]: boolean }
type FieldsMap = { [name: string]: FieldNode[] }
type ExecutionContext = {
  schema: GraphQLSchema
  fragments: FragmentMap
  operation: OperationDefinitionNode
  config: any // TODO: type this
}

// This is a very trimmed down version of this function, only taking what we need:
// https://github.com/graphql/graphql-js/blob/d6e760cf7060217bd25fa934bd104ff2400aad96/src/execution/execute.js#L300
function buildExecutionContext(
  schema: GraphQLSchema,
  document: DocumentNode,
  operationName: string,
  config: any // TODO: type
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
  }
}

function execute(
  schema: GraphQLSchema,
  document: DocumentNode,
  operationName: string,
  config: any // TODO: type this
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

  const type = getNamedType(fieldDef.type)

  if (fieldName === "__typename") {
    return `__typename: ${type.name}`
  }

  if (type instanceof GraphQLScalarType) {
    const customScalarValue = context.config?.scalarValues?.[type.name]
    if (customScalarValue) {
      if (typeof customScalarValue === "string") {
        return `${fieldReturnName}: '${customScalarValue}'`
      }
      return `${fieldReturnName}: ${customScalarValue}`
    } else if (scalarToValue[type.name]) {
      return `${fieldReturnName}: ${scalarToValue[type.name]}`
    }
    return `${fieldReturnName}: 'custom'`
  }

  if (type instanceof GraphQLObjectType) {
    return `${
      fieldNode.alias?.value ?? fieldNode.name.value
    }: ${executeSelectionSet(context, type, fieldNode.selectionSet)}`
  }

  if (type instanceof GraphQLInterfaceType) {
    const types = getImplementingObjects(context.schema, type)
    return `${fieldReturnName}: ${executeSelectionSet(
      context,
      types[0],
      fieldNode.selectionSet
    )}`
  }

  if (type instanceof GraphQLUnionType) {
    const selectedType = type.getTypes()[0]
    return `${fieldReturnName}: ${executeSelectionSet(
      context,
      selectedType,
      fieldNode.selectionSet
    )}`
  }

  if (type instanceof GraphQLEnumType) {
    const value = type.getValues()[0]?.name
    return `${fieldReturnName}: '${value}'`
  }

  // TODO: Input Object Type??

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
