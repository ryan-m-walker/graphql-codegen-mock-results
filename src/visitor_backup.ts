// import {
//   GraphQLSchema,
//   OperationDefinitionNode,
//   TypeInfo,
//   FieldNode,
//   GraphQLScalarType,
//   GraphQLObjectType,
//   GraphQLList,
//   GraphQLNonNull,
//   GraphQLOutputType,
//   DocumentNode,
//   GraphQLEnumType,
//   GraphQLUnionType,
//   InlineFragmentNode,
//   SelectionSetNode,
//   NamedTypeNode,
//   typeFromAST,
//   getOperationRootType,
//   FragmentSpreadNode,
//   FragmentDefinitionNode,
//   Kind,
//   ScalarTypeDefinitionNode,
// } from "graphql"

// const scalarToValue = {
//   String: "'Hello World'",
//   Int: 123456,
//   Float: 123.456,
//   Boolean: true,
//   ID: "'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'",
// }

// export class Visitor {
//   private _fragments: FragmentDefinitionNode[] = []
//   private _unnamedOperationCount = 0

//   constructor(
//     private _schema: GraphQLSchema,
//     private _typeInfo: TypeInfo,
//     private _ast: DocumentNode,
//     private _config: any
//   ) {}

//   Field = (node: FieldNode) => {
//     const fieldType = this._typeInfo.getType()

//     const fieldName = node.alias?.value ?? node.name.value
//     return `${fieldName}: ${this._handleFieldValue(node, fieldType)}`
//   }

//   OperationDefinition = (node: OperationDefinitionNode) => {
//     const operationName = node.name?.value ?? this._getUnnamedOperationName()
//     // const operation = getOperationRootType(this._schema, node)
//     // return `const ${operationName}Mock: ${operationName}${operation} = { ${node.selectionSet} };\n`
//     return `const ${operationName}Mock = { data: { ${node.selectionSet} } };\n`
//   }

//   Document = (node: DocumentNode) => {
//     return node.definitions.join("\n")
//   }

//   InlineFragment = (node: InlineFragmentNode) => {
//     const parent = this._typeInfo.getParentType()?.astNode

//     if (parent) {
//       switch (parent.kind) {
//         case "UnionTypeDefinition": {
//           const type = parent.types[0].name.value
//           if (node.typeCondition?.name.value === type) {
//             return node.selectionSet
//           }
//         }

//         case "InterfaceTypeDefinition":
//         case "ObjectTypeDefinition":
//         default:
//           return null
//       }
//     }

//     return null
//   }

//   FragmentSpread = (node: FragmentSpreadNode) => {
//     console.log("parent", this._typeInfo.getType())
//     console.log(node)
//     console.log(this._getFragment(node.name.value).selectionSet.selections)
//   }

//   // NamedType = (node: NamedTypeNode) => {
//   //   console.log("named type", node)
//   // }

//   SelectionSet = (node: SelectionSetNode) => {
//     return node.selections.join(", ")
//   }

//   private _handleFieldValue = (
//     node: FieldNode,
//     fieldType: GraphQLOutputType
//   ): string | undefined => {
//     // Unwrap NonNull types
//     if (fieldType instanceof GraphQLNonNull) {
//       return this._handleFieldValue(node, fieldType.ofType)
//     }

//     if (fieldType instanceof GraphQLScalarType) {
//       if (node.name.value === "__typename") {
//         const parent = this._typeInfo.getParentType()
//         switch (parent?.astNode?.kind) {
//           case "ObjectTypeDefinition":
//             return `'${parent}'`
//           case "UnionTypeDefinition":
//             return `'${parent.astNode.types?.[0].name.value}'`
//           case "InterfaceTypeDefinition":
//             return `'${parent.astNode.interfaces?.[0].name.value}'`
//         }
//       }

//       if (!scalarToValue[fieldType.name]) {
//         const customScalarValue = this._config?.scalarValues[fieldType.name]
//         if (customScalarValue) {
//           if (typeof customScalarValue === "string") {
//             return `'${customScalarValue}'`
//           }
//           return customScalarValue
//         }
//         return "'custom'"
//       }

//       return scalarToValue[fieldType.name]
//     }

//     if (fieldType instanceof GraphQLObjectType) {
//       return `{ ${node.selectionSet} }`
//     }

//     if (fieldType instanceof GraphQLList) {
//       return `[${this._handleFieldValue(node, fieldType.ofType)}]`
//     }

//     // TODO: interface

//     // TODO: union
//     if (fieldType instanceof GraphQLUnionType) {
//       const unionType = fieldType.astNode.types[0]

//       if (scalarToValue[unionType.name.value]) {
//         return scalarToValue[unionType.name.value]
//       }

//       if (node.selectionSet) {
//         return `{ ${node.selectionSet} }`
//       }
//     }

//     if (fieldType instanceof GraphQLEnumType) {
//       return `'${fieldType.astNode.values[0].name.value}'`
//     }
//   }

//   private _getUnnamedOperationName() {
//     return `Unnamed_${++this._unnamedOperationCount}_`
//   }

//   private _getDocument = (): DocumentNode => {
//     return this._ast
//   }

//   private _getFragment = (name: string): FragmentDefinitionNode => {
//     let fragments = this._fragments
//     if (!fragments) {
//       this._fragments = fragments = this._getDocument().definitions.reduce(
//         (frags, statement) => {
//           if (statement.kind === Kind.FRAGMENT_DEFINITION) {
//             frags[statement.name.value] = statement
//           }
//           return frags
//         },
//         Object.create(null)
//       )
//     }
//     return fragments[name]
//   }
// }
