const sequelize = require('./database');

const syncDB = async () => {
  try {
    await sequelize.sync({ force: false, logging: false, alter: true });
  } catch (error) {
    console.log('Database sync failed', error);
    process.exit(1);
  }
};

module.exports = syncDB;
