import { Types } from "@graphql-codegen/plugin-helpers"
import { buildSchema, parse } from "graphql"

import { MocksPluginConfig } from "../src/config"
import { plugin } from "../src/index"
import { PluginInfo } from "../src/types"

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

  input TestInput {
    stringInput: String
    booleanInput: Boolean
  }

  type Query {
    testType: TestType!
    testUnion: TestUnion!
    testInterface: TestInterface!
  }

  type Mutation {
    testMutation(
      id: ID
      string: String
      Int: Int
      Float: Float
      object: TestInput
      list: [String]
    ): TestType
  }
`)

function executePlugin(
  documentOrDocuments: string | string[],
  config: MocksPluginConfig = {},
  info: PluginInfo = {}
): Types.Promisable<Types.ComplexPluginOutput> {
  const documents = Array.isArray(documentOrDocuments)
    ? documentOrDocuments
    : [documentOrDocuments]
  const documentObjects = documents.map((document) => ({
    document: parse(document),
  }))
  return plugin(schema, documentObjects, config, info)
}

it("handles list types", async () => {
  const documents = [
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
  ]
  const output = await executePlugin(documents)
  expect(output.content.trim()).toEqual(
    [
      "export const testQueryMock = { data: { testType: { list: [{ string: 'Hello World' }, { string: 'Hello World' }, { string: 'Hello World' }] } } };",
      "export const test2QueryMock = { data: { testType: { stringList: ['Hello World', 'Hello World'] } } };",
    ].join("\n\n")
  )
})

it("handles multiple operations in one document", async () => {
  const document = [
    /* GraphQL */ `
      query test {
        testType {
          boolean
        }
      }

      query test2 {
        testType {
          string
        }
      }

      mutation test3 {
        testMutation {
          int
        }
      }
    `,
  ]
  const output = await executePlugin(document)
  expect(output.content.trim()).toEqual(
    [
      "export const testQueryMock = { data: { testType: { boolean: true } } };",
      "export const test2QueryMock = { data: { testType: { string: 'Hello World' } } };",
      "export const test3MutationMock = { data: { testMutation: { int: -28 } } };",
    ].join("\n\n")
  )
})

it("mocks built in scalar values", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        int
        float
        string
        boolean
        id
      }
    }
  `
  const output = await executePlugin(document)
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { int: 84, float: -27.84, string: 'Hello World', boolean: false, id: '9e6ea9fe-e42a-4996-a587-ce71904308da' } } };"
  )
})

it("handles __typename", async () => {
  const document = /* GraphQL */ `
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
  `
  const output = await executePlugin(document)
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { __typename: 'TestType', testType: { __typename: 'TestType' }, list: [{ __typename: 'TestType' }, { __typename: 'TestType' }, { __typename: 'TestType' }] } } };"
  )
})

it("adds name prefix if one is passed in config", async () => {
  const documents = /* GraphQL */ `
    query test {
      testType {
        string
      }
    }
  `
  const output = await executePlugin(documents, { mockPrefix: "my" })
  expect(output.content.trim()).toEqual(
    "export const mytestQueryMock = { data: { testType: { string: 'Hello World' } } };"
  )
})

it("allows a custom name suffix if one is passed in config", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        string
      }
    }
  `
  const output = await executePlugin(document, { mockSuffix: "$$" })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock$$ = { data: { testType: { string: 'Hello World' } } };"
  )
})

it("handles aliasing field names", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        testAlias: int
      }
    }
  `
  const output = await executePlugin(document)
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { testAlias: 84 } } };"
  )
})

it("gives a place holder name for unnamed operations", async () => {
  const documents = [
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
  ]
  const output = await executePlugin(documents, {})
  expect(output.content.trim()).toEqual(
    [
      "export const unnamed_1_queryMock = { data: { testType: { id: 'e509e6ea-9fee-442a-9962-587ce7190430' } } };",
      "export const unnamed_2_queryMock = { data: { testType: { string: 'Hello World' } } };",
    ].join("\n\n")
  )
})

it("handles nested fields", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        testType {
          int
        }
      }
    }
  `
  const output = await executePlugin(document)
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { testType: { int: 84 } } } };"
  )
})

it("uses type name as value for custom scalars", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        custom
      }
    }
  `
  const output = await executePlugin(document)
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { custom: 'Custom' } } };"
  )
})

it("allows defining string values for custom scalars using the scalarValues config", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        custom
      }
    }
  `
  const output = await executePlugin(document, {
    customScalarValues: { Custom: "test value" },
  })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { custom: 'test value' } } };"
  )
})

it("allows defining number values for custom scalars using the scalarValues config", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        custom
      }
    }
  `
  const output = await executePlugin(document, {
    customScalarValues: { Custom: 1234 },
  })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { custom: 1234 } } };"
  )
})

it("allows defining boolean values for custom scalars using the scalarValues config", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        custom
      }
    }
  `
  const output = await executePlugin(document, {
    customScalarValues: { Custom: true },
  })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { custom: true } } };"
  )
})

it("allows built in scalar values to be overwritten with scalarValues config", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        int
      }
    }
  `
  const output = await executePlugin(document, {
    customScalarValues: { Int: 978654 },
  })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { int: 978654 } } };"
  )
})

it("handles enum types as type-value", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        enum
      }
    }
  `
  const output = await executePlugin(document, { enumValues: "type-value" })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { enum: TestEnum.Option1 } } };"
  )
})

it("handles enum types as value", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        enum
      }
    }
  `
  const output = await executePlugin(document)
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { enum: 'Option1' } } };"
  )
})

it("handles unions", async () => {
  const document = /* GraphQL */ `
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
  `
  const output = await executePlugin(document)
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testUnion: { __typename: 'TestSubType1', int: 84, float: -27.84 } } };"
  )
})

it("handles interfaces", async () => {
  const document = /* GraphQL */ `
    query test {
      testInterface {
        __typename
        ... on TestInterfaceType1 {
          id
          name
        }
      }
    }
  `
  const output = await executePlugin(document)
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testInterface: { __typename: 'TestInterfaceType1', id: 'e509e6ea-9fee-442a-9962-587ce7190430', name: 'Hello World' } } };"
  )
})

it("handles fragments", async () => {
  const document = /* GraphQL */ `
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
  `
  const output = await executePlugin(document)
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { string: 'Hello World', int: 84, boolean: false } } };"
  )
})

it("handles multiple fragments", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        string
        ...testFragment1
        ...testFragment2
      }
    }

    fragment testFragment1 on TestType {
      string
      int
      boolean
    }

    fragment testFragment2 on TestType {
      int
      boolean
      float
    }
  `
  const output = await executePlugin(document)
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { string: 'Hello World', int: 84, boolean: false, float: -95.27 } } };"
  )
})

it("handles nested fragments", async () => {
  const document = /* GraphQL */ `
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
  `
  const output = await executePlugin(document)
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { string: 'Hello World', int: 84, boolean: false } } };"
  )
})

it("does not prepend ExecutionResult import if output is not a .ts or .tsx file", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        string
      }
    }
  `
  const output = await executePlugin(document, {}, { outputFile: "test.js" })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { string: 'Hello World' } } };"
  )
  expect(output.prepend[0]).toBeUndefined()
})

it("adds TypeScript specific code if output file is a .ts file", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        string
      }
    }
  `
  const output = await executePlugin(document, {}, { outputFile: "test.ts" })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock: ExecutionResult<TestQuery> = { data: { testType: { string: 'Hello World' } } };"
  )
  expect(output.prepend[0]).toEqual(
    "import { ExecutionResult } from 'graphql';"
  )
})

it("adds TypeScript specific code if output file is a .tsx file", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        string
      }
    }
  `
  const output = await executePlugin(document, {}, { outputFile: "test.tsx" })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock: ExecutionResult<TestQuery> = { data: { testType: { string: 'Hello World' } } };"
  )
  expect(output.prepend[0]).toEqual(
    "import { ExecutionResult } from 'graphql';"
  )
})

it("handles mutations", async () => {
  const document = /* GraphQL */ `
    mutation test {
      testMutation {
        string
      }
    }
  `
  const output = await executePlugin(document)
  expect(output.content.trim()).toEqual(
    "export const testMutationMock = { data: { testMutation: { string: 'Hello World' } } };"
  )
})

it("handles render mutations in TypeScript correctly", async () => {
  const document = /* GraphQL */ `
    mutation test {
      testMutation {
        string
      }
    }
  `
  const output = await executePlugin(document, {}, { outputFile: "test.tsx" })
  expect(output.content.trim()).toEqual(
    "export const testMutationMock: ExecutionResult<TestMutation> = { data: { testMutation: { string: 'Hello World' } } };"
  )
})

it("adds typenames if addTypename is set in config", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        string
      }
    }
  `
  const output = await executePlugin(document, { addTypename: true })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { __typename: 'Query', testType: { __typename: 'TestType', string: 'Hello World' } } };"
  )
})

it("does not add extra __typename to object that is already querying for it", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        string
        __typename
      }
    }
  `
  const output = await executePlugin(document, { addTypename: true })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { __typename: 'Query', testType: { string: 'Hello World', __typename: 'TestType' } } };"
  )
})

it("renders custom scalar null values correctly", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        custom
      }
    }
  `
  const output = await executePlugin(document, {
    customScalarValues: { Custom: null },
  })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { custom: null } } };"
  )
})

it("renders custom scalar object values correctly", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        custom
      }
    }
  `
  const output = await executePlugin(document, {
    customScalarValues: {
      Custom: { string: "Hello World", number: 123, bool: false },
    },
  })
  expect(output.content.trim()).toEqual(
    'export const testQueryMock = { data: { testType: { custom: {"string":"Hello World","number":123,"bool":false} } } };'
  )
})

it("renders custom scalar array values correctly", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        custom
      }
    }
  `
  const output = await executePlugin(document, {
    customScalarValues: {
      Custom: [1, 2, 3],
    },
  })
  expect(output.content.trim()).toEqual(
    "export const testQueryMock = { data: { testType: { custom: [1,2,3] } } };"
  )
})

it("matches name convention to `typescript-operations`", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        string
      }
    }
  `
  const output = await executePlugin(
    document,
    {},
    {
      outputFile: "test.ts",
      allPlugins: [
        {
          "typescript-operations": {
            namingConvention: "lower-case#lowerCase",
          },
        },
      ],
    }
  )
  expect(output.content.trim()).toEqual(
    "export const testQueryMock: ExecutionResult<testquery> = { data: { testType: { string: 'Hello World' } } };"
  )
})

it("adds type prefix and suffix from `typescript-operations` config", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        string
      }
    }
  `
  const output = await executePlugin(
    document,
    {},
    {
      outputFile: "test.ts",
      allPlugins: [
        {
          "typescript-operations": {
            typesPrefix: "I",
            typesSuffix: "_",
          },
        },
      ],
    }
  )
  expect(output.content.trim()).toEqual(
    "export const testQueryMock: ExecutionResult<ITestQuery_> = { data: { testType: { string: 'Hello World' } } };"
  )
})

it("inherits type prefix and suffix from config", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        string
      }
    }
  `
  const output = await executePlugin(
    document,
    {
      typesPrefix: "I",
      typesSuffix: "_",
    },
    {
      outputFile: "test.ts",
    }
  )
  expect(output.content.trim()).toEqual(
    "export const testQueryMock: ExecutionResult<ITestQuery_> = { data: { testType: { string: 'Hello World' } } };"
  )
})

it("will choose `typescript-operations` prefix and suffix over main config", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        string
      }
    }
  `
  const output = await executePlugin(
    document,
    {
      typesPrefix: "I",
      typesSuffix: "_",
    },
    {
      outputFile: "test.ts",
      allPlugins: [
        {
          "typescript-operations": {
            typesPrefix: "$",
            typesSuffix: "Mock",
          },
        },
      ],
    }
  )
  expect(output.content.trim()).toEqual(
    "export const testQueryMock: ExecutionResult<$TestQueryMock> = { data: { testType: { string: 'Hello World' } } };"
  )
})

it("allows setting naming convention for mocks", async () => {
  const document = /* GraphQL */ `
    query test {
      testType {
        string
      }
    }
  `
  const output = await executePlugin(document, {
    mockNamingConvention: "constant-case#constantCase",
  })
  expect(output.content.trim()).toEqual(
    "export const TEST_QUERY_MOCK = { data: { testType: { string: 'Hello World' } } };"
  )
})
