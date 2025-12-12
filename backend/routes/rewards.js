const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get all reward programs (for users to see available programs)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rewards = await pool.query('SELECT DISTINCT rewards_id, award_points FROM rewards_program ORDER BY rewards_id');
    res.json(rewards.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's current reward program
router.get('/my-reward', authenticateToken, async (req, res) => {
  try {
    // Check if user has joined a reward via renter_joins_reward
    const joined = await pool.query(
      `SELECT rp.rewards_id, rp.award_points 
       FROM renter_joins_reward rjr
       JOIN rewards_program rp ON rjr.reward_id = rp.rewards_id
       WHERE rjr.user_id = $1`,
      [req.user.userId]
    );
    
    if (joined.rows.length > 0) {
      return res.json(joined.rows[0]);
    }

    // Or check if user has their own rewards_program entry
    const own = await pool.query(
      'SELECT rewards_id, award_points FROM rewards_program WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (own.rows.length === 0) {
      return res.status(404).json({ error: 'No reward program found' });
    }
    
    res.json(own.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's points (earned and used)
router.get('/my-points', authenticateToken, async (req, res) => {
  try {
    // Get user's reward program
    let rewardId = null;
    let awardPoints = 0;

    // Check renter_joins_reward first
    const joined = await pool.query(
      `SELECT rjr.reward_id, rp.award_points 
       FROM renter_joins_reward rjr
       JOIN rewards_program rp ON rjr.reward_id = rp.rewards_id
       WHERE rjr.user_id = $1`,
      [req.user.userId]
    );

    if (joined.rows.length > 0) {
      rewardId = joined.rows[0].reward_id;
      awardPoints = joined.rows[0].award_points;
    } else {
      // Check own rewards_program
      const own = await pool.query(
        'SELECT rewards_id, award_points FROM rewards_program WHERE user_id = $1',
        [req.user.userId]
      );
      if (own.rows.length > 0) {
        rewardId = own.rows[0].rewards_id;
        awardPoints = own.rows[0].award_points;
      }
    }

    if (!rewardId) {
      return res.json({ earned: 0, used: 0 });
    }

    // Count bookings to calculate earned points
    const bookings = await pool.query(
      'SELECT COUNT(*) as count FROM booking WHERE user_id = $1',
      [req.user.userId]
    );
    const earned = parseInt(bookings.rows[0].count) * awardPoints;

    // Get used points from rewards_use_points
    const used = await pool.query(
      `SELECT COUNT(*) as count FROM rewards_use_points WHERE reward_id = $1`,
      [rewardId]
    );
    // Each redemption uses some points (let's say each record = 1 redemption of pointsPerDollar)
    const usedCount = parseInt(used.rows[0].count) * 10;

    res.json({ 
      earned: earned || 0,
      used: usedCount || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join a reward program
router.post('/join', authenticateToken, async (req, res) => {
  const { reward_id } = req.body;
  
  if (req.user.role !== 'Renter') {
    return res.status(403).json({ error: 'Only renters can join reward programs' });
  }

  if (!reward_id) {
    return res.status(400).json({ error: 'Reward program ID is required' });
  }
  
  try {
    // Verify the reward program exists
    const program = await pool.query(
      'SELECT rewards_id FROM rewards_program WHERE rewards_id = $1',
      [reward_id]
    );
    
    if (program.rows.length === 0) {
      return res.status(404).json({ error: 'Reward program not found' });
    }

    // Check if already in a program
    const existing = await pool.query(
      'SELECT * FROM renter_joins_reward WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in a reward program' });
    }
    
    // Join the program
    await pool.query(
      'INSERT INTO renter_joins_reward (user_id, reward_id) VALUES ($1, $2)',
      [req.user.userId, reward_id]
    );
    
    res.status(201).json({ message: 'Successfully joined reward program' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Redeem points (requires property_id)
router.post('/redeem', authenticateToken, async (req, res) => {
  const { points, property_id } = req.body;
  
  if (req.user.role !== 'Renter') {
    return res.status(403).json({ error: 'Only renters can redeem points' });
  }

  if (!property_id) {
    return res.status(400).json({ error: 'Property ID is required for redemption' });
  }
  
  try {
    // Get user's reward_id
    const userReward = await pool.query(
      'SELECT reward_id FROM renter_joins_reward WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (userReward.rows.length === 0) {
      return res.status(400).json({ error: 'Not enrolled in a reward program' });
    }
    
    const rewardId = userReward.rows[0].reward_id;
    
    // Record the redemption
    await pool.query(
      'INSERT INTO rewards_use_points (reward_id, property_id) VALUES ($1, $2)',
      [rewardId, property_id]
    );
    
    res.json({ 
      message: 'Points redeemed successfully',
      discount: points / 10 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave reward program
router.delete('/leave', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM renter_joins_reward WHERE user_id = $1',
      [req.user.userId]
    );
    
    res.json({ message: 'Left reward program' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;