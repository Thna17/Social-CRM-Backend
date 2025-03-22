const sequelize = require('../config/database');
const User = require('./user.model');
const Channel = require('./channel.model');
const ChannelPage = require('./channelPage.model');

// Associations
User.hasMany(Channel, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Channel.belongsTo(User, { foreignKey: 'user_id' });
ChannelPage.belongsTo(Channel, { foreignKey: 'channel_id' });

Channel.hasMany(ChannelPage, { foreignKey: 'channel_id' }); 
User.hasMany(ChannelPage, { foreignKey: 'user_id' });
ChannelPage.belongsTo(User, { foreignKey: 'user_id' });
// User.hasMany(UserPage, { foreignKey: 'user_id' });
// UserPage.hasMany(PageMessage, { foreignKey: 'page_id' });

sequelize.sync({ force: false }).then(() => {
  console.log('Database synced');
});

module.exports = { User, ChannelPage, Channel };
