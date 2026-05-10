import type YahooFinance from "yahoo-finance2"

export const fetchStockPrice =
  (client: InstanceType<typeof YahooFinance>) =>
  async (symbols: string[]): Promise<Record<string, number>> => {
    const entries = await Promise.all(
      symbols.map(async (symbol) => {
        const result = await client.quoteCombine(symbol)
        if (result.regularMarketPrice == null) {
          throw new Error(`No regularMarketPrice for ${symbol}`)
        }
        return [symbol, result.regularMarketPrice] as const
      }),
    )
    return Object.fromEntries(entries)
  }
