import { buildSchema, parse } from "graphql"

import { plugin } from "../src/index"

const schema = buildSchema(/* GraphQL */ `
  scalar Custom

  union TestUnion = TestSubType1 | TestSubType2

  enum TestEnum {
    Option1
    Option2
  }

  type TestSubType1 {
    int: Int
    float: Float
  }

  type TestSubType2 {
    string: String
    boolean: Boolean
  }

  interface TestInterface {
    id: ID!
  }

  type TestInterfaceType1 implements TestInterface {
    id: ID!
    name: String!
  }

  type TestInterfaceType2 implements TestInterface {
    id: ID!
    value: Int!
  }

  type TestType {
    int: Int
    float: Float
    string: String
    boolean: Boolean
    id: ID
    custom: Custom
    testType: TestType
    enum: TestEnum
    list: [TestType!]!
    stringList: [String]
  }

  type Query {
    testType: TestType!
    testUnion: TestUnion!
    testInterface: TestInterface!
  }

  type Mutation {
    testMutation: TestType
  }
`)

function buildDocuments(documents: string[]) {
  return documents.map((document) => ({ document: parse(document) }))
}

it("handles list types", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          list {
            string
          }
        }
      }
    `,
    /* GraphQL */ `
      query test2 {
        testType {
          stringList
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {})
  expect(output.content.trim()).toEqual(
    [
      "export const testQueryMock = { data: { testType: { list: [{ string: 'Hello World' }, { string: 'Hello World' }, { string: 'Hello World' }] } } };",
      "export const test2QueryMock = { data: { testType: { stringList: ['Hello World', 'Hello World'] } } };",
    ].join("\n\n")
  )
})

it("mocks built in scalar values", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          int
          float
          string
          boolean
          id
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {})
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { int: 84, float: -27.84, string: 'Hello World', boolean: false, id: '9e6ea9fe-e42a-4996-a587-ce71904308da' } } };"
  )
})

it("handles __typename", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          __typename
          testType {
            __typename
          }
          list {
            __typename
          }
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {})
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { __typename: 'TestType', testType: { __typename: 'TestType' }, list: [{ __typename: 'TestType' }, { __typename: 'TestType' }, { __typename: 'TestType' }] } } };"
  )
})

it("does not render exports if noExport is true", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          string
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, { noExport: true })
  expect(output.content.trim()).toEqual(
    "const testQueryMock = { data: { testType: { string: 'Hello World' } } };"
  )
})

it("adds name prefix if one is passed in config", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          string
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, { namePrefix: "my" })
  expect(output.content.trim()).toEqual(
    "export const myTestQueryMock = { data: { testType: { string: 'Hello World' } } };"
  )
})

it("allows a custom name suffix if one is passed in config", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          string
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, { nameSuffix: "" })
  expect(output.content.trim()).toEqual(
    "export const test = { data: { testType: { string: 'Hello World' } } };"
  )
})

it("handles aliasing field names", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          testAlias: int
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {})
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { testAlias: 84 } } };"
  )
})

it("gives a place holder name for unnamed operations", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      {
        testType {
          id
        }
      }
    `,
    /* GraphQL */ `
      {
        testType {
          string
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {})
  expect(output.content.trim()).toEqual(
    [
      "export const unnamed_1_QueryMock = { data: { testType: { id: 'e509e6ea-9fee-442a-9962-587ce7190430' } } };",
      "export const unnamed_2_QueryMock = { data: { testType: { string: 'Hello World' } } };",
    ].join("\n\n")
  )
})

it("handles nested fields", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          testType {
            int
          }
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {})
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { testType: { int: 84 } } } };"
  )
})

it("uses type name as value for custom scalars", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          custom
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {})
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { custom: 'Custom' } } };"
  )
})

it("allows defining string values for custom scalars using the scalarValues config", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          custom
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {
    customScalarValues: { Custom: "test value" },
  })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { custom: 'test value' } } };"
  )
})

it("allows defining number values for custom scalars using the scalarValues config", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          custom
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {
    customScalarValues: { Custom: 1234 },
  })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { custom: 1234 } } };"
  )
})

it("allows defining boolean values for custom scalars using the scalarValues config", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          custom
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {
    customScalarValues: { Custom: true },
  })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { custom: true } } };"
  )
})

it("allows built in scalar values to be overwritten with scalarValues config", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          int
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {
    customScalarValues: { Int: 978654 },
  })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { int: 978654 } } };"
  )
})

it("handles enum types", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          enum
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {})
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { enum: 'Option1' } } };"
  )
})

it("handles unions", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testUnion {
          __typename
          ... on TestSubType1 {
            int
            float
          }
          ... on TestSubType2 {
            string
            boolean
          }
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {})
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testUnion: { __typename: 'TestSubType1', int: 84, float: -27.84 } } };"
  )
})

it("handles interfaces", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testInterface {
          __typename
          ... on TestInterfaceType1 {
            id
            name
          }
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {})
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testInterface: { __typename: 'TestInterfaceType1', id: 'e509e6ea-9fee-442a-9962-587ce7190430', name: 'Hello World' } } };"
  )
})

it("handles fragments", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          ...testFragment
        }
      }

      fragment testFragment on TestType {
        string
        int
        boolean
      }
    `,
  ])
  const output = await plugin(schema, documents, {})
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { string: 'Hello World', int: 84, boolean: false } } };"
  )
})

it("handles nested fragments", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          ...testFragment
        }
      }

      fragment testFragment on TestType {
        string
        ...nestedTestFragment
      }

      fragment nestedTestFragment on TestType {
        int
        boolean
      }
    `,
  ])
  const output = await plugin(schema, documents, {})
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { string: 'Hello World', int: 84, boolean: false } } };"
  )
})

it("does not prepend ExecutionResult import if output is not a .ts or .tsx file", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          string
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {}, { outputFile: "test.js" })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { string: 'Hello World' } } };"
  )
  expect(output.prepend[0]).toBeUndefined()
})

it("adds TypeScript specific code if output file is a .ts file", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          string
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {}, { outputFile: "test.ts" })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock: ExecutionResult<TestQuery> = { data: { testType: { string: 'Hello World' } } };"
  )
  expect(output.prepend[0]).toEqual("import { ExecutionResult } from 'graphql'")
})

it("adds TypeScript specific code if output file is a .tsx file", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          string
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {}, { outputFile: "test.tsx" })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock: ExecutionResult<TestQuery> = { data: { testType: { string: 'Hello World' } } };"
  )
  expect(output.prepend[0]).toEqual("import { ExecutionResult } from 'graphql'")
})

it("handles mutations", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      mutation test {
        testMutation {
          string
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {})
  expect(output.content.trim()).toEqual(
    "export const testMutationMock = { data: { testMutation: { string: 'Hello World' } } };"
  )
})

it("adds typenames if addTypename is set in config", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          string
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, { addTypename: true })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { __typename: 'Query', testType: { __typename: 'TestType', string: 'Hello World' } } };"
  )
})

it("does not add extra __typename to object that is already querying for it", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          string
          __typename
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, { addTypename: true })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { __typename: 'Query', testType: { string: 'Hello World', __typename: 'TestType' } } };"
  )
})

it("renders immutable result if the config option is set", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          string
        }
      }
    `,
  ])
  const output = await plugin(
    schema,
    documents,
    { immutableResults: true },
    { outputFile: "output.ts" }
  )
  expect(output.content.trim()).toEqual(
    "export const testQueryMock: ExecutionResult<ReadOnly<TestQuery>> = { data: { testType: { string: 'Hello World' } } } as const;"
  )
})

it("does not render immutable result if the config option is set but file is not TypeScript", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query test {
        testType {
          string
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, { immutableResults: true })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { string: 'Hello World' } } };"
  )
})
