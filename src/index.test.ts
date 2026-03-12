import { greet } from "#index.js"

describe(greet, () => {
  it("ok", async () => {
    expect(greet()).toBe("hello")
  })
})
