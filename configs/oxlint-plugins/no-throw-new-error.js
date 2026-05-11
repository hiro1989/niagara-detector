const rule = {
  create(context) {
    return {
      ThrowStatement(node) {
        const argument = node.argument
        if (
          argument?.type === "NewExpression" &&
          argument.callee.type === "Identifier" &&
          argument.callee.name === "Error"
        ) {
          context.report({
            message:
              "Do not throw `new Error(...)` directly. Use a Result type or a domain-specific error class instead.",
            node: argument,
          })
        }
      },
    }
  },
}

const plugin = {
  meta: { name: "local" },
  rules: { "no-throw-new-error": rule },
}

// oxlint-disable-next-line import/no-default-export -- oxlint JS plugin API requires default export
export default plugin
