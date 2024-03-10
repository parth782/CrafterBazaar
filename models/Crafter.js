const {DataTypes}=require("sequelize");
const {conn}=require('../db');
const Crafter=conn.define("Crafter",{
    id:{
        type:DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name:{
        type:DataTypes.STRING,

    },
    mobileNo:{
        type:DataTypes.BIGINT,
        unique:true
    },
    city:{
        type:DataTypes.STRING,
    },
    district:{
        type:DataTypes.STRING,
    },
    bloodGroup:{
        type:DataTypes.ENUM(['O+','O-','A+','A-','AB-','AB+','B+','B-']),
    },
    money:{
        type:DataTypes.DOUBLE,
        defaultValue:0
    },
    isUpdate:{
        type:DataTypes.BOOLEAN,
        defaultValue:false
    },
    imgFile:{
        type:DataTypes.STRING,
        allownull:true
    },
    email:{
        type:DataTypes.STRING,
        unique:true,
        trim:true,
    },
    password:{
        type:DataTypes.STRING,
        trim:true
    }



},{timestamps:true,tableName:"crafters"});

module.exports = Crafter;