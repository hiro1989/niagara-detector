import { fetchStockPrice } from "#stock-price.js"

const symbol = "AAPL"
const price = await fetchStockPrice(symbol)
console.log(`${symbol}: ${price}`)
