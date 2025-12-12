const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.post('/create', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Renter') {
    return res.status(403).json({ error: 'Only renters can book' });
  }

  const { property_id, rental_start, rental_end, card_id, use_points, points_to_use } = req.body;

  // Card is required
  if (!card_id) {
    return res.status(400).json({ error: 'Payment card is required for booking' });
  }

  try {
    const prop = await pool.query('SELECT price FROM property WHERE property_id = $1 AND available = true', [property_id]);
    if (prop.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found or not available' });
    }

    const days = Math.ceil((new Date(rental_end) - new Date(rental_start)) / (1000 * 60 * 60 * 24));
    if (days <= 0) {
      return res.status(400).json({ error: 'Invalid rental period' });
    }
    let total = prop.rows[0].price * (days / 30);

    // Verify card belongs to user
    const card = await pool.query(
      'SELECT * FROM "Card" WHERE card_id = $1 AND user_id = $2',
      [card_id, req.user.userId]
    );
    if (card.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid payment card' });
    }

    // Get user's reward_id from renter_joins_reward
    const reward = await pool.query(
      'SELECT reward_id FROM renter_joins_reward WHERE user_id = $1 LIMIT 1',
      [req.user.userId]
    );
    const rewardId = reward.rows.length > 0 ? reward.rows[0].reward_id : null;

    // Handle points redemption
    if (use_points && points_to_use > 0 && rewardId) {
      const discount = points_to_use / 10; // 10 points = $1
      total = Math.max(0, total - discount);

      // Record points usage in rewards_use_points
      await pool.query(
        'INSERT INTO rewards_use_points (reward_id, property_id) VALUES ($1, $2)',
        [rewardId, property_id]
      );
    }

    const booking = await pool.query(
      'INSERT INTO booking (rental_start, rental_end, total, user_id, property_id, reward_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [rental_start, rental_end, total, req.user.userId, property_id, rewardId]
    );

    // Link card to booking
    await pool.query(
      'INSERT INTO booking_use_card (booking_id, card_id) VALUES ($1, $2)',
      [booking.rows[0].booking_id, card_id]
    );

    res.status(201).json(booking.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await pool.query(
      `SELECT b.*, p.description, p.type, p.price, p.city, p.state, c.card_number
       FROM booking b 
       JOIN property p ON b.property_id = p.property_id 
       LEFT JOIN booking_use_card buc ON b.booking_id = buc.booking_id
       LEFT JOIN "Card" c ON buc.card_id = c.card_id
       WHERE b.user_id = $1 
       ORDER BY b.rental_start DESC`,
      [req.user.userId]
    );
    res.json(bookings.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/agent-bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await pool.query(
      `SELECT b.*, p.description, p.type, p.price, p.city, p.state,
              u.name as renter_name, u.email as renter_email, u.phone as renter_phone,
              c.card_number
       FROM booking b 
       JOIN property p ON b.property_id = p.property_id 
       JOIN agent_manages_property amp ON p.property_id = amp.property_id
       JOIN "User" u ON b.user_id = u.user_id
       LEFT JOIN booking_use_card buc ON b.booking_id = buc.booking_id
       LEFT JOIN "Card" c ON buc.card_id = c.card_id
       WHERE amp.user_id = $1 
       ORDER BY b.rental_start DESC`,
      [req.user.userId]
    );
    res.json(bookings.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Get booking with card info for refund
    const booking = await pool.query(
      `SELECT b.*, buc.card_id, c.card_number
       FROM booking b 
       LEFT JOIN booking_use_card buc ON b.booking_id = buc.booking_id 
       LEFT JOIN "Card" c ON buc.card_id = c.card_id
       WHERE b.booking_id = $1`,
      [req.params.id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const bookingData = booking.rows[0];

    if (bookingData.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    // Check if user is the renter or an agent managing the property
    const isRenter = bookingData.user_id === req.user.userId;
    
    let isAgent = false;
    if (!isRenter) {
      const agentCheck = await pool.query(
        `SELECT * FROM agent_manages_property amp
         WHERE amp.property_id = $1 AND amp.user_id = $2`,
        [bookingData.property_id, req.user.userId]
      );
      isAgent = agentCheck.rows.length > 0;
    }

    if (!isRenter && !isAgent) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    // Check if points were used for this booking
    let pointsRefunded = false;
    if (bookingData.reward_id) {
      const pointsUsed = await pool.query(
        'SELECT * FROM rewards_use_points WHERE reward_id = $1 AND property_id = $2',
        [bookingData.reward_id, bookingData.property_id]
      );
      
      if (pointsUsed.rows.length > 0) {
        // Points were used - delete the entry to refund points back to user
        await pool.query(
          'DELETE FROM rewards_use_points WHERE reward_id = $1 AND property_id = $2',
          [bookingData.reward_id, bookingData.property_id]
        );
        pointsRefunded = true;
      }
    }

    // Mark booking as cancelled (don't delete - keeps earned points)
    await pool.query(
      'UPDATE booking SET status = $1 WHERE booking_id = $2',
      ['cancelled', req.params.id]
    );

    // Build refund message
    let refundMessage = 'Booking cancelled.';
    if (pointsRefunded) {
      refundMessage = 'Booking cancelled. Points have been refunded to your account.';
    } else if (bookingData.card_number) {
      refundMessage = `Booking cancelled. Refund processed to card ending in ${bookingData.card_number.slice(-4)}.`;
    }

    res.json({ message: refundMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;