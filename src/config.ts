export type MocksPluginConfig = {
  customScalarValues?: { [key: string]: any }
  noExport?: boolean
  namePrefix?: string
  nameSuffix?: string
  namingConvention?: string
  addTypename?: boolean
  immutableResults?: boolean
}
