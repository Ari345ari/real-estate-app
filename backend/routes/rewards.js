const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const rewards = await pool.query('SELECT * FROM Rewards_prog');
    res.json(rewards.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/join', authenticateToken, async (req, res) => {
  const { reward_id } = req.body;
  try {
    await pool.query(`INSERT INTO Renter_joins_reward (User_ID, Reward_ID) VALUES ($1, $2)`, [req.user.userId, reward_id]);
    res.status(201).json({ message: 'Joined reward program' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;