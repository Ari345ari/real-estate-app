const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Register route
router.post('/register', async (req, res) => {
  const { name, email, phone, role, password } = req.body;

  try {
    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM "User" WHERE Email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      `INSERT INTO "User" (Name, Email, Phone, Role, Password) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, email, phone, role, hashedPassword]
    );

    // Create JWT token
    const token = jwt.sign({ userId: newUser.rows[0].User_ID, role: role }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token, user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const userRes = await pool.query('SELECT * FROM "User" WHERE Email = $1', [email]);
      if (userRes.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
  
      const user = userRes.rows[0];
  
      // Compare password
      const validPass = await bcrypt.compare(password, user.password);
      if (!validPass) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
  
      // Create token
      const token = jwt.sign({ userId: user.User_ID, role: user.Role }, JWT_SECRET, {
        expiresIn: '1h',
      });
  
      res.json({ token, user });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  

module.exports = router;
