import { ExecutionResult } from 'graphql'
import gql from 'graphql-tag';
type Maybe<T> = T | null;
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** All built-in and custom scalars, mapped to their actual values */
type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

type Person = {
  __typename?: 'Person';
  id: Scalars['ID'];
  name: Scalars['String'];
  email?: Maybe<Scalars['String']>;
  age?: Maybe<Scalars['Int']>;
};

type Query = {
  __typename?: 'Query';
  person?: Maybe<Person>;
  persons: Array<Person>;
};


type QueryPersonArgs = {
  id: Scalars['ID'];
};

type GetMyDataQueryVariables = Exact<{ [key: string]: never; }>;


type GetMyDataQuery = (
  { __typename?: 'Query' }
  & { persons: Array<(
    { __typename?: 'Person' }
    & Pick<Person, 'id'>
  )> }
);


 const GetMyData = gql`
    query GetMyData {
  persons {
    id
  }
}
    `;
 const getMyDataMock: ExecutionResult<GetMyDataQuery> = { data: { persons: [{ id: 'e509e6ea-9fee-442a-9962-587ce7190430' }] } };