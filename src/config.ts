import { NamingConvention } from "@graphql-codegen/visitor-plugin-common"
import { JsonValue } from "type-fest"

export type MocksPluginConfig = {
  addTypename?: boolean
  customScalarValues?: { [key: string]: JsonValue }
  mockNamingConvention?: NamingConvention
  enumValuesConvention?: NamingConvention
  typenamesConvention?: NamingConvention
  enumValues?: string
  mockPrefix?: string
  mockSuffix?: string
  namingConvention?: NamingConvention
  typesPrefix?: string
  typesSuffix?: string
}

export const defaultConfig: MocksPluginConfig = {
  addTypename: false,
  mockNamingConvention: "camel-case#camelCase",
  enumValuesConvention: "pascal-case#pascalCase",
  typenamesConvention: "pascal-case#pascalCase",
  mockPrefix: "",
  mockSuffix: "",
  typesPrefix: "",
  typesSuffix: "",
}
