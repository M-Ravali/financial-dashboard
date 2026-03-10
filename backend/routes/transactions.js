const express = require('express');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/transactions
// @desc    Get all transactions for logged in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 }) // newest first
      .limit(50);              // last 50 transactions

    res.json(transactions);

  } catch (error) {
    console.log('❌ Transactions error:', error.message);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// @route   GET /api/transactions/summary
// @desc    Get transaction summary (total invested, total sold)
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id });

    const summary = {
      totalBought: 0,
      totalSold: 0,
      totalTransactions: transactions.length,
      bySymbol: {}
    };

    transactions.forEach(t => {
      if (t.type === 'BUY') summary.totalBought += t.total;
      if (t.type === 'SELL') summary.totalSold += t.total;

      // Group by symbol
      if (!summary.bySymbol[t.symbol]) {
        summary.bySymbol[t.symbol] = { bought: 0, sold: 0, transactions: 0 };
      }
      summary.bySymbol[t.symbol].transactions++;
      if (t.type === 'BUY') summary.bySymbol[t.symbol].bought += t.total;
      if (t.type === 'SELL') summary.bySymbol[t.symbol].sold += t.total;
    });

    summary.totalBought = summary.totalBought.toFixed(2);
    summary.totalSold = summary.totalSold.toFixed(2);

    res.json(summary);

  } catch (error) {
    console.log('❌ Summary error:', error.message);
    res.status(500).json({ message: 'Error fetching summary' });
  }
});

// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Private
router.post('/', protect, async (req, res) => {
  const { symbol, type, shares, price } = req.body;

  try {
    const transaction = await Transaction.create({
      user: req.user._id,
      symbol,
      type,
      shares,
      price,
      total: shares * price
    });

    res.status(201).json(transaction);

  } catch (error) {
    console.log('❌ Create transaction error:', error.message);
    res.status(500).json({ message: 'Error creating transaction' });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Make sure user owns this transaction
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await transaction.deleteOne();
    res.json({ message: '✅ Transaction deleted' });

  } catch (error) {
    console.log('❌ Delete transaction error:', error.message);
    res.status(500).json({ message: 'Error deleting transaction' });
  }
});

module.exports = router;