const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { ensureCrafterAuthenticated } = require("../middleware/auth");
const twilio = require('twilio')
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const Crafter = require('../models/Crafter');
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
    destination: './static/uploads/crafter',
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

// FOR EDITING CRAFTER PROFILE
router.post("/edit", ensureCrafterAuthenticated, body('name').isLength({ min: 1 }).withMessage("Name must be atleast 3 characters long"), body('mobileNo').isLength({ min: 10 }).withMessage("Mobile number must be 10 digits long"), body('city').isLength({ min: 3 }).withMessage("City must be atleast 3 charcters long"), body('district').isLength({ min: 3 }).withMessage("District must be three charcters long"),
    async (req, res) => {

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array()[0].msg });
            }
            const { name, mobileNo, city, district, bloodGroup } = req.body;
            const record = await Crafter.findOne({ raw: true, where: { mobileNo: mobileNo, id: { [Op.ne]: req.user.id } } });
            if (record) {
                return res.status(400).json({ errors: [{ msg: "Mobile Number already exists" }] });
            }
            await Crafter.update({
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

//FETCHING DATA FOR EDIT 
router.get("/edit", ensureCrafterAuthenticated, async (req, res) => {
    try {
      
        const record = await Crafter.findOne({ raw: true, where: { id: req.user.id } });

        return res.status(200).json({ status: "success", record: record });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Some Error Occured" });
    }
})

// FOR CRAFTER LOGIN VIA OTP
router.post('/login', body("mobileNo").isLength({ min: 10 }).withMessage("Mobile No must be of length 10"), async (req, res) => {

    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array()[0].msg });
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

// FOR VERIFICTION OF OTP
router.post("/otp-verify", body("otp").isLength({ min: 6 }).withMessage("OTP must be of length 6"), body("mobileNo").isLength({ min: 10 }).withMessage("Mobile No must be of length 10"), async (req, res) => {

    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array()[0].msg });
        }
        const temp = await client.verify.services(process.env.TWILIO_VERIFICATION_SID)
            .verificationChecks
            .create({ to: '+91' + req.body.mobileNo, code: req.body.otp });


        if (temp.status === "approved") {
            var crafter = await Crafter.findOne({ raw: true, where: { mobileNo: req.body.mobileNo } });
            if (!crafter) {
                var crafter = await Crafter.create({
                    mobileNo: req.body.mobileNo
                });
                await crafter.save();
            }

            const payload = {
                mobileNo: req.body.mobileNo,
                role: "crafter",
                id: crafter.id,
                isUpdate: crafter.isUpdate
            };
            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
                if (err) throw err;
                return res.status(200).json({ status: "success", token: token, role: "crafter", isUpdate: crafter.isUpdate });
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

// FOR IMAGE UPLOADING OF CRAFTER
router.post("/img", ensureCrafterAuthenticated, async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.log(err);
            return res.status(422).json({ msg: "Error in uploading image" });
        }
        else {
            if (req.file == undefined) {
                return res.status(422).json({ msg: "No file Selected" });
            }
            else {
                const crafter = await Crafter.findOne({ raw: true, where: { id: req.user.id } });
                if (crafter.imgFile) {
                    fs.unlink("./static/uploads/crafter" + crafter.imgFile, (err) => {
                        if (err) console.log(err);
                    });
                }
                await Crafter.update({ imgFile: req.file.filename }, { where: { id: req.user.id } });
                return res.status(200).json({ status: "success", msg: "Image Uploaded Successfully" });
            }
        }
    })

});
module.exports = router;





