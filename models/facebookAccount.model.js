const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FacebookAccount = sequelize.define("FacebookAccount", {
  id: {
    type: DataTypes.INTEGER, 
    autoIncrement: true,
    primaryKey: true,
  },
  platform: {
    type: DataTypes.ENUM("messenger", "whatsapp"),
    defaultValue: "messenger",
  },
  fb_user_id: { type: DataTypes.STRING },
  fb_access_token: { type: DataTypes.TEXT },
});

module.exports = FacebookAccount;
