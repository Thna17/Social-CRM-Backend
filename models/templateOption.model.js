const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TemplateOption = sequelize.define("TemplateOption", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  option_number: DataTypes.INTEGER,
  option_text: DataTypes.STRING,
  reply_text: DataTypes.TEXT,
  product_data: {  // New field
    type: DataTypes.JSON,
    allowNull: true
  }

});

module.exports = TemplateOption;