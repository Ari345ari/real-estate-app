const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/search', async (req, res) => {
  const { city, type, bedrooms, price_min, price_max, listing_type } = req.query;
  try {
    let query = `
      SELECT p.*, p.image_url, p.listing_type,
        COALESCE(h.number_of_rooms, a.number_of_rooms, v.number_of_rooms, 0) as number_of_rooms,
        COALESCE(h.sqft, a.sqft, c.sqft, v.sqft, l.area, 0) as sqft,
        n.location as neighborhood_name, n.description as neighborhood_desc, 
        n.crime as crime_rate, n.nearby_schools
      FROM property p
      LEFT JOIN house h ON p.property_id = h.property_id
      LEFT JOIN apartment a ON p.property_id = a.property_id
      LEFT JOIN commercial c ON p.property_id = c.property_id
      LEFT JOIN vacation v ON p.property_id = v.property_id
      LEFT JOIN land l ON p.property_id = l.property_id
      LEFT JOIN neighborhood n ON p.neighborhood_id = n.neighborhood_id
      WHERE p.available = true
    `;
    const params = [];

    if (city) {
      query += ` AND p.city ILIKE $${params.length + 1}`;
      params.push(`%${city}%`);
    }
    if (type) {
      query += ` AND p.type = $${params.length + 1}`;
      params.push(type);
    }
    if (listing_type) {
      query += ` AND p.listing_type = $${params.length + 1}`;
      params.push(listing_type);
    }
    if (price_min) {
      query += ` AND p.price >= $${params.length + 1}`;
      params.push(price_min);
    }
    if (price_max) {
      query += ` AND p.price <= $${params.length + 1}`;
      params.push(price_max);
    }
    if (bedrooms) {
      query += ` AND (h.number_of_rooms >= $${params.length + 1} OR a.number_of_rooms >= $${params.length + 1} OR v.number_of_rooms >= $${params.length + 1})`;
      params.push(bedrooms);
    }

    query += ` ORDER BY p.price ASC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/agent-properties', authenticateToken, async (req, res) => {
  try {
    const props = await pool.query(
      `SELECT p.*, p.image_url, p.listing_type,
        COALESCE(h.number_of_rooms, a.number_of_rooms, v.number_of_rooms, 0) as number_of_rooms,
        COALESCE(h.sqft, a.sqft, c.sqft, v.sqft, l.area, 0) as sqft,
        c.business_type
      FROM property p
      JOIN agent_manages_property amp ON p.property_id = amp.property_id
      LEFT JOIN house h ON p.property_id = h.property_id
      LEFT JOIN apartment a ON p.property_id = a.property_id
      LEFT JOIN commercial c ON p.property_id = c.property_id
      LEFT JOIN vacation v ON p.property_id = v.property_id
      LEFT JOIN land l ON p.property_id = l.property_id
      WHERE amp.user_id = $1`,
      [req.user.userId]
    );
    res.json(props.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/create', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Agent') {
    return res.status(403).json({ error: 'Only agents can create properties' });
  }

  const { type, description, price, city, state, sqft, rooms, business_type, image_url, listing_type } = req.body;

  // Force sale for Land and Commercial
  const finalListingType = (type === 'Land' || type === 'Commercial') ? 'sale' : (listing_type || 'rent');

  try {
    const prop = await pool.query(
      'INSERT INTO property (type, description, price, available, city, state, image_url, listing_type) VALUES ($1, $2, $3, true, $4, $5, $6, $7) RETURNING *',
      [type, description, price, city, state, image_url || null, finalListingType]
    );

    const propId = prop.rows[0].property_id;

    if (type === 'House') {
      await pool.query('INSERT INTO house (property_id, sqft, number_of_rooms, type) VALUES ($1, $2, $3, $4)',
        [propId, sqft || 0, rooms || 0, 'House']);
    } else if (type === 'Apartment') {
      await pool.query('INSERT INTO apartment (property_id, sqft, number_of_rooms) VALUES ($1, $2, $3)',
        [propId, sqft || 0, rooms || 0]);
    } else if (type === 'Commercial') {
      await pool.query('INSERT INTO commercial (property_id, sqft, business_type) VALUES ($1, $2, $3)',
        [propId, sqft || 0, business_type || 'General']);
    } else if (type === 'Vacation') {
      await pool.query('INSERT INTO vacation (property_id, sqft, number_of_rooms) VALUES ($1, $2, $3)',
        [propId, sqft || 0, rooms || 0]);
    } else if (type === 'Land') {
      await pool.query('INSERT INTO land (property_id, area) VALUES ($1, $2)',
        [propId, sqft || 0]);
    }

    await pool.query('INSERT INTO agent_manages_property (user_id, property_id) VALUES ($1, $2)',
      [req.user.userId, propId]);

    res.status(201).json(prop.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Agent') {
    return res.status(403).json({ error: 'Only agents can update properties' });
  }

  const { type, description, price, city, state, sqft, rooms, business_type, image_url, listing_type } = req.body;
  const propId = req.params.id;

  // Force sale for Land and Commercial
  const finalListingType = (type === 'Land' || type === 'Commercial') ? 'sale' : (listing_type || 'rent');

  try {
    // Verify agent owns this property
    const ownership = await pool.query(
      'SELECT * FROM agent_manages_property WHERE user_id = $1 AND property_id = $2',
      [req.user.userId, propId]
    );
    
    if (ownership.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to update this property' });
    }

    // Update main property
    await pool.query(
      'UPDATE property SET type = $1, description = $2, price = $3, city = $4, state = $5, image_url = $6, listing_type = $7 WHERE property_id = $8',
      [type, description, price, city, state, image_url || null, finalListingType, propId]
    );

    // Update type-specific table
    if (type === 'House') {
      await pool.query('UPDATE house SET sqft = $1, number_of_rooms = $2 WHERE property_id = $3',
        [sqft || 0, rooms || 0, propId]);
    } else if (type === 'Apartment') {
      await pool.query('UPDATE apartment SET sqft = $1, number_of_rooms = $2 WHERE property_id = $3',
        [sqft || 0, rooms || 0, propId]);
    } else if (type === 'Commercial') {
      await pool.query('UPDATE commercial SET sqft = $1, business_type = $2 WHERE property_id = $3',
        [sqft || 0, business_type || 'General', propId]);
    } else if (type === 'Vacation') {
      await pool.query('UPDATE vacation SET sqft = $1, number_of_rooms = $2 WHERE property_id = $3',
        [sqft || 0, rooms || 0, propId]);
    } else if (type === 'Land') {
      await pool.query('UPDATE land SET area = $1 WHERE property_id = $2',
        [sqft || 0, propId]);
    }

    res.json({ message: 'Property updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Agent') {
    return res.status(403).json({ error: 'Only agents can delete properties' });
  }
  try {
    // Verify agent owns this property
    const ownership = await pool.query(
      'SELECT * FROM agent_manages_property WHERE user_id = $1 AND property_id = $2',
      [req.user.userId, req.params.id]
    );
    
    if (ownership.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to delete this property' });
    }

    await pool.query('DELETE FROM property WHERE property_id = $1', [req.params.id]);
    res.json({ message: 'Property deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;