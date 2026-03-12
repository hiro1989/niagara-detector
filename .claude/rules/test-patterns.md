---
paths:
  - "**/*.test.{ts,tsx}"
---

# Test patterns

## Co-location of tests

- Place test files next to the source file they test.
- Name test files `{source-filename}.test.ts`.
- Example: `src/utils/detector.ts` → `src/utils/detector.test.ts`

## AAA Pattern (Arrange, Act, Assert)

Each test follows three phases with explicit comments:

1. **Arrange** — Set up test data, mocks, and preconditions
2. **Act** — Execute the function/method under test
3. **Assert** — Verify the result matches expectations

```typescript
it("should return expected result", () => {
  // Arrange
  const input = "test-input"

  // Act
  const result = myFunction(input)

  // Assert
  expect(result).toBe("expected-output")
})
```

For error assertions, combine Act & Assert:

```typescript
it("should throw error", () => {
  // Arrange
  const invalidInput = null

  // Act & Assert
  expect(() => myFunction(invalidInput)).toThrow("error message")
})
```
