const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/search', async (req, res) => {
  const { city, type, bedrooms, price_min, price_max, neighborhood_id } = req.query;
  try {
    let query = `SELECT p.*, n.Location, n.Crime FROM Property p LEFT JOIN Neighborhood n ON p.Neighborhood_ID = n.Neighborhood_ID WHERE Available = true`;
    const params = [];

    if (city) {
      query += ` AND p.City = $${params.length + 1}`;
      params.push(city);
    }
    if (type) {
      query += ` AND p.Type = $${params.length + 1}`;
      params.push(type);
    }
    if (price_min) {
      query += ` AND p.Price >= $${params.length + 1}`;
      params.push(price_min);
    }
    if (price_max) {
      query += ` AND p.Price <= $${params.length + 1}`;
      params.push(price_max);
    }

    query += ` ORDER BY p.Price ASC`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/agent-properties', authenticateToken, async (req, res) => {
  try {
    const props = await pool.query(
      `SELECT p.* FROM Property p JOIN Agent_manages_property amp ON p.Property_ID = amp.Property_ID WHERE amp.User_ID = $1`,
      [req.user.userId]
    );
    res.json(props.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/create', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Agent') {
    return res.status(403).json({ error: 'Only agents can create properties' });
  }

  const { type, description, price, city, state, neighborhood_id, sqft, rooms, business_type } = req.body;

  try {
    const prop = await pool.query(
      `INSERT INTO Property (Type, Description, Price, Available, City, State, Neighborhood_ID) VALUES ($1, $2, $3, true, $4, $5, $6) RETURNING *`,
      [type, description, price, city, state, neighborhood_id]
    );

    const propId = prop.rows[0].Property_ID;

    if (type === 'House') {
      await pool.query(`INSERT INTO House (Property_ID, Sqft, Number_of_Rooms, Type) VALUES ($1, $2, $3, $4)`, [propId, sqft, rooms, 'House']);
    } else if (type === 'Apartment') {
      await pool.query(`INSERT INTO Apartment (Property_ID, Sqft, Number_of_Rooms) VALUES ($1, $2, $3)`, [propId, sqft, rooms]);
    } else if (type === 'Commercial') {
      await pool.query(`INSERT INTO Commercial (Property_ID, Sqft, Business_Type) VALUES ($1, $2, $3)`, [propId, sqft, business_type]);
    } else if (type === 'Vacation') {
      await pool.query(`INSERT INTO Vacation (Property_ID, Sqft, Number_of_Rooms) VALUES ($1, $2, $3)`, [propId, sqft, rooms]);
    } else if (type === 'Land') {
      await pool.query(`INSERT INTO Land (Property_ID, Area) VALUES ($1, $2)`, [propId, sqft]);
    }

    await pool.query(`INSERT INTO Agent_manages_property (User_ID, Property_ID) VALUES ($1, $2)`, [req.user.userId, propId]);

    res.status(201).json(prop.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  const { description, price, available } = req.body;
  try {
    const prop = await pool.query(
      `UPDATE Property SET Description = $1, Price = $2, Available = $3 WHERE Property_ID = $4 RETURNING *`,
      [description, price, available, req.params.id]
    );
    res.json(prop.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Agent') {
    return res.status(403).json({ error: 'Only agents can delete properties' });
  }
  try {
    await pool.query(`DELETE FROM Property WHERE Property_ID = $1`, [req.params.id]);
    res.json({ message: 'Property deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;