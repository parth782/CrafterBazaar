const { DataTypes } = require("sequelize");
const { conn } = require('../db');
const Consumer = conn.define("Consumer", {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        trim: true,

    },
    email:{
        type:DataTypes.STRING,
        unique:true,
        trim:true,
    },
    password:{
        type:DataTypes.STRING,
        trim:true
    },
    mobileNo: {
        type: DataTypes.BIGINT,
        trim: true,
       
    },
    city: {
        type: DataTypes.STRING,
    },
    district: {
        type: DataTypes.STRING,
    },
    money: {
        type: DataTypes.DOUBLE,
        defaultValue: 2000
    },
    isUpdate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    imgFile:{
        type:DataTypes.STRING,
        allownull:true
    }


}, { timestamps: true, tableName: "consumers" });
module.exports = Consumer;