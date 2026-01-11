const express = require('express');
const {
    getEquipment,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    deleteEquipment
} = require('../controllers/equipmentController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.route('/')
    .get(getEquipment)
    .post(protect, authorize('owner', 'admin'), upload.single('image'), createEquipment);

router.route('/:id')
    .get(getEquipmentById)
    .put(protect, authorize('owner', 'admin'), updateEquipment)
    .delete(protect, authorize('owner', 'admin'), deleteEquipment);

module.exports = router;
