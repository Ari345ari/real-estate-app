const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.post('/create', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Renter') {
    return res.status(403).json({ error: 'Only renters can book' });
  }

  const { property_id, rental_start, rental_end, card_id, reward_id } = req.body;

  try {
    const prop = await pool.query('SELECT Price FROM Property WHERE Property_ID = $1', [property_id]);
    if (prop.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const days = Math.ceil((new Date(rental_end) - new Date(rental_start)) / (1000 * 60 * 60 * 24));
    const total = prop.rows[0].Price * days;

    const booking = await pool.query(
      `INSERT INTO Booking (Rental_Start, Rental_End, Total, User_ID, Property_ID, Reward_ID) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [rental_start, rental_end, total, req.user.userId, property_id, reward_id]
    );

    if (card_id) {
      await pool.query(`INSERT INTO Booking_use_card (Booking_ID, Card_ID) VALUES ($1, $2)`, [booking.rows[0].Booking_ID, card_id]);
    }

    res.status(201).json(booking.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await pool.query(
      `SELECT b.*, p.Description, p.Type, p.Price FROM Booking b JOIN Property p ON b.Property_ID = p.Property_ID WHERE b.User_ID = $1 ORDER BY b.Booking_ID DESC`,
      [req.user.userId]
    );
    res.json(bookings.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/agent-bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await pool.query(
      `SELECT b.*, p.Description, p.Property_ID, u.Name, u.Email FROM Booking b 
       JOIN Property p ON b.Property_ID = p.Property_ID 
       JOIN Agent_manages_property amp ON p.Property_ID = amp.Property_ID
       JOIN "User" u ON b.User_ID = u.User_ID
       WHERE amp.User_ID = $1 ORDER BY b.Booking_ID DESC`,
      [req.user.userId]
    );
    res.json(bookings.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM Booking WHERE Booking_ID = $1 AND User_ID = $2', [req.params.id, req.user.userId]);
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;