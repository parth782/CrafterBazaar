const { DataTypes } = require("sequelize");
const { conn } = require('../db');
const Inventory = require("./Inventory");
const Consumer=require("./Consumer");
const Order = conn.define("Order", {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    products:{
        type:DataTypes.JSON,
        allowNull:false
    },
    total: {
        type: DataTypes.DOUBLE,
    },
    status: {
        type: DataTypes.ENUM(['paid', 'pending', 'delivered']),
        defaultValue: 'pending'
    },
    consumerId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        refernces: {
            model: "Consumer",
            key: "id"
        }
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },


}, { timestamps: true, tableName: "orders" });
Order.belongsTo(Consumer, { foreignKey: "consumerId" });
module.exports = Order;