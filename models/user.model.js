const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  // email: {
  //   type: DataTypes.STRING,
  //   unique: true, // Ensure the constraint is added only once
  //   allowNull: true,
  // },
  // password: { type: DataTypes.STRING, allowNull: true },
  name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    // validate: {
    //   notEmpty: {
    //     msg: 'User must have a Username',
    //   },
    //   len: {
    //     args: [6, 40],
    //     msg: 'Name must be between 4 and 50 characters long!',
    //   },
    // },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
    allowNull: false
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  otp: {
    type: DataTypes.STRING,
  },
  otpExpires: {
    type: DataTypes.DATE,
  },
});

module.exports = User;
