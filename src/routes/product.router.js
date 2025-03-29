const express = require("express");
const multer = require("multer");
const { uploadImage, createProduct, getProducts, updateProduct, deleteProduct } = require("../controllers/product.controller.js");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });


router.post("/upload", upload.single("imagen"), uploadImage);
router.post("/save-product", upload.single("imagen"), createProduct);
router.delete("/delete-product/:id", deleteProduct);
router.get("/products", getProducts);
router.put("/products/:id", upload.single("image"), updateProduct);

module.exports = router;

