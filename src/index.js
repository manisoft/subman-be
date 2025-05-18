require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(passport.initialize());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'https://api.subman.org/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Find or create user
    const [rows] = await pool.query('SELECT * FROM users WHERE google_id = ? OR email = ?', [profile.id, profile.emails[0].value]);
    let user = rows[0];
    if (!user) {
      // Create new user
      const id = profile.id;
      const email = profile.emails[0].value;
      const name = profile.displayName;
      const avatar_url = profile.photos[0]?.value || null;
      await pool.query(
        'INSERT INTO users (id, email, name, google_id, provider, profile_picture, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, email, name, profile.id, 'google', avatar_url, avatar_url]
      );
      user = { id, email, name, google_id: profile.id, provider: 'google', profile_picture: avatar_url, avatar_url };
    }
    return done(null, user);
  } catch (e) {
    return done(e, null);
  }
}));

// Microsoft OAuth Strategy
passport.use(new MicrosoftStrategy({
  clientID: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  callbackURL: 'https://api.subman.org/api/auth/microsoft/callback',
  scope: ['user.read'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Find or create user
    const [rows] = await pool.query('SELECT * FROM users WHERE microsoft_id = ? OR email = ?', [profile.id, profile.emails[0].value]);
    let user = rows[0];
    if (!user) {
      // Create new user
      const id = profile.id;
      const email = profile.emails[0].value;
      const name = profile.displayName;
      const avatar_url = (profile.photos && profile.photos[0]) ? profile.photos[0].value : null;
      await pool.query(
        'INSERT INTO users (id, email, name, microsoft_id, provider, profile_picture, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, email, name, profile.id, 'microsoft', avatar_url, avatar_url]
      );
      user = { id, email, name, microsoft_id: profile.id, provider: 'microsoft', profile_picture: avatar_url, avatar_url };
    }
    return done(null, user);
  } catch (e) {
    return done(e, null);
  }
}));

app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/api/auth/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/auth?error=google' }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth?token=${token}`);
  }
);

app.get('/api/auth/microsoft', passport.authenticate('microsoft'));

app.get('/api/auth/microsoft/callback', passport.authenticate('microsoft', { session: false, failureRedirect: '/auth?error=microsoft' }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth?token=${token}`);
  }
);

const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscriptions');
const popularServiceRoutes = require('./routes/popularServices');
const userRoutes = require('./routes/user');
const pushNotificationRoutes = require('./routes/pushNotifications');
const categoriesRoutes = require('./routes/categories');
const pagesRoutes = require('./routes/pages');
const versionRoutes = require('./routes/version');
const adminRoutes = require('./routes/admin');
const sendFeedbackRoute = require('./routes/sendFeedback');

app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/popular-services', popularServiceRoutes);
app.use('/api/user', userRoutes);
app.use('/api/push', pushNotificationRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/version', versionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/send-feedback', sendFeedbackRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SubMan backend running on port ${PORT}`);
});
