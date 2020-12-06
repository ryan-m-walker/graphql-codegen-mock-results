# GraphQL Codegen Mocks

## A Graphql Codegen plugin for mocking operation results

This plugin generates mock results for operations based on all of your GraphQL documents.

### Example Usage

```yml
schema: path/to/schema.graphql
documents: "./src/**/*.graphql"
generates:
  path/to/file.js:
    plugins:
      - graphql-codegen-mock-results
```

_Note_: This plugin can be used for both JavaScript file outputs as well as TypeScript file outputs, although if you use a TypeScript file as your file output you will also have to ensure that the plugins `@graphql-codegen/typescript` and `@graphql-codegen/typescript-operations` are installed and configured as well.

### Installation

#### npm:

```shell
npm install -D graphql-codegen-mock-results
```

#### Yarn:

```shell
yarn add -D graphql-codegen-mock-results
```

### Usage Example

#### JavaScript Example

```yml
schema: path/to/schema.graphql
documents: "./src/**/*.graphql"
generates:
  path/to/file.js:
    plugins:
      - graphql-codegen-mock-results
```

```GraphQL
query user($id: ID!) {
  user(id: $id) {
    id
    name
    age
  }
}
```

The example will generate the following:

```JavaScript
const userQueryMock = {
  data: {
    user: {
      id: '9e6ea9fe-e42a-4996-a587-ce71904308da',
      name: 'Hello World',
      age: 84
    }
  }
};
```

#### TypeScript Example

```yml
schema: path/to/schema.graphql
documents: "./src/**/*.graphql"
generates:
  path/to/file.ts:
    plugins:
      - typescript
      - typescript-operations
      - graphql-codegen-mock-results
```

The example will generate the following:

```TypeScript
import { ExecutionResult } from 'graphql';

// ... other codegen generated types ...

const userQueryMock: ExecutionResult<UserQuery> = {
  data: {
    user: {
      id: '9e6ea9fe-e42a-4996-a587-ce71904308da',
      name: 'Hello World',
      age: 84
    }
  }
};
```

### Configuration Options

#### `addTypename`

type: `boolean` default: `false`

If set to true `__typename` will be added to all types that are not already querying for it.

##### Usage Example

```yml
schema: path/to/schema.graphql
documents: "./src/**/*.graphql"
generates:
  path/to/file.js:
    plugins:
      - graphql-codegen-mock-results
          addTypename: true
```

Generates:

```JavaScript
const userQueryMock = {
  data: {
    __typename: 'Query',
    user: {
      __typename: 'User',
      id: '9e6ea9fe-e42a-4996-a587-ce71904308da',
      name: 'Hello World',
      age: 84
    }
  }
};
```

#### `customScalarValues`

type: `{ [key: string]: JsonValue }`

Allows for defining the mock result type of scalar values. If one is not provided for built in scalars a mocked value will be provided. If a custom value is not provided for a custom scalar the name of the scalar will be used.

##### Usage Example

```yml
schema: path/to/schema.graphql
documents: "./src/**/*.graphql"
generates:
  path/to/file.js:
    plugins:
      - graphql-codegen-mock-results
          customScalarValues:
            HTML: <p>Hello World</p>
```

#### `mockPrefix`

type: `string`, default `''`

Changes the mocks variable name prefix.

#### `mockSuffix`

type: `string`, default `'<operation-type>Mock'`

Changes the mocks variable suffix.
