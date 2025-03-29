const Product = require("../models/product.model.js");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const imagesDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

const getNextProductNumber = () => {
    const files = fs.readdirSync(imagesDir);
    const existingNumbers = files
        .map(file => {
            const match = file.match(/producto(\d+)\.webp/);
            return match ? parseInt(match[1], 10) : null;
        })
        .filter(num => num !== null);

    return existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
};


exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No se recibió ninguna imagen." });
        }
        let nextNumber = getNextProductNumber();
        const fileName = `producto${nextNumber}.webp`;
        const outputPath = path.join(imagesDir, fileName);
        await sharp(req.file.buffer).webp({ quality: 90 }).toFile(outputPath);
        return res.json({ success: true, imageUrl: `/uploads/${fileName}`, id: nextNumber });
    } catch (error) {
        console.error("Error al subir la imagen:", error);
        return res.status(500).json({ error: "Error al subir la imagen" });
    }
}


exports.createProduct = async (req, res) => {
    try {
        console.log("Datos recibidos:", req.body);

        const productData = {
            id: Number(req.body.id),
            image: String(req.body.image).trim(),
            name: String(req.body.name).trim(),
            description: String(req.body.description).trim(),
            price: String(req.body.price).trim(),
            isNew: Boolean(req.body.isNew),
            category: String(req.body.category).trim(),
            availability: Number(req.body.availability),
        };

        const newProduct = new Product(productData);
        await newProduct.save();

        res.status(201).json({ message: "Producto creado con éxito", product: newProduct });

    } catch (error) {
        console.error("Error en createProduct:", error);
        res.status(400).json({ error: error.message });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ id: -1 });

        res.json({ success: true, products });
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ error: "Error interno del servidor: " + error.message });
    }
};
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findOne({ id: id });
        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        if (req.file) {
            const fileName = `producto${product.id}.webp`;
            const outputPath = path.join(imagesDir, fileName);

            await sharp(req.file.buffer).webp({ quality: 80 }).toFile(outputPath);

            product.image = `/uploads/${fileName}`;
        }

        product.name = req.body.name || product.name;
        product.description = req.body.description || product.description;
        product.price = req.body.price || product.price;
        product.isNew = req.body.isNew === 'true' ? true : product.isNew;
        product.category = req.body.category || product.category;
        product.availability = req.body.availability || product.availability;

        await product.save();

        return res.json({ success: true, product });
    } catch (error) {
        console.error("Error al actualizar el producto:", error);
        return res.status(500).json({ error: "Error al actualizar el producto" });
    }
};
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar producto por id (si usas un campo "id" personalizado, usa { id })
        const product = await Product.findOne({ id: id });
        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        // Eliminar el producto
        await Product.deleteOne({ id: id });

        return res.json({ success: true, message: "Producto eliminado con éxito" });
    } catch (error) {
        console.error("Error al eliminar el producto:", error);
        return res.status(500).json({ error: "Error al eliminar el producto" });
    }
};
