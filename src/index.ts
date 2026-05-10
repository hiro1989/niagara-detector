import YahooFinance from "yahoo-finance2"

import { fetchStockPrice } from "#stock-price.js"

const symbols = ["AAPL"]
const prices = await fetchStockPrice(new YahooFinance({ suppressNotices: ["yahooSurvey"] }))(
  symbols,
)
for (const symbol of symbols) {
  console.log(`${symbol}: ${prices[symbol]}`)
}
