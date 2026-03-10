const axios = require('axios');

const stocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
const BASE_URL = 'https://finnhub.io/api/v1';

async function fetchStockPrice(symbol) {
  const res = await axios.get(`${BASE_URL}/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`);
  return { symbol, ...res.data };
}

async function startStockStream(io) {
  console.log('📈 Real-time stock stream started...');

  setInterval(async () => {
    for (const symbol of stocks) {
      try {
        const data = await fetchStockPrice(symbol);
        const update = {
          symbol,
          price: data.c,
          open: data.o,
          high: data.h,
          low: data.l,
          change: data.d,
          percentChange: data.dp,
          timestamp: new Date().toLocaleTimeString()
        };

        if (Math.abs(data.dp) > 2) {
          io.emit('priceAlert', {
            symbol,
            message: `⚠️ ${symbol} moved ${data.dp}% — unusual activity detected!`
          });
        }

        io.emit('priceUpdate', update);
        console.log(`✅ ${symbol}: $${data.c} (${data.dp}%)`);

      } catch (error) {
        console.log(`❌ Error fetching ${symbol}:`, error.message);
      }
    }
  }, 30000);
}

module.exports = { startStockStream };