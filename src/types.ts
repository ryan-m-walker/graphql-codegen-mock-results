import {
  FieldNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  GraphQLSchema,
} from "graphql"

import { MocksPluginConfig } from "./config"
import { Random } from "./random"

export type FragmentMap = { [name: string]: FragmentDefinitionNode }

export type VisitedFragmentNames = { [name: string]: boolean }

export type FieldsMap = { [name: string]: FieldNode[] }

export type ExecutionContext = {
  schema: GraphQLSchema
  fragments: FragmentMap
  operation: OperationDefinitionNode
  config: MocksPluginConfig
  random: Random
}
