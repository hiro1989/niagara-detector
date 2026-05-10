import { vi } from "vitest"
import type YahooFinance from "yahoo-finance2"

import { fetchStockPrice } from "#stock-price.js"

const quoteCombineMock = vi.fn<(symbol: string) => Promise<{ regularMarketPrice?: number }>>()

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const client = {
  quoteCombine: quoteCombineMock,
} as unknown as InstanceType<typeof YahooFinance>

describe(fetchStockPrice, () => {
  beforeEach(() => {
    quoteCombineMock.mockReset()
  })

  it("returns regularMarketPrice for each symbol via quoteCombine", async () => {
    // Arrange
    quoteCombineMock.mockImplementation(async (symbol) => {
      if (symbol === "AAPL") return { regularMarketPrice: 150.25 }
      if (symbol === "GOOG") return { regularMarketPrice: 2800.5 }
      return {}
    })

    // Act
    const result = await fetchStockPrice(client)(["AAPL", "GOOG"])

    // Assert
    expect(quoteCombineMock).toHaveBeenCalledWith("AAPL")
    expect(quoteCombineMock).toHaveBeenCalledWith("GOOG")
    expect(result).toEqual({ AAPL: 150.25, GOOG: 2800.5 })
  })

  it("throws when regularMarketPrice is missing", async () => {
    // Arrange
    quoteCombineMock.mockResolvedValue({})

    // Act & Assert
    await expect(fetchStockPrice(client)(["UNKNOWN"])).rejects.toThrow(
      "No regularMarketPrice for UNKNOWN",
    )
  })
})
