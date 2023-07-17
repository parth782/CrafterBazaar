const express = require("express");
const router = express.Router();
const { ensureConsumerAuthenticated } = require("../middleware/auth");
const Order = require('../models/Order');
const Consumer = require('../models/Consumer');
const Crafter = require('../models/Crafter');
const { Sequelize } = require("sequelize");
const Cart = require("../models/Cart");

// FOR PLACING AN ORDER
router.post('/', ensureConsumerAuthenticated, async (req, res) => {
    try {
        const item=await Cart.findAll({raw:true,attributes:{include:['productId','quantity']},where:{consumerId:req.user.id}});
        if(item.length==0){
            return res.status(200).json({ status: "fail", msg: "Cart is Empty" });
        }
        const total = await Cart.sum('totalPrice', { where: { consumerId: req.user.id } });
        
        
        const consumer = await Consumer.findOne({ raw: true, where: { id: req.user.id } });
        if (consumer.money < total) {
            return res.status(200).json({ status: "fail", msg: "Not Enough Money" });
        }
        const order = await Order.create({
            total: total,
            products: JSON.stringify(item),
            consumerId: req.user.id,
        });
        await order.save();
        await Consumer.update({ money: Sequelize.literal(`money-${total}`) }, { where: { id: req.user.id } });
        await Crafter.update({ money: Sequelize.literal(`money+${total}`) }, { where: { id: inv.crafterId } });
        await Order.update({ status: "paid" }, { where: { id: order.id } });
        await Cart.destroy({ where: { consumerId: req.user.id } });
        return res.status(200).json({ status: "success", msg: "Order Placed Successfully" });


    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
})


router.get("/", ensureConsumerAuthenticated, async (req, res) => {
    try {

        const orders = await Order.findAll({ nest: true, raw: true, include: ["Inventory", "Consumer"], where: { consumerId: req.user.id } });
        orders.forEach((item, index) => {
            delete item.Crafter.mobileNo;
        })
        return res.status(200).json({ status: "success", orders: orders });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
})
module.exports = router;