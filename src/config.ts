import { JsonValue } from "type-fest"

export type MocksPluginConfig = {
  addTypename?: boolean
  customScalarValues?: { [key: string]: JsonValue }
  mockPrefix?: string
  mockSuffix?: string
  namingConvention?: string
}
