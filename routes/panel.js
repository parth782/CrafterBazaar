const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Panel = require("../models/Panel");
const jwt = require("jsonwebtoken");

// IMPORTING ALL MODELS
const Crafter = require('../models/Crafter');
const Inventory = require('../models/Inventory');
const Consumer = require('../models/Consumer');
const Order = require('../models/Order');
const { ensureAdminAuthenticated } = require("../middleware/auth");

// FOR LOGIN OF ADMIN
router.post("/", body("email").isEmail(), body("password").isLength({ min: 6 }), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array()[0].msg });
        }
        const { email, password } = req.body;
        const panel = await Panel.findOne({ raw: true, where: { email: email } });
        if (!panel || await bcrypt.compare(password, panel.password)) {
            return res.status(400).json({ errors: "Record Not Found" });
        }
        const payload = {
            email: email,
            role: "admin",
            id: panel.id
        }
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 });
        return res.status(200).json({ token: token, role: "admin" });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
});

// FOR FETCHING ALL FARMERS
router.get("/crafters", ensureAdminAuthenticated, async (req, res) => {
    try {
        const crafters = await Crafter.findAll();
        return res.status(200).json({ status: "success", crafters: crafters });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
})

// FOR FETCHING ALL CONSUMERS
router.get("/consumers", ensureAdminAuthenticated, async (req, res) => {
    try {
        const consumers = await Consumer.findAll();
        return res.status(200).json({ status: "success", consumers: consumers });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
})

// FOR FETCHING ALL ORDERS
router.get("/orders", ensureAdminAuthenticated, async (req, res) => {
    try {
        const orders = await Order.findAll();
        return res.status(200).json({ status: "success", orders: orders });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
});

// FETCHING INVENTORIES
router.get("/inventories", ensureAdminAuthenticated, async (req, res) => {
    try {
        const inventories = await Inventory.findAll();
        return res.status(200).json({ status: "success", inventories: inventories });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
})

// FOR FETCHING INVENTORY BY ID
router.get("/inventory/:id", ensureAdminAuthenticated, async (req, res) => {
    try {
        const inventory = await Inventory.findOne({ where: { id: req.params.id } });
        if (!inventory) {
            return res.status(400).json({ msg: "No Such Inventory Found" });
        }
        return res.status(200).json({ status: "success", inventory: inventory });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
})

// FOR FETCHING ORDER DETAILS
router.get("/order/:id", ensureAdminAuthenticated, async (req, res) => {
    try {
        const order = await Order.findOne({ where: { id: req.params.id } });
        if (!order) {
            return res.status(400).json({ msg: "No Such Order Found" });
        }
        return res.status(200).json({ status: "success", order: order });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
})

// FOR FETCHING INFO OF PARTICULAR CONSUMER
router.get("/consumer/:id", ensureAdminAuthenticated, async (req, res) => {
    try {
        const consumer = await Consumer.findOne({ where: { id: req.params.id } });
        if (!consumer) {
            return res.status(400).json({ msg: "No Such Consumer Found" });
        }
        return res.status(200).json({ status: "success", consumer: consumer });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
})

// FOR FETCHING INFO OF PARTICULAR FARMER
router.get("/crafter/:id", ensureAdminAuthenticated, async (req, res) => {
    try {
        const crafter = await Crafter.findOne({ where: { id: req.params.id } });
        if (!crafter) {
            return res.status(400).json({ msg: "No Such Crafter Found" });
        }
        return res.status(200).json({ status: "success", crafter: crafter });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
})

// FOR FETCHING ORDERS OF PARTICULAR CONSUMERS
router.get("/consumer/:id/orders", ensureAdminAuthenticated, async (req, res) => {
    try {
        const orders = await Order.findAll({ where: { consumerId: req.params.id } });
        if (!orders) {
            return res.status(400).json({ msg: "No Such Consumer Found" });
        }
        return res.status(200).json({ status: "success", orders: orders });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
})

// FOR FETCHING INVENTORY OF PARTICULAR FARMER
router.get("/crafter/:id/inventory", ensureAdminAuthenticated, async (req, res) => {
    try {
        const inventory = await Inventory.findAll({ where: { crafterId: req.params.id } });
        if (!inventory) {
            return res.status(400).json({ msg: "No Such Crafter Found" });
        }
        return res.status(200).json({ status: "success", inventory: inventory });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
})




module.exports = router;