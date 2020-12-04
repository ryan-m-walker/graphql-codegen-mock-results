import { plugin } from "../src/index"
import { buildSchema, parse } from "graphql"

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
`)

function buildDocuments(documents: string[]) {
  return documents.map((document) => ({ document: parse(document) }))
}

it("handles list types", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query testQuery {
        testType {
          list {
            string
          }
        }
      }
    `,
    /* GraphQL */ `
      query testQuery2 {
        testType {
          stringList
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {})
  expect(output.content.trim()).toEqual(
    [
      "export const testQueryMock = { data: { testType: { list: [{ string: 'Hello World' }] } } };",
      "export const testQuery2Mock = { data: { testType: { stringList: ['Hello World'] } } };",
    ].join("\n\n")
  )
})

it("mocks built in scalar values", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query testQuery {
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

it("does not render exports if noExport is true", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query testQuery {
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
      query testQuery {
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
      query testQuery {
        testType {
          string
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, { nameSuffix: "" })
  expect(output.content.trim()).toEqual(
    "export const testQuery = { data: { testType: { string: 'Hello World' } } };"
  )
})

it("handles aliasing field names", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query testQuery {
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
      "export const unnamed_1_Mock = { data: { testType: { id: 'e509e6ea-9fee-442a-9962-587ce7190430' } } };",
      "export const unnamed_2_Mock = { data: { testType: { string: 'Hello World' } } };",
    ].join("\n\n")
  )
})

it("handles nested fields", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query TestQuery {
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
      query TestQuery {
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
      query TestQuery {
        testType {
          custom
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {
    customValues: { Custom: "test value" },
  })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { custom: 'test value' } } };"
  )
})

it("allows defining number values for custom scalars using the scalarValues config", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query TestQuery {
        testType {
          custom
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {
    customValues: { Custom: 1234 },
  })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { custom: 1234 } } };"
  )
})

it("allows defining boolean values for custom scalars using the scalarValues config", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query TestQuery {
        testType {
          custom
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {
    customValues: { Custom: true },
  })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { custom: true } } };"
  )
})

it("allows built in scalar values to be overwritten with scalarValues config", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query TestQuery {
        testType {
          int
        }
      }
    `,
  ])
  const output = await plugin(schema, documents, {
    customValues: { Int: 978654 },
  })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { int: 978654 } } };"
  )
})

it("handles enum types", async () => {
  const documents = buildDocuments([
    /* GraphQL */ `
      query TestQuery {
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
      query TestQuery {
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
      query TestQuery {
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
