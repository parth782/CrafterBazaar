const express = require('express');
const router = express.Router();
//const twilio = require('twilio');
const jwt = require("jsonwebtoken");
//const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const { body, validationResult } = require("express-validator");
const { ensureConsumerAuthenticated } = require('../middleware/auth');
const Consumer = require('../models/Consumer');
const { Sequelize } = require("sequelize");
const bycrypt = require("bcryptjs");
const Op = Sequelize.Op;

// IMAGE UPLOADING PACKAGES
var multer = require("multer");
var path = require("path");
var fs = require("fs");

function checkFileType(file, cb, type) {
    const filetypes = type;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    }
    else {
        cb("Error: Images Only!");
    }
}
var storage = multer.diskStorage({
    destination: './static/uploads/consumer',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

var upload = multer({
    storage: storage,
    limits: { fileSize: 10000000000 },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb, /jpeg|jpg|png|gif/);
    }
}).single("imgFile");


router.post('/login', body("email").isEmail().withMessage("Please Enter Valid Email"), body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 charaters long"), async (req, res) => {

    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array()[0].msg });
        }
        const { email, password } = req.body;
        const consumer = await Consumer.findOne({ raw: true, where: { email: email } });
        if (!consumer) {
            return res.status(400).json({ status: "Error", msg: "Invalid Email" })
        }
        else {
            const check = await bycrypt.compare(password, consumer.password);
            if (!check) {
                return res.status(400).json({ status: "Error", msg: "Invalid Password" });
            }
            else {
                const payload = {
                    role: "consumer",
                    id: consumer.id,
                    isUpdate: consumer.isUpdate
                };
                const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 });
                return res.status(200).json({ status: "success", token: token, role: "consumer", isUpdate: consumer.isUpdate });
            }
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Internal Server Error");
    }
});


router.post("/register", body("email").isEmail().withMessage("Please Enter Valid Email"), body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 charaters long"), async (req, res) => {

    try {
        const { email, password } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array()[0].msg });
        }
        const record = await Consumer.findOne({ raw: true, where: { email: email } });
        if (record) {
            return res.status(400).json({ status: "Error", msg: "Email already Exists" });
        }
        const salt = await bycrypt.genSalt(10);
        const hash = await bycrypt.hash(password, salt);
        const consumer = await Consumer.create({
            email: email,
            password: hash
        });
        await consumer.save();
        const payload = {
            role: "consumer",
            id: consumer.id,
            isUpdate: consumer.isUpdate
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 });
        return res.status(200).json({ status: "success", token: token, role: "consumer", isUpdate: consumer.isUpdate });


    }
    catch (err) {
        console.error(err.message);
        res.status(500).json({ status: "Error", msg: "Internal Server Error" });

    }
})


// OTP VERIFICATION STEP

// router.post("/otp-verify", body("otp").isLength({ min: 6 }).withMessage("OTP must be of length 6"), body("mobileNo").isLength({ min: 10 }).withMessage("Mobile No must be of length 10"), async (req, res) => {

//     try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(422).json({ errors: errors.array()[0].msg });
//         }
//         const temp = await client.verify.services(process.env.TWILIO_VERIFICATION_SID)
//             .verificationChecks
//             .create({ to: '+91' + req.body.mobileNo, code: req.body.otp });
//         console.log(temp);
//         if (temp.status == "approved") {
//             var consumer = await Consumer.findOne({ raw: true, where: { mobileNo: req.body.mobileNo } });
//             if (!consumer) {
//                 var consumer = await Consumer.create({
//                     mobileNo: req.body.mobileNo
//                 });
//                 await consumer.save();
//             }
//             const payload = {
//                 role: "consumer",
//                 id: consumer.id,
//                 isUpdate: consumer.isUpdate
//             };
//             jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
//                 if (err) throw err;
//                 res.status(200).json({ status: "success", token: token, role: "consumer", isUpdate: consumer.isUpdate });
//             });
//         }
//         else {
//             res.status(400).json({ errors: [{ msg: "Invalid OTP" }] });
//         }
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send("Internal Server Error");
//     }
// })

router.post("/edit", ensureConsumerAuthenticated, body('name').isLength({ min: 3 }).withMessage("Name must be atleast 3 characters long"), body('mobileNo').isLength({ min: 10 }).withMessage("Mobile number must be 10 digits long"), body('city').isLength({ min: 3 }).withMessage("City must be atleast 3 charcters long"), body('district').isLength({ min: 3 }).withMessage("District must be three charcters long"),
    async (req, res) => {

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array()[0].msg });
            }
            const { name, mobileNo, city, district, bloodGroup } = req.body;
            const record = await Consumer.findOne({ raw: true, where: { mobileNo: mobileNo, id: { [Op.ne]: req.user.id } } });
            if (record) {
                return res.status(400).json({ errors: [{ msg: "Mobile Number already exists" }] });
            }
            await Consumer.update({
                name: name,
                mobileNo: mobileNo,
                city: city,
                district: district,
                isUpdate: true

            }, { where: { id: req.user.id } });
            return res.status(200).json({ status: "success", msg: "Record Updated Successfully" });


        } catch (err) {
            console.error(err.message);
            res.status(500).send("Internal Server Error");
        }


    })

router.get("/edit", ensureConsumerAuthenticated, async (req, res) => {
    try {
        const record = await Consumer.findOne({ raw: true, where: { id: req.user.id } });
        return res.status(200).json({ status: "success", record: record });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
})

router.post("/img", ensureConsumerAuthenticated, async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.log(err);
            return res.status(400).json({ errors: err });
        }
        else {
            if (req.file == undefined) {
                return res.status(400).json({ errors: "No File Selected" });
            }
            else {
                var consumer = await Consumer.findOne({ raw: true, where: { id: req.user.id } });
                if (consumer.imgFile) {
                    fs.unlink("./static/uploads/consumer" + consumer.imgFile, (err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
                await Consumer.update({ imgFile: req.file.filename }, { where: { id: req.user.id } });
                return res.status(200).json({ status: "success", msg: "Image Uploaded Successfully" });
            }
        }

    })
})
module.exports = router;
