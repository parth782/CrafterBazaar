const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { ensureFarmerAuthenticated } = require("../middleware/auth");
const twilio = require('twilio')
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const Farmer = require('../models/Farmer');
const { Sequelize } = require("sequelize");
const Op = Sequelize.Op;




// IMAGE UPLOADING STEPS
var multer = require("multer");
var path = require("path");
var fs = require("fs");

// VALIDATING FILE EXTENSION
function checkFileType(file, cb, type) {
    const filetypes = type;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb("Error: Images Only!");
    }
}

// STORAGE DECIDE
var storage = multer.diskStorage({
    destination: './static/farmer',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

// UPLOAD FUNCTION
var upload = multer({
    storage: storage,
    limits: { fileSize: 10000000000 },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb, /jpeg|jpg|png|gif/);
    }
}).single("imgFile");








router.post("/edit", ensureFarmerAuthenticated, body('name').isLength({ min: 1 }).withMessage("Name must be atleast 3 characters long"), body('mobileNo').isLength({ min: 10 }).withMessage("Mobile number must be 10 digits long"), body('city').isLength({ min: 3 }).withMessage("City must be atleast 3 charcters long"), body('district').isLength({ min: 3 }).withMessage("District must be three charcters long"),
    async (req, res) => {

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { name, mobileNo, city, district, bloodGroup } = req.body;
            const record = await Farmer.findOne({ raw: true, where: { mobileNo: mobileNo, id: { [Op.ne]: req.user.id } } });
            if (record) {
                return res.status(400).json({ errors: [{ msg: "Mobile Number already exists" }] });
            }
            await Farmer.update({
                name: name,
                mobileNo: mobileNo,
                city: city,
                district: district,
                bloodGroup: bloodGroup,
                isUpdate: true
            }, { where: { id: req.user.id } });
            return res.status(200).json({ status: "success", msg: "Record Updated Successfully" });


        } catch (err) {
            console.error(err.message);
            res.status(500).send("Internal Server Error");
        }


    })
router.get("/edit", ensureFarmerAuthenticated, async (req, res) => {
    try {
        console.log(req.user.id);
        const record = await Farmer.findOne({ raw: true, where: { id: req.user.id } });

        return res.status(200).json({ status: "success", record: record });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
})

router.post('/login', body("mobileNo").isLength({ min: 10 }).withMessage("Mobile No must be of length 10"), async (req, res) => {

    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const status = await client.verify.services(process.env.TWILIO_VERIFICATION_SID)
            .verifications
            .create({ to: '+91' + req.body.mobileNo, channel: 'sms' })
            .then((verification) => {
                res.status(200).json({ status: "success", success: "OTP Sent Successfully" });
                return;
            });

        return;
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Internal Server Error");
    }
});

router.post("/otp-verify", body("otp").isLength({ min: 6 }).withMessage("OTP must be of length 6"), body("mobileNo").isLength({ min: 10 }).withMessage("Mobile No must be of length 10"), async (req, res) => {

    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const temp = await client.verify.services(process.env.TWILIO_VERIFICATION_SID)
            .verificationChecks
            .create({ to: '+91' + req.body.mobileNo, code: req.body.otp });


        if (temp.status === "approved") {
            var farmer = await Farmer.findOne({ raw: true, where: { mobileNo: req.body.mobileNo } });
            if (!farmer) {
                var farmer = await Farmer.create({
                    mobileNo: req.body.mobileNo
                });
                await farmer.save();
            }

            const payload = {
                mobileNo: req.body.mobileNo,
                role: "farmer",
                id: farmer.id,
                isUpdate: farmer.isUpdate
            };
            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
                if (err) throw err;
                return res.status(200).json({ status: "success", token: token, role: "farmer", isUpdate: farmer.isUpdate });
            });
        }
        else {
            return res.status(400).json({ errors: [{ msg: "Invalid OTP" }] });
        }
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Internal Server Error");
    }
})

router.post("/img", ensureFarmerAuthenticated, async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.log(err);
            return res.status(400).json({ errors: "Error in uploading image" });
        }
        else {
            if (req.file == undefined) {
                return res.status(400).json({ errors: "No file Selected" });
            }
            else {
                const farmer = await Farmer.findOne({ raw: true, where: { id: req.user.id } });
                if (farmer.imgFile) {
                    fs.unlink("./static/uploads/farmer" + farmer.imgFile, (err) => {
                        if (err) console.log(err);
                    });
                }
                await Farmer.update({ imgFile: req.file.filename }, { where: { id: req.user.id } });
                return res.status(200).json({ status: "success", msg: "Image Uploaded Successfully" });
            }
        }
    })

});
module.exports = router;





