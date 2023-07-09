var express = require('express');
var cors = require("cors");


var app = express();
app.use(express.json());

require("dotenv").config();

app.use(cors());


app.use("/static", express.static("static"));
const Farmer = require('./models/Farmer');
const Inventory = require('./models/Inventory');
const Consumer = require('./models/Consumer');
const Order = require('./models/Order');
const { conn } = require('./db');
const bycrypt=require('bcryptjs');
app.use('/api/farmer', require('./routes/farmer'));
app.use('/api/consumer', require('./routes/consumer'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/order', require('./routes/order'));
app.use('/api/admin', require('./routes/admin'));

app.get("/", function (req, res) {
    res.status(200).send({
        uptime: process.uptime(),
        message: 'Welcome to KrishiMarket',
        timestamp: Date.now(),

    });
    return;
})
app.get("/users", async (req, res) => {
    try {
        const farmers = await Farmer.findAll();
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
        // await Farmer.sync({ force: true });
        // await Inventory.sync({ force: true });
        // await Consumer.sync({ force: true });
        // await Order.sync({ force: true });
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
