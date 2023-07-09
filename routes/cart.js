const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Cart = require("../models/Cart");
const { ensureConsumerAuthenticated } = require("../middleware/auth");
const Inventory = require("../models/Inventory");


router.post("/add", ensureConsumerAuthenticated, body("productId").isInt(), body("quantity").isInt(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const cart = await Cart.findOne({ raw: true, where: { productId: req.body.productId, consumerId: req.user.id } });
        if (cart) {
            return res.status(200).json({ status: "fail", msg: "Product Already in Cart" });
        }
        const item = await Inventory.findOne({ raw: true, where: { id: req.body.productId } });
        if (!item) {
            return res.status(400).json({ status: "fail", msg: "Product Not Found" });
        }
        if (item.quantity < req.body.quantity) {
            return res.status(400).json({ status: "fail", msg: "Quantity Not Available" });
        }

        const cartItem = await Cart.create({
            productId: req.body.productId,
            quantity: req.body.quantity,
            consumerId: req.user.id,
            totalPrice: (item.pricePerUnit * req.body.quantity)
        });
        await cartItem.save();
        item.quantity -= req.body.quantity;
        await Inventory.update({ quantity: item.quantity }, { where: { id: req.body.productId } });
        return res.status(200).json({ status: "success", msg: "Product Added to Cart" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
})
router.get("/", ensureConsumerAuthenticated, async (req, res) => {
    try {
        const cartItems = await Cart.findAll({ raw: true, where: { consumerId: req.user.id } });
        return res.status(200).json({ status: "success", cartItems: cartItems });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
})

router.post("/update/:id", ensureConsumerAuthenticated, body("quantity").isInt(), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const cartItem = await Cart.findOne({ raw: true, where: { id: req.params.id } });
        if (!cartItem) {
            return res.status(400).json({ status: "fail", msg: "Cart Item Not Found" });
        }
        const item = await Inventory.findOne({ raw: true, where: { id: req.body.productId } });
        if (!item) {
            return res.status(400).json({ status: "fail", msg: "Product Not Found" });
        }
        if (item.quantity < req.body.quantity) {
            return res.status(400).json({ status: "fail", msg: "Quantity Not Available" });
        }
        cartItem.quantity = req.body.quantity;
        cartItem.totalPrice = (item.pricePerUnit * req.body.quantity);
        await cartItem.save();
        item.quantity -= req.body.quantity;
        await Inventory.update({ quantity: item.quantity }, { where: { id: req.body.productId } });
        return res.status(200).json({ status: "success", msg: "Cart Item Updated" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
})
module.exports = router;