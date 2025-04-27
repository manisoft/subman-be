require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscriptions');
const popularServiceRoutes = require('./routes/popularServices');
const userRoutes = require('./routes/user');
const pushNotificationRoutes = require('./routes/pushNotifications');
const categoriesRoutes = require('./routes/categories');
const pagesRoutes = require('./routes/pages');
const versionRoutes = require('./routes/version');

app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/popular-services', popularServiceRoutes);
app.use('/api/user', userRoutes);
app.use('/api/push', pushNotificationRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/version', versionRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SubMan backend running on port ${PORT}`);
});
