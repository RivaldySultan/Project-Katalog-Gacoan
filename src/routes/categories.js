import express from 'express';
import {db} from '../db/db.js';
import {authenticateToken} from '../middleware/auth.js';

const router = express.Router();

//GET all categories (public)
router.get('/', (req,res) => {
    const categories = db.getCategories();
    res.json({
        success: true,
        data: categories
    });
});

//POST Create Category
router.post('/',authenticateToken, (req,res) => {
    const { name } = req.body;
    if (!name || !name.trim()){
        return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi'});
    }

//Check duplicate
    const existing = db.getCategories().find(c => c.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) {
    return res.status(400).json({success: false,message: 'Kategori dengan nama tersebut sudah ada'});
    }

    try{
        const newCat = db.addCategory(name.trim());
        res.status(201).json({
            success: true,
            message: 'Kategori berhasil ditambahkan',
            data: newCat
        });
    } catch (err){
        res.status(400).json({ success: false, message: err.message});
    }

//PUT Update
router.put('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()){
        return res.status(400).json({
            succes: false,
            message: "Category name is required",
        });
    }
    try {
        const updated = db.updatedCategory(id,name.trim());
        if (!updated){
            return res.status(400).json({
                succes: false,
                message: "category not found",
            });
        }
        res.json({
            succes: true,
            data: updated,
            message: "Update category succesful",
        });
    } catch (err){
        res.status(400).json({
            success: false,
            message: err.message,
        })
    }
})
});

//Delete

router.delete('/:id', authenticateToken, (re1, res) =>{
    const { id } = req.params;
    const products = db.getProducts ({ categoryId: id});

    if (product.length > 0){
        return res.status(400).json({
            succes: false,
            message: `Tidak dapat menghapus kategori karena  masih memiliki ${products.length} produk terkait. Hapus atau pindahkan produk terlebih dahulu.`
        });
    }

    const deleted = db.deleteCategory(id);
    if (!deleted) {
        return res.status(404).json({ succes: false, message: 'Kategori tidak ditemukan'});
    }

    res.json({
        succes: true,
        message: 'Kategori berhasil dihapus'
    });
});

export default router;