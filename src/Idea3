import { Types } from "@graphql-codegen/plugin-helpers"
import { addMocksToSchema } from "@graphql-tools/mock"
import {
  GraphQLScalarType,
  GraphQLSchema,
  graphqlSync,
  Kind,
  print,
} from "graphql"
import seed from "seed-random"

type PluginConfig = {
  customValues?: { [key: string]: any }
}

// defaultMockMap.set('Int', () => Math.round(Math.random() * 200) - 100);
// defaultMockMap.set('Float', () => Math.random() * 200 - 100);
// defaultMockMap.set('String', () => 'Hello World');
// defaultMockMap.set('Boolean', () => Math.random() > 0.5);
// defaultMockMap.set('ID', () => uuidv4())

export const plugin = (
  schema: GraphQLSchema,
  documents: Types.DocumentFile[],
  config?: PluginConfig
) => {
  let unnamedOperationCount = 0
  const results = []
  const random = seed("123")

  const defaultMocks = {
    String: () => config?.customValues?.String ?? "Hello World",
    Int: () => config?.customValues?.Int ?? 123456,
    Float: () => config?.customValues?.Float ?? 123.456,
    Boolean: () => config?.customValues?.Boolean ?? true,
    ID: () => config?.customValues?.ID ?? "xxxxxxxx",
  }

  const mocks = Object.values(schema.getTypeMap()).reduce((mocks, type) => {
    if (type instanceof GraphQLScalarType) {
      if (!(type.name in mocks)) {
        const returnValue = config?.customValues?.[type.name] ?? type.name
        mocks[type.name] = () => returnValue
      }
    }
    return mocks
  }, defaultMocks)

  const mockedSchema = addMocksToSchema({ schema, mocks })

  for (const document of documents) {
    for (const definition of document.document.definitions) {
      if (definition.kind === Kind.OPERATION_DEFINITION) {
        const operationName =
          definition?.name?.value ?? `Unnamed_${++unnamedOperationCount}_`

        const data = graphqlSync(mockedSchema, print(definition))
        results.push(`const ${operationName}Mock = ${JSON.stringify(data)};`)
      }
    }
  }

  return results.join("\n\n")
}
