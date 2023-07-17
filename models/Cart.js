const { DataTypes } = require('sequelize');
const { conn } = require('../db');
const Inventory = require('./Inventory');
const Consumer = require('./Consumer');
const Cart = conn.define("Cart", {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    inventoryId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        refernces: {
            model: "Inventory",
            key: "id"
        }
    },
    quantity: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    consumerId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        refernces: {
            model: "Consumer",
            key: "id"
        }
    },
    totalPrice:{
        type:DataTypes.DOUBLE,
        allowNull:false
    }


}, { timestamps: true, tableName: "carts" });
Cart.belongsTo(Inventory, { foreignKey: "inventoryId" });
Cart.belongsTo(Consumer, { foreignKey: "consumerId" });


module.exports = Cart;