var express = require('express');
var cors = require("cors");


var app = express();
app.use(express.json());

require("dotenv").config();

app.use(cors());


app.use("/static", express.static("static"));

const Crafter=require('./models/Crafter');
const Inventory = require('./models/Inventory');
const Consumer = require('./models/Consumer');
const Order = require('./models/Order');
const { conn } = require('./db');
const bycrypt=require('bcryptjs');
const Cart = require('./models/Cart');
const Panel = require('./models/Panel');
app.use('/api/crafter', require('./routes/crafter'));
app.use('/api/consumer', require('./routes/consumer'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/order', require('./routes/order'));
app.use('/api/admin', require('./routes/panel'));

app.get("/", function (req, res) {
    res.status(200).send({
        uptime: process.uptime(),
        message: 'Welcome to Crafters Bazaar',
        timestamp: Date.now(),

    });
    return;
})
app.get("/users", async (req, res) => {
    try {
        const farmers = await Crafter.findAll();
        const consumers = await Consumer.findAll();
        return res.status(200).json({ status: "success", farmers: farmers, consumers: consumers });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
})
app.listen(process.env.PORT || 5000, async (err) => {
    if (err) {
        console.log(err);
    }
    try {
        await conn.authenticate();
        await Crafter.sync({ force: true });
        await Inventory.sync({ force: true });
        await Consumer.sync({ force: true });
        await Order.sync({ force: true });
        await Cart.sync({ force: true });
        await Panel.sync({ force: true });

        const record = await Panel.findOne({ where: { id: 1 } });
        if (!record) {
            const seeder = new Panel({
                name: 'Crafters Bazaar',
                email: 'admin@crafterbazaar.com',
                password: await bycrypt.hash('admin123', 10),
                mobileNum: 9354425548,
                description: 'Handicraft platforms typically allow artisans to create profiles that highlight their skills, background, and the types of crafts they specialize in. These profiles often include images of their work, personal stories, and information about their creative process.'


            })
            await seeder.save();
        }
        console.log("Database Connected");
        console.log("Server is running on port 5000");
    } catch (err) {
        console.log(err);

    }
})
