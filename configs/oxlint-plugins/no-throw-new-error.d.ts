type Visitor = {
  ThrowStatement: (node: { argument?: unknown }) => void
}

type Context = {
  report: (report: { message: string; node: unknown }) => void
}

type Rule = {
  create: (context: Context) => Visitor
}

type Plugin = {
  meta: { name: string }
  rules: { "no-throw-new-error": Rule }
}

declare const plugin: Plugin
// oxlint-disable-next-line import/no-default-export -- oxlint JS plugin API requires default export
export default plugin
