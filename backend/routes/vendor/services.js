const express = require('express');
const router = express.Router();
const ServicePackage = require('../../models/ServicePackage');
const Booking = require('../../models/Booking');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');
router.use(authMiddleware);
router.use(roleMiddleware(['Vendor', 'Admin']));
// GET /api/vendor/services - Danh sách gói dịch vụ
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const query = { vendorId: req.user.vendorId };
    
    if (type) {
      query.type = type;
    }
    const services = await ServicePackage.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// GET /api/vendor/services/:id - Chi tiết gói
router.get('/:id', async (req, res) => {
  try {
    const service = await ServicePackage.findOne({ 
      _id: req.params.id,
      vendorId: req.user.vendorId 
    });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Gói dịch vụ không tồn tại' });
    }
    res.json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// POST /api/vendor/services - Tạo gói mới
router.post('/', async (req, res) => {
  try {
    const { name, type, pricePerUnit, description } = req.body;
    
    if (!['Menu', 'Decor'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type phải là Menu hoặc Decor' 
      });
    }
    const servicePackage = new ServicePackage({
      vendorId: req.user.vendorId,
      name,
      type,
      pricePerUnit,
      description: description || '',
    });
    await servicePackage.save();
    res.status(201).json({ success: true, data: servicePackage });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
// PUT /api/vendor/services/:id - Cập nhật gói
router.put('/:id', async (req, res) => {
  try {
    const { name, type, pricePerUnit, description } = req.body;
    
    const service = await ServicePackage.findOne({ 
      _id: req.params.id,
      vendorId: req.user.vendorId 
    });
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Gói dịch vụ không tồn tại' });
    }
    if (name) service.name = name;
    if (type) {
      if (!['Menu', 'Decor'].includes(type)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Type phải là Menu hoặc Decor' 
        });
      }
      service.type = type;
    }
    if (pricePerUnit !== undefined) service.pricePerUnit = pricePerUnit;
    if (description !== undefined) service.description = description;
    await service.save();
    res.json({ success: true, data: service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
// DELETE /api/vendor/services/:id - Xóa gói (hard delete)
router.delete('/:id', async (req, res) => {
  try {
    const service = await ServicePackage.findOne({ 
      _id: req.params.id,
      vendorId: req.user.vendorId 
    });
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Gói dịch vụ không tồn tại' });
    }
    // Kiểm tra có booking tương lai sử dụng gói này không
    const existingBooking = await Booking.findOne({
      'selectedPackages.packageId': service._id,
      weddingDate: { $gte: new Date() },
      status: { $nin: ['Canceled'] }
    });
    if (existingBooking) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể xóa gói dịch vụ đang được sử dụng trong booking tương lai' 
      });
    }
    await ServicePackage.findByIdAndDelete(service._id);
    
    res.json({ success: true, message: 'Xóa gói dịch vụ thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
module.exports = router;