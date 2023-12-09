const express = require("express");
const router = express.Router();
const { ensureConsumerAuthenticated } = require("../middleware/auth");
const Order = require('../models/Order');
const Consumer = require('../models/Consumer');
const Crafter = require('../models/Crafter');
const { Sequelize } = require("sequelize");
const Cart = require("../models/Cart");
const Inventory = require("../models/Inventory");

// FOR PLACING AN ORDER
router.post('/', ensureConsumerAuthenticated, async (req, res) => {
    try {
        const { items } = req.body;
        let total = 0;
        items.forEach(async (item, index) => {
            const inv = await Inventory.findOne({ where: { id: item.id } });
            total += inv.price;
        })
        const user = await Consumer.findOne({ where: { id: req.user.id } });
        if (user.money < total) {
            return res.status(400).json({ status: "error", msg: "Not Enough Money" });
        }
        await Order.create({ consumerId: req.user.id, products: items, total: total });

        items.forEach(async (item, index) => {
            await Consumer.update({ money: Sequelize.literal(`money-${item.price}`) }, { where: { id: req.user.id } });
            await Crafter.update({ money: Sequelize.literal(`money+${item.price}`) }, { where: { id: item.crafter.id } });

        })
        res.status(200).json({ status: "success", msg: "Order Placed Successfully" });


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