export function isTypeScript(outputFile: string): boolean {
  if (!outputFile) {
    return false
  }
  return !!outputFile.match(/.(ts|tsx)$/)
}

export function toPascalCase(input: string): string {
  return input[0].toLowerCase() + input.slice(1)
}

export function capitalize(input: string): string {
  return input[0].toUpperCase() + input.slice(1)
}
