import { vi } from "vitest"

const quoteMock = vi.hoisted(() =>
  vi.fn<(symbol: string) => Promise<{ regularMarketPrice?: number }>>(),
)

vi.mock("yahoo-finance2", () => ({
  default: function YahooFinance() {
    return { quote: quoteMock }
  },
}))

const { fetchStockPrice } = await import("#stock-price.js")

describe(fetchStockPrice, () => {
  beforeEach(() => {
    quoteMock.mockReset()
  })

  it("returns regularMarketPrice from yahoo-finance2 quote", async () => {
    // Arrange
    quoteMock.mockResolvedValue({ regularMarketPrice: 150.25 })

    // Act
    const result = await fetchStockPrice("AAPL")

    // Assert
    expect(quoteMock).toHaveBeenCalledWith("AAPL")
    expect(result).toBe(150.25)
  })

  it("throws when regularMarketPrice is missing", async () => {
    // Arrange
    quoteMock.mockResolvedValue({})

    // Act & Assert
    await expect(fetchStockPrice("UNKNOWN")).rejects.toThrow("No regularMarketPrice for UNKNOWN")
  })
})
