import fs from 'fs'

export function loadTemplate(filePath: string): (vars: Record<string, string>) => string {
  const content = fs.readFileSync(filePath, 'utf-8')

  return (vars: Record<string, string>): string => {
    return content.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
  }
}
