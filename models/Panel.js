const { DataTypes } = require("sequelize");
const { conn } = require('../db');
const Panel = conn.define("Panel", {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mobileNum: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.Text,
        allowNull: false
    },

}, { timestamps: true, tableName: "panels" });
module.exports = Panel;

