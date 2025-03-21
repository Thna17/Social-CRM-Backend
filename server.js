const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => console.log('Database connected'))
  .catch(err => console.log('Database connection error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});