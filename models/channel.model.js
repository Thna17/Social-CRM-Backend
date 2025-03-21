const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user.model");

const Channel  = sequelize.define("Channel", {
    id: {
        type: DataTypes.INTEGER, // Ensure this matches channelPages.channel_id
        autoIncrement: true,
        primaryKey: true
      },
  user_id: { 
    type: DataTypes.INTEGER, 
    allowNull: true, 
    references: { model: User, key: 'id' }
  },
  platform: {
    type: DataTypes.ENUM('messenger', 'whatsapp'),
    defaultValue:'messenger',
  },
  fb_user_id: { type: DataTypes.STRING },
  fb_access_token: { type: DataTypes.TEXT },
});

module.exports = Channel;
