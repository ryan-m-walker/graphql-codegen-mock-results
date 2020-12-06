export function isTypeScript(outputFile: string): boolean {
  if (!outputFile) {
    return false
  }
  return !!outputFile.match(/.(ts|tsx)$/)
}
