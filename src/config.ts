import { NamingConvention } from "@graphql-codegen/visitor-plugin-common"
import { JsonValue } from "type-fest"

export type MocksPluginConfig = {
  addTypename?: boolean
  customScalarValues?: { [key: string]: JsonValue }
  mockNamingConvention?: NamingConvention
  mockPrefix?: string
  mockSuffix?: string
  namingConvention?: NamingConvention
  typesPrefix?: string
  typesSuffix?: string
}

export const defaultConfig: MocksPluginConfig = {
  addTypename: false,
  mockNamingConvention: "camel-case#camelCase",
  mockPrefix: "",
  mockSuffix: "",
  typesPrefix: "",
  typesSuffix: "",
}
