import { vi } from "vitest"
import type YahooFinance from "yahoo-finance2"

import { fetchStockPrice } from "#stock-price.js"

const quoteMock = vi.fn<(symbol: string) => Promise<{ regularMarketPrice?: number }>>()

// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const client = {
  quote: quoteMock,
} as unknown as InstanceType<typeof YahooFinance>

describe(fetchStockPrice, () => {
  beforeEach(() => {
    quoteMock.mockReset()
  })

  it("returns regularMarketPrice from yahoo-finance2 quote", async () => {
    // Arrange
    quoteMock.mockResolvedValue({ regularMarketPrice: 150.25 })

    // Act
    const result = await fetchStockPrice(client)("AAPL")

    // Assert
    expect(quoteMock).toHaveBeenCalledWith("AAPL")
    expect(result).toBe(150.25)
  })

  it("throws when regularMarketPrice is missing", async () => {
    // Arrange
    quoteMock.mockResolvedValue({})

    // Act & Assert
    await expect(fetchStockPrice(client)("UNKNOWN")).rejects.toThrow(
      "No regularMarketPrice for UNKNOWN",
    )
  })
})
