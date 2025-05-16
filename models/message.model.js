// message.model.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const FacebookPage = require("./facebookPage.model");
const FacebookAccount = require("./facebookAccount.model");

const Message = sequelize.define("Message", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sender_id: DataTypes.STRING,
  page_id: {
    type: DataTypes.STRING,
    references: {
      model: FacebookPage,
      key: "page_id",
    },
  },
  facebook_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: FacebookAccount,
      key: "id",
    },
  },

  content: DataTypes.TEXT,
  direction: DataTypes.ENUM("incoming", "outgoing"),
  timestamp: DataTypes.DATE,
  message_type: DataTypes.ENUM("text", "quick_reply", "product_carousel"),
  option_selected: DataTypes.INTEGER,
});

module.exports = Message;
