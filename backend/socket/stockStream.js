const axios = require('axios');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);
const stocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
const BASE_URL = 'https://finnhub.io/api/v1';

async function fetchStockPrice(symbol) {
  // Check Redis cache first
  const cached = await redis.get(`quote:${symbol}`);
  if (cached) {
    console.log(`📦 Stream cache hit for ${symbol}`);
    return JSON.parse(cached);
  }

  const res = await axios.get(`${BASE_URL}/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`);
  const data = { symbol, ...res.data };

  // Cache for 30 seconds
  await redis.setex(`quote:${symbol}`, 30, JSON.stringify(data));
  return data;
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