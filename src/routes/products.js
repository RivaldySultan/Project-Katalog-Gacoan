import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db/db.js';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `product-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedFileTypes = /jpg|jpeg|png|webp|gif/;
        const ext = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
        const mime = allowedFileTypes.test(file.mimetype);

        if (ext && mime) {
            return cb(null, true);
        }
        cb(new Error('Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP'));
    }
});

const router = express.Router();

// GET all products
router.get('/', (req, res) => {
    const { categoryId, search, stockStatus } = req.query;
    const products = db.getProducts({ categoryId, search, stockStatus });

    res.json({
        success: true,
        count: products.length,
        data: products
    });
});

// GET product by ID
router.get('/:id', (req, res) => {
    const product = db.getProductById(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Produk tidak ditemukan',
        });
    }
    res.json({
        success: true,
        data: product
    });
});

// POST new product
router.post('/', authenticateToken, upload.single('photo'), (req, res) => {
    const { name, categoryId, price, stockStatus, description, imageUrl } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Nama produk wajib diisi' });
    }
    if (!categoryId) {
        return res.status(400).json({ success: false, message: 'Kategori Produk wajib dipilih' });
    }
    if (!price || isNaN(price) || Number(price) <= 0) {
        return res.status(400).json({ success: false, message: 'Harga harus berupa angka yang valid' });
    }
    if (!stockStatus || !['available', 'sold', 'preorder'].includes(stockStatus)) {
        return res.status(400).json({ success: false, message: 'Status stok tidak valid' });
    }

    let finalImage = imageUrl;
    if (req.file) {
        finalImage = `/uploads/${req.file.filename}`;
    }

    const newProduct = db.addProduct({
        name: name.trim(),
        categoryId,
        price: Number(price),
        stockStatus: stockStatus || 'Tersedia',
        description: description ? description.trim() : '',
        image: finalImage || ''
    });

    res.status(201).json({
        success: true,
        message: 'Produk berhasil ditambahkan',
        data: newProduct
    });
});

// PUT (Update) product
router.put('/:id', authenticateToken, upload.single('photo'), (req, res) => {
    const { id } = req.params;
    const { name, categoryId, price, stockStatus, description, imageUrl } = req.body;

    const existing = db.getProductById(id);
    if (!existing) {
        return res.status(404).json({
            success: false,
            message: 'Produk tidak ditemukan'
        });
    }

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (categoryId) updatePayload.categoryId = categoryId;
    if (price) updatePayload.price = Number(price);
    if (stockStatus) updatePayload.stockStatus = stockStatus;
    if (description) updatePayload.description = description.trim();

    if (req.file) {
        updatePayload.image = `/uploads/${req.file.filename}`;
    } else if (imageUrl !== undefined && imageUrl.trim()) {
        updatePayload.image = imageUrl.trim();
    }

    const updatedProduct = db.updateProduct(id, updatePayload);

    res.json({
        success: true,
        message: 'Produk berhasil diperbarui',
        data: updatedProduct
    });
});

// PATCH toggle stock status (admin protected)
router.patch('/:id/stock', authenticateToken, (req, res) => {
    const { id } = req.params;
    const update = db.toggleStock(id);

    if (!update) {
        return res.status(404).json({
            success: false,
            message: 'Produk tidak ditemukan'
        });
    }

    res.json({
        success: true,
        message: `Status stok diubah menjadi: ${update.stockStatus}`,
        data: update 
    });
});

// DELETE product (admin protected)
router.delete('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const deleted = db.deleteProduct(id);

    if (!deleted) {
        return res.status(404).json({
            success: false,
            message: 'Produk tidak ditemukan'
        });
    }

    res.json({
        success: true,
        message: 'Produk berhasil dihapus'
    });
});

export default router;