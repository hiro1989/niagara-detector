import plugin from "./no-throw-new-error.js"

type Report = { message: string; node: unknown }

const makeContext = (): { context: { report: (r: Report) => void }; reports: Report[] } => {
  const reports: Report[] = []
  return {
    context: {
      report: (r: Report) => {
        reports.push(r)
      },
    },
    reports,
  }
}

describe("oxlint-plugin-no-throw-new-error", () => {
  const rule = plugin.rules["no-throw-new-error"]

  it("reports `throw new Error(...)`", () => {
    // Arrange
    const { context, reports } = makeContext()
    const visitor = rule.create(context)
    const argument = {
      type: "NewExpression" as const,
      callee: { type: "Identifier" as const, name: "Error" },
    }

    // Act
    visitor.ThrowStatement({ argument })

    // Assert
    expect(reports).toHaveLength(1)
    expect(reports[0]?.message).toMatch(/Do not throw/)
    expect(reports[0]?.node).toBe(argument)
  })

  it("does not report `throw new MyError(...)`", () => {
    // Arrange
    const { context, reports } = makeContext()
    const visitor = rule.create(context)

    // Act
    visitor.ThrowStatement({
      argument: {
        type: "NewExpression",
        callee: { type: "Identifier", name: "MyError" },
      },
    })

    // Assert
    expect(reports).toHaveLength(0)
  })

  it("does not report `throw err` (Identifier)", () => {
    // Arrange
    const { context, reports } = makeContext()
    const visitor = rule.create(context)

    // Act
    visitor.ThrowStatement({
      argument: { type: "Identifier", name: "err" },
    })

    // Assert
    expect(reports).toHaveLength(0)
  })

  it("does not report `throw new pkg.Error(...)` (MemberExpression callee)", () => {
    // Arrange
    const { context, reports } = makeContext()
    const visitor = rule.create(context)

    // Act
    visitor.ThrowStatement({
      argument: {
        type: "NewExpression",
        callee: {
          type: "MemberExpression",
          object: { type: "Identifier", name: "pkg" },
          property: { type: "Identifier", name: "Error" },
        },
      },
    })

    // Assert
    expect(reports).toHaveLength(0)
  })
})
