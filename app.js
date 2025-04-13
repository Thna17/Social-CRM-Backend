const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
require('./controllers/facebook.controller'); // Ensure Passport config loads
const socialChannelRoute = require('./routes/socialChannel.routes');
const messageRoutes = require('./routes/message.routes');
const templateRoutes = require('./routes/template.routes')
const webhookRoutes = require('./routes/webhook.routes')
const session = require('express-session');
const cookieParser = require('cookie-parser');
const syncDB = require('./config/initDb');

const app = express();
app.use(cookieParser());


app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));

// Middleware
app.use(bodyParser.json());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(passport.initialize());
app.use(passport.session()); // If using sessions

// Routes
app.use('/api/template', templateRoutes);
app.use('/api/webhook', webhookRoutes)
app.use('/api/channel', socialChannelRoute);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => res.send('CRM Backend Running!'));

// Sync database and start server
const startServer = async () => {
  await syncDB();

  const port = process.env.PORT || 5001;
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`App running on port ${port}...`);
  });

  process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    console.log('UNHANDLED REJECTION!! Shutting Down...');
    server.close(() => {
      process.exit(1);
    });
  });
};

startServer();
