const { DataTypes } = require("sequelize");
const { conn } = require('../db');
const Crafter = require('./Crafter');
const Inventory = conn.define("Inventory", {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
    },
    quantity: {
        type: DataTypes.BIGINT,
        defaultValue: 0
    },
    price: {
        type: DataTypes.DOUBLE,
        defaultValue: 0
    },
    crafterId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        refernces: {
            model: "Crafter",
            key: "id"
        }
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    imgFile: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }

}, { timestamps: true, tableName: "inventories" });
Inventory.belongsTo(Crafter, { foreignKey: "crafterId" });
module.exports = Inventory;