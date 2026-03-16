const express = require('express');
const router = express.Router();
const Hall = require('../../models/Hall');
const Booking = require('../../models/Booking');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
router.use(authMiddleware);
router.use(roleMiddleware(['Vendor', 'Admin']));
// GET /api/vendor/halls - Danh sách sảnh
router.get('/', async (req, res) => {
  try {
    const halls = await Hall.find({ vendorId: req.user.vendorId }).sort({ createdAt: -1 });
    res.json({ success: true, data: halls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// GET /api/vendor/halls/:id - Chi tiết sảnh
router.get('/:id', async (req, res) => {
  try {
    const hall = await Hall.findOne({ 
      _id: req.params.id,
      vendorId: req.user.vendorId 
    });
    if (!hall) {
      return res.status(404).json({ success: false, message: 'Sảnh không tồn tại' });
    }
    res.json({ success: true, data: hall });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// POST /api/vendor/halls - Tạo sảnh mới
router.post('/', async (req, res) => {
  try {
    const { name, capacity, basePrice, images, isVisible } = req.body;
    
    const hall = new Hall({
      vendorId: req.user.vendorId,
      name,
      capacity,
      basePrice,
      images: images || [],
      isVisible: isVisible !== undefined ? isVisible : true,
    });
    await hall.save();
    res.status(201).json({ success: true, data: hall });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
// PUT /api/vendor/halls/:id - Cập nhật sảnh
router.put('/:id', async (req, res) => {
  try {
    const { name, capacity, basePrice, images, isVisible } = req.body;
    
    const hall = await Hall.findOne({ 
      _id: req.params.id,
      vendorId: req.user.vendorId 
    });
    
    if (!hall) {
      return res.status(404).json({ success: false, message: 'Sảnh không tồn tại' });
    }
    if (name) hall.name = name;
    if (capacity) hall.capacity = capacity;
    if (basePrice !== undefined) hall.basePrice = basePrice;
    if (images) hall.images = images;
    if (isVisible !== undefined) hall.isVisible = isVisible;
    await hall.save();
    res.json({ success: true, data: hall });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
// DELETE /api/vendor/halls/:id - Xóa sảnh (hard delete)
router.delete('/:id', async (req, res) => {
  try {
    const hall = await Hall.findOne({ 
      _id: req.params.id,
      vendorId: req.user.vendorId 
    });
    
    if (!hall) {
      return res.status(404).json({ success: false, message: 'Sảnh không tồn tại' });
    }
    // Kiểm tra có booking tương lai không
    const existingBooking = await Booking.findOne({
      hallId: hall._id,
      weddingDate: { $gte: new Date() },
      status: { $nin: ['Canceled'] }
    });
    if (existingBooking) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể xóa sảnh có booking tương lai' 
      });
    }
    await Hall.findByIdAndDelete(hall._id);
    
    res.json({ success: true, message: 'Xóa sảnh thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
module.exports = router;