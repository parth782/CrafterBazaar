const express = require("express");
const router = express.Router();
const { ensureCrafterAuthenticated } = require("../middleware/auth");
const Inventory = require('../models/Inventory');
var multer = require("multer");
const { body, validationResult } = require("express-validator");
var path = require("path");
var fs = require("fs");
const Crafter = require("../models/Crafter");


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

// MULTER STORAGE FOR FILES
var storage = multer.diskStorage({
    destination: './static/uploads/products',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

// MULTER FILE UPLOADING
var upload = multer({
    storage: storage,
    limits: { fileSize: 10000000000 },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb, /jpeg|jpg|png|gif/);
    },

});

// DELETING FILES ON ERROR
async function delete_on_err(path) {
    try {
        fs.unlink('./static/uploads/products' + path, (err) => {
            if (err) console.log(err);
        });
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}


// INVENTORY FOR HOMPEAGE
router.get("/all", async (req, res) => {
    try {
        const inventory = await Inventory.findAll({ nest: true, raw: true, include: Crafter, where: { isDeleted: false } });
        return res.status(200).json({ status: "success", inventory: inventory });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send({ msg: "Internal Server Error" });
    }
})


// INVENTORY APIS
router.get("/", ensureCrafterAuthenticated, async (req, res) => {
    try {
        const inventory = await Inventory.findAll({ raw: true, where: { crafterId: req.user.id, isDeleted: false } });
        return res.status(200).json({ status: "success", inventory: inventory });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send({ status:"fail",msg: "Internal Server Error" });
    }
});

// EDIT DATA CALL
router.get("/edit/:id", ensureCrafterAuthenticated, async (req, res) => {
    try {
        const inventory = await Inventory.findOne({ raw: true, where: { id: req.params.id, isDeleted: false } });
        return res.status(200).json({ status: "success", inventory: inventory });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ msg: "Internal Server Error" });
    }
});

// DELETE DATA
router.delete("/delete/:id", ensureCrafterAuthenticated, async (req, res) => {
    try {
        await Inventory.update({ isDeleted: true }, { where: { id: req.params.id } });
        return res.status(200).json({ status: "success", msg: "Record Deleted Successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ msg: "Internal Server Error" });
    }
});

// ADD DATA
router.post("/", ensureCrafterAuthenticated, upload.single("imgFile"), body("name").isLength({ min: 3 }).withMessage("must be at least 3 characters"), body("quantity").isInt({ min: 1 }).withMessage("Minimum 1 quantity should be there"), body("description").isLength({ min: 10 }).withMessage("must be at least 10 characters"), body("price").isFloat({ min: 100 }).withMessage("Minimum Price must be 100"), async (req, res) => {

    // Check for MulterError
    if (req.fileValidationError instanceof multer.MulterError) {
        if (req.fileValidationError.code === 'LIMIT_FILE_SIZE') {
            return res.status(422).json({ status: "fail", msg: 'File size exceeded' });
        }
        // Handle other multer errors if needed
        return res.status(422).json({ status: "fail", msg: 'File upload error' });
    } else if (req.fileValidationError) {
        // Handle other validation errors if needed
        return res.status(422).json({ status: "fail", msg: 'Validation error' });
    }
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            if (req.file != undefined) {
                await delete_on_err(req.file.filename);
            }
            return res.status(422).json({ status: "fail", msg: errors.array()[0].msg });
        }
        const { name, quantity, price, description } = req.body;
        const inventory = await Inventory.create({
            name: name,
            quantity: quantity,
            price: price,
            crafterId: req.user.id,
            description: description,
            imgFile: req.file != undefined ? req.file.filename : null,
        });
        await inventory.save();
        return res.status(200).json({ status: "success", msg: "Record Added Successfully" });
    } catch (err) {
        if (req.file != undefined) {
            await delete_on_err(req.file.filename);
        }
        console.error(err.message);
        res.status(500).send("Internal Server Error");
    }



})

// EDIT DATA FOR INVENTORY
router.post("/edit/:id", ensureCrafterAuthenticated, body("name").isLength({ min: 3 }).withMessage("must be at least 3 characters"), body("quantity").isInt({ min: 1 }).withMessage("Minimum 1 quantity should be there"), body("description").isLength({ min: 10 }).withMessage("must be at least 10 characters"), body("price").isFloat({ min: 100 }).withMessage("Minimum Price must be 100"), async (req, res) => {

    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ msg: errors.array()[0].msg });
        }
        const { name, quantity, price, description } = req.body;

        await Inventory.update({
            name: name,
            quantity: quantity,
            price: price,
            description: description,
        }, { where: { id: req.params.id, crafterId: req.user.id } });

        return res.status(200).json({ status: "success", msg: "Record Updated Successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: "Internal Server Error" });
    }



})

// INVENTORY MAIN IMAGE UPLOAD
router.post("/upload", ensureCrafterAuthenticated, upload.single("imgFile"), async (req, res) => {
    // Check for MulterError
    if (req.fileValidationError instanceof multer.MulterError) {
        if (req.fileValidationError.code === 'LIMIT_FILE_SIZE') {
            return res.status(422).json({ msg: 'File size exceeded' });
        }
        // Handle other multer errors if needed
        return res.status(422).json({ msg: 'File upload error' });
    } else if (req.fileValidationError) {
        // Handle other validation errors if needed
        return res.status(422).json({ msg: 'Validation error' });
    }

    try {
        const record = await Inventory.findOne({ raw: true, where: { id: req.header("invId"), crafterId: req.user.id } });
        await Inventory.update({
            imgFile: req.file != undefined ? req.file.filename : record.imgFile,
        }, { where: { id: req.header("invId"), crafterId: req.user.id } });
        if (req.file != undefined) {
            await delete_on_err(record.imgFile);
        }
        return res.status(200).json({ status: "success", msg: "Record Updated Successfully" });
    } catch (err) {
        if (req.file != undefined) {
            await delete_on_err(req.file.filename);
        }
        console.error(err.message);
        res.status(500).send({ msg: "Internal Server Error" });
    }
})



module.exports = router;
