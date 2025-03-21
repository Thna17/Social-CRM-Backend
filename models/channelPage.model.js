const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');
const Channel = require('./channel.model');

const ChannelPage = sequelize.define('ChannelPage', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  // user_id: { type: DataTypes.INTEGER, references: { model: User, key: 'id'}},
  channel_id: {
    type: DataTypes.INTEGER, // Ensure this matches channels.id
    allowNull: false,
    references: {
      model: Channel,
      key: 'id'
    }
  },
  // user_id: { 
  //   type: DataTypes.INTEGER, 
  //   allowNull: true, 
  //   references: { model: User, key: 'id' }
  // },
  // channel_name: { type: DataTypes.STRING },
  // page_type: { type: DataTypes.STRING },
  // page_admin_id: { type: DataTypes.STRING },
  // page_admin_name: { type: DataTypes.STRING },
  // page_created_at: { type: DataTypes.DATE },
  // page_updated_at: { type: DataTypes.DATE },
  // page_status: { type: DataTypes.STRING },
  // page_category: { type: DataTypes.STRING },
  // page_token: { type: DataTypes.TEXT },
  // page_access_token_expires_at: { type: DataTypes.DATE },
  // page_likes: { type: DataTypes.INTEGER },
  // page_comments: { type: DataTypes.INTEGER },
  // page_shares: { type: DataTypes.INTEGER },

  page_id: { type: DataTypes.STRING, allowNull: false, unique: true },
  page_access_token: { type: DataTypes.TEXT},
  page_name: { type: DataTypes.STRING },
  encrypted_token: { type: DataTypes.TEXT }
});

module.exports = ChannelPage;
