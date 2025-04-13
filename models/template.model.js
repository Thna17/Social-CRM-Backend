// template.model.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Template = sequelize.define("Template", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: DataTypes.STRING,
  welcome_message: DataTypes.TEXT,
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  facebook_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
    // page_id: { type: DataTypes.STRING, allowNull: true, unique: true },
});

module.exports = Template;
