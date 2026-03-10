const express = require('express');
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';
const stocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];

// Helper to get quote
async function getQuote(symbol) {
  const res = await axios.get(`${BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
  return { symbol, ...res.data };
}

// Helper to get company profile
async function getProfile(symbol) {
  const res = await axios.get(`${BASE_URL}/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`);
  return res.data;
}

// @route   GET /api/stocks
router.get('/', protect, async (req, res) => {
  try {
    const quotes = await Promise.all(stocks.map(symbol => getQuote(symbol)));
    res.json(quotes);
  } catch (error) {
    console.log('❌ Stocks error:', error.message);
    res.status(500).json({ message: 'Error fetching stocks' });
  }
});

// @route   GET /api/stocks/:symbol
router.get('/:symbol', protect, async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  try {
    const [quote, profile] = await Promise.all([
      getQuote(symbol),
      getProfile(symbol)
    ]);
    res.json({
      symbol,
      price: quote.c,
      change: quote.d,
      percentChange: quote.dp,
      high: quote.h,
      low: quote.l,
      open: quote.o,
      companyName: profile.name,
      logo: profile.logo,
      industry: profile.finnhubIndustry,
      marketCap: profile.marketCapitalization
    });
  } catch (error) {
    console.log('❌ Stock detail error:', error.message);
    res.status(500).json({ message: 'Error fetching stock details' });
  }
});

// @route   POST /api/stocks/buy
router.post('/buy', protect, async (req, res) => {
  const { symbol, shares } = req.body;
  try {
    const quote = await getQuote(symbol);
    const price = quote.c;
    const user = req.user;

    // Save to portfolio
    user.portfolio.push({ symbol, shares, buyPrice: price });
    await user.save();

    // Also create a transaction record
    const Transaction = require('../models/Transaction');
    await Transaction.create({
      user: user._id,
      symbol,
      type: 'BUY',
      shares,
      price,
      total: shares * price,
      status: 'COMPLETED'
    });

    res.json({
      message: `✅ Successfully bought ${shares} shares of ${symbol} at $${price}`,
      symbol,
      shares,
      price,
      total: (shares * price).toFixed(2)
    });
  } catch (error) {
    console.log('❌ Buy error:', error.message);
    res.status(500).json({ message: 'Error buying stock' });
  }
});

module.exports = router;