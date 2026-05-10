import type { Result } from "#shared/utils/result.js"
import { err, ok } from "#shared/utils/result.js"

describe("result", () => {
  it("should create a successful result", () => {
    const result: Result<number, Error> = ok(42)

    expect.assert(result.ok)

    expect(result.value).toBe(42)
  })

  it("should create a failed result", () => {
    const result: Result<number, Error> = err(new Error("Something went wrong"))

    expect.assert(!result.ok)

    expect(result.error).toMatchInlineSnapshot(`[Error: Something went wrong]`)
  })

  it("types should be correctly inferred when isOk", () => {
    const { error, ok: isOk, value }: Result<string, Error> = ok("hi")

    expect.assert(isOk)

    expectTypeOf(value).toEqualTypeOf<string>()
    expectTypeOf(error).toEqualTypeOf<undefined>()
  })

  it("types should be correctly inferred when not isOk", () => {
    const { error, ok: isOk, value }: Result<string, Error> = err(new Error("fail"))

    expect.assert(!isOk)

    expectTypeOf(value).toEqualTypeOf<undefined>()
    expectTypeOf(error).toEqualTypeOf<Error>()
  })
})
