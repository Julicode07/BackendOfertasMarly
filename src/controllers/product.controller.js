const Product = require("../models/product.model.js");
const cloudinary = require("../config/cloudinary.config.js");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const imagesDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

async function getNextProductNumber() {
    try {
        let numbers = [];
        let nextCursor = null;

        do {
            const result = await cloudinary.api.resources({
                type: "upload",
                prefix: "ofertas-marly/producto",
                max_results: 500,  // Aumentamos el límite
                next_cursor: nextCursor, // Paginación
            });

            // Extraer números de los nombres de los productos
            const extractedNumbers = result.resources
                .map(file => {
                    const match = file.public_id.match(/producto(\d+)/);
                    return match ? parseInt(match[1], 10) : null;
                })
                .filter(num => num !== null);

            numbers = numbers.concat(extractedNumbers);
            nextCursor = result.next_cursor; // Obtener la siguiente página

        } while (nextCursor); // Si hay más imágenes, sigue paginando

        return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    } catch (error) {
        console.error("Error al obtener el siguiente número:", error);
        return 1;
    }
}


exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No se recibió ninguna imagen." });
        }

        const nextNumber = await getNextProductNumber(); // Corregido: ahora usa await
        const fileName = `producto${nextNumber}.webp`;

        cloudinary.uploader.upload_stream(
            {
                folder: "ofertas-marly",
                public_id: `producto${nextNumber}`,
                format: "webp",
                quality: 90
            },
            (error, result) => {
                if (error) {
                    console.error("Error en Cloudinary:", error);
                    return res.status(500).json({ error: "Error al subir la imagen" });
                }

                res.json({ success: true, imageUrl: result.secure_url, id: nextNumber });
            }
        ).end(req.file.buffer);
    } catch (error) {
        console.error("Error al subir la imagen:", error);
        return res.status(500).json({ error: "Error al subir la imagen" });
    }
};

exports.createProduct = async (req, res) => {
    try {
        console.log("Datos recibidos:", req.body);

        const productData = {
            id: Number(req.body.id),
            image: req.body.image?.trim() || "",
            name: req.body.name?.trim() || "",
            description: req.body.description?.trim() || "",
            price: req.body.price?.trim() || "",
            isNew: req.body.isNew === "true",
            category: req.body.category?.trim() || "",
            availability: Number(req.body.availability) || 0,
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
        const product = await Product.findOne({ id });

        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        if (req.file) {
            const cloudinaryResponse = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        folder: "ofertas-marly",
                        public_id: `producto${product.id}`,
                        format: "webp",
                        quality: 90,
                        overwrite: true
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                ).end(req.file.buffer);
            });

            product.image = cloudinaryResponse.secure_url;
        }

        product.name = req.body.name?.trim() || product.name;
        product.description = req.body.description?.trim() || product.description;
        product.price = req.body.price?.trim() || product.price;
        product.isNew = req.body.isNew === "true" ? true : product.isNew;
        product.category = req.body.category?.trim() || product.category;
        product.availability = req.body.availability?.trim() || product.availability;

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
        const product = await Product.findOne({ id });

        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        await Product.deleteOne({ id });

        return res.json({ success: true, message: "Producto eliminado con éxito" });
    } catch (error) {
        console.error("Error al eliminar el producto:", error);
        return res.status(500).json({ error: "Error al eliminar el producto" });
    }
};
