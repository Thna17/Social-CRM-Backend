const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const FacebookAccount = require("./facebookAccount.model");

const FacebookPage = sequelize.define("FacebookPage", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  facebook_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: FacebookAccount,
      key: "id",
    },
  },
  page_id: { type: DataTypes.STRING, allowNull: false, unique: true },
  page_access_token: { type: DataTypes.TEXT },
  page_name: { type: DataTypes.STRING },
  encrypted_token: { type: DataTypes.TEXT },
  active_template_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = FacebookPage;
