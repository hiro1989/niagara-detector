import YahooFinance from "yahoo-finance2"

import { fetchStockPrice } from "#stock-price.js"

const symbols = ["AAPL"]
const result = await fetchStockPrice(new YahooFinance({ suppressNotices: ["yahooSurvey"] }))(
  symbols,
)
if (result.ok) {
  for (const symbol of symbols) {
    console.log(`${symbol}: ${result.value[symbol]}`)
  }
} else {
  console.error(result.error)
  process.exitCode = 1
}
