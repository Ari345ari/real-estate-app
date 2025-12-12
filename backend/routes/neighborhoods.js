const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all neighborhoods
router.get('/', async (req, res) => {
  try {
    const neighborhoods = await pool.query(`
      SELECT n.*, 
        ROUND(AVG(p.price)::numeric, 2) as avg_price,
        COUNT(p.property_id) as property_count
      FROM neighborhood n
      LEFT JOIN property p ON n.neighborhood_id = p.neighborhood_id AND p.available = true
      GROUP BY n.neighborhood_id
      ORDER BY n.location
    `);
    res.json(neighborhoods.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single neighborhood with properties
router.get('/:id', async (req, res) => {
  try {
    const neighborhood = await pool.query(
      'SELECT * FROM neighborhood WHERE neighborhood_id = $1',
      [req.params.id]
    );
    
    if (neighborhood.rows.length === 0) {
      return res.status(404).json({ error: 'Neighborhood not found' });
    }

    const properties = await pool.query(`
      SELECT p.*, p.image_url,
        COALESCE(h.number_of_rooms, a.number_of_rooms, v.number_of_rooms, 0) as number_of_rooms,
        COALESCE(h.sqft, a.sqft, c.sqft, v.sqft, l.area, 0) as sqft
      FROM property p
      LEFT JOIN house h ON p.property_id = h.property_id
      LEFT JOIN apartment a ON p.property_id = a.property_id
      LEFT JOIN commercial c ON p.property_id = c.property_id
      LEFT JOIN vacation v ON p.property_id = v.property_id
      LEFT JOIN land l ON p.property_id = l.property_id
      WHERE p.neighborhood_id = $1 AND p.available = true
      ORDER BY p.price ASC
    `, [req.params.id]);

    res.json({
      neighborhood: neighborhood.rows[0],
      properties: properties.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;