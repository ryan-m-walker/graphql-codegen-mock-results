import { JsonValue } from "type-fest"

export type MocksPluginConfig = {
  customScalarValues?: { [key: string]: JsonValue }
  noExport?: boolean
  namePrefix?: string
  nameSuffix?: string
  namingConvention?: string
  addTypename?: boolean
  immutableResults?: boolean
}
