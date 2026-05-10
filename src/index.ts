import YahooFinance from "yahoo-finance2"

import { fetchStockPrice } from "#stock-price.js"

const symbol = "AAPL"
const price = await fetchStockPrice(new YahooFinance({ suppressNotices: ["yahooSurvey"] }))(symbol)
console.log(`${symbol}: ${price}`)
