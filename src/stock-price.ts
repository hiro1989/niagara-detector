import type YahooFinance from "yahoo-finance2"

import { err, ok } from "#shared/utils/result.js"
import type { Result } from "#shared/utils/result.js"

export const fetchStockPrice =
  (client: InstanceType<typeof YahooFinance>) =>
  async (symbols: string[]): Promise<Result<Record<string, number>, string>> => {
    const results = await Promise.all(
      symbols.map(async (symbol): Promise<Result<readonly [string, number], string>> => {
        const data = await client.quoteCombine(symbol)
        if (data.regularMarketPrice == null) {
          return err(`No regularMarketPrice for ${symbol}`)
        }
        return ok([symbol, data.regularMarketPrice] as const)
      }),
    )
    const entries: (readonly [string, number])[] = []
    for (const result of results) {
      if (!result.ok) return result
      entries.push(result.value)
    }
    return ok(Object.fromEntries(entries))
  }
