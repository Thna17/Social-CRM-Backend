// message.model.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const FacebookPage = require("./facebookPage.model")
// conversation.model.js
const Conversation = sequelize.define("Conversation", {
    sender_id: DataTypes.STRING,
    page_id: { type: DataTypes.STRING,  references: {
      model: FacebookPage,
      key: "page_id",
    }, },
    status: {
      type: DataTypes.ENUM('bot', 'human', 'pending'),
      defaultValue: 'bot'
    },
    last_active: DataTypes.DATE,
    agent_id: DataTypes.INTEGER // If tracking specific agents
  });
  
  // Add to Message model
 
module.exports = Conversation;