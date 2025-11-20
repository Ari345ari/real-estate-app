const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'myrentalapp';

router.post('/register', async (req, res) => {
  const { name, email, phone, role, password, agency, job_title, pref_loc, budget, pref_move } = req.body;

  try {
    const userCheck = await pool.query('SELECT * FROM "User" WHERE Email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      `INSERT INTO "User" (Name, Email, Phone, Role, Password) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, email, phone, role, hashedPassword]
    );

    const userId = newUser.rows[0].User_ID;

    if (role === 'Agent') {
      await pool.query(
        `INSERT INTO Agent (User_ID, Agency, Job_Title, Contact) VALUES ($1, $2, $3, $4)`,
        [userId, agency || 'N/A', job_title || 'N/A', email]
      );
    } else if (role === 'Renter') {
      await pool.query(
        `INSERT INTO Renter (User_ID, Pref_Loc, Budget, Pref_Move) VALUES ($1, $2, $3, $4)`,
        [userId, pref_loc || 'Any', budget || 0, pref_move || null]
      );
    }

    const token = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
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
    const validPass = await bcrypt.compare(password, user.password);

    if (!validPass) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.User_ID, role: user.Role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;