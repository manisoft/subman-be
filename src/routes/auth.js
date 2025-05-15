const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getUserByEmail, createUser } = require('../models/user');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const router = express.Router();

// Register
router.post(
  '/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password, name } = req.body;
    try {
      const existingUser = await getUserByEmail(email);
      if (existingUser) return res.status(409).json({ error: 'User already exists' });
      const hashed = await bcrypt.hash(password, 10);
      await createUser({
        id: uuidv4(),
        email,
        password: hashed,
        name,
        avatar_url: null,
        role: 'user',
      });
      res.status(201).json({ message: 'User registered' });
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      const user = await getUserByEmail(email);
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      });
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Password reset request
router.post('/request-password-reset', [body('email').isEmail()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email } = req.body;
  try {
    const user = await getUserByEmail(email);
    // Always respond with success to avoid leaking user existence
    if (!user) return res.json({ message: 'If this email is registered, you will receive a password reset link.' });

    // Generate token and expiry
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 1000 * 60 * 60; // 1 hour
    // Save token and expiry to DB (add fields if needed)
    await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [token, expires, user.id]);

    // Send email
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: 'info@subman.org',
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    const resetUrl = `${process.env.FRONTEND_URL || 'https://subman.org'}/reset-password?token=${token}`;
    await transporter.sendMail({
      from: 'info@subman.org',
      to: email,
      subject: 'SubMan Password Reset',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 1 hour.</p>`
    });
    return res.json({ message: 'If this email is registered, you will receive a password reset link.' });
  } catch (e) {
    console.error('Password reset request error:', e); // Log the real error for debugging
    return res.status(500).json({ error: 'Server error' });
  }
});

// Password reset
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { token, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE reset_token = ?', [token]);
    const user = rows[0];
    if (!user || !user.reset_token_expires || user.reset_token_expires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    const hashed = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [hashed, user.id]);
    return res.json({ message: 'Password reset successful' });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
