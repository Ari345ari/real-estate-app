const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await pool.query('SELECT * FROM "User" WHERE user_id = $1', [req.user.userId]);
    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/address', authenticateToken, async (req, res) => {
  const { street, city, zip } = req.body;
  try {
    const addr = await pool.query(
      'INSERT INTO "Address" (User_ID, Street, City, ZIP) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.userId, street, city, zip]
    );
    res.status(201).json(addr.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/addresses', authenticateToken, async (req, res) => {
  try {
    const addrs = await pool.query('SELECT * FROM "Address" WHERE User_ID = $1', [req.user.userId]);
    res.json(addrs.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/address/:id', authenticateToken, async (req, res) => {
  try {
    const cardsUsingAddress = await pool.query(
      'SELECT * FROM "Card" WHERE Billing_Address_ID = $1 AND User_ID = $2',
      [req.params.id, req.user.userId]
    );
    
    if (cardsUsingAddress.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete address - it is used by cards' });
    }
    
    await pool.query('DELETE FROM "Address" WHERE Address_ID = $1 AND User_ID = $2', [req.params.id, req.user.userId]);
    res.json({ message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/card', authenticateToken, async (req, res) => {
  const { card_number, expiry_month, expiry_year, cvv, billing_address_id } = req.body;
  try {
    const card = await pool.query(
      'INSERT INTO "Card" (User_ID, Card_Number, Expiry_Month, Expiry_Year, CVV, Billing_Address_ID) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.userId, card_number, expiry_month, expiry_year, cvv, billing_address_id]
    );
    res.status(201).json(card.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cards', authenticateToken, async (req, res) => {
  try {
    const cards = await pool.query('SELECT * FROM "Card" WHERE User_ID = $1', [req.user.userId]);
    res.json(cards.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/card/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM "Card" WHERE Card_ID = $1 AND User_ID = $2', [req.params.id, req.user.userId]);
    res.json({ message: 'Card deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;