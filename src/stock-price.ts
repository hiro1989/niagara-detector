import YahooFinance from "yahoo-finance2"

const client = new YahooFinance()

export const fetchStockPrice = async (symbol: string): Promise<number> => {
  const result = await client.quote(symbol)
  if (Array.isArray(result) || result.regularMarketPrice == null) {
    throw new Error(`No regularMarketPrice for ${symbol}`)
  }
  return result.regularMarketPrice
}
