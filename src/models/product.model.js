const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    image: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    isNew: { type: Boolean, default: false },
    category: { type: String, required: true },
    availability: { type: Number, required: true }
}, { suppressReservedKeysWarning: true });

module.exports = mongoose.model("Product", ProductSchema);
