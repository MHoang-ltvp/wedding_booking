/**
 * Service (ServicePackage) — gói theo từng nhà hàng (restaurantId).
 * Vendor chỉ thao tác trên gói thuộc nhà hàng của mình.
 */

const mongoose = require('mongoose');
const ServicePackage = require('../models/ServicePackage');
const Restaurant = require('../models/Restaurant');

async function assertRestaurantOwned(restaurantId, vendorId) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) return null;
  return Restaurant.findOne({ _id: restaurantId, vendorId });
}

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

/** FOOD → bàn (TABLE), DECORATION → gói (PACKAGE) — không cần gửi unit từ client */
function unitFromType(type) {
  return type === 'FOOD' ? 'TABLE' : 'PACKAGE';
}

// POST /api/vendor/services
const create = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const {
      restaurantId,
      name,
      type,
      price,
      items,
      description,
      images,
    } = req.body || {};

    if (!restaurantId || !isNonEmptyString(name) || !type || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu restaurantId, name, type hoặc price.',
      });
    }

    const owned = await assertRestaurantOwned(restaurantId, vendorId);
    if (!owned) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà hàng của bạn.',
      });
    }

    if (!['FOOD', 'DECORATION'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'type không hợp lệ (FOOD hoặc DECORATION).',
      });
    }

    const unit = unitFromType(type);

    const servicePackage = await ServicePackage.create({
      restaurantId,
      name: name.trim(),
      type,
      unit,
      price: Number(price),
      items: Array.isArray(items) ? items : [],
      description: typeof description === 'string' ? description : '',
      images: Array.isArray(images) ? images : [],
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo gói dịch vụ thành công.',
      servicePackage,
    });
  } catch (err) {
    console.error('service.create:', err);
    return res.status(500).json({ success: false, message: 'Lỗi tạo gói dịch vụ.' });
  }
};

// GET /api/vendor/services?restaurantId=
const list = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { restaurantId, type } = req.query;

    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Query bắt buộc: restaurantId (ID nhà hàng).',
      });
    }

    const owned = await assertRestaurantOwned(restaurantId, vendorId);
    if (!owned) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà hàng của bạn.',
      });
    }

    const filter = {
      restaurantId,
      isDeleted: false,
    };
    if (type && ['FOOD', 'DECORATION'].includes(String(type).toUpperCase())) {
      filter.type = String(type).toUpperCase();
    }

    const services = await ServicePackage.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, services });
  } catch (err) {
    console.error('service.list:', err);
    return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách gói.' });
  }
};

// PUT /api/vendor/services/:id
const update = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ.' });
    }

    const pkg = await ServicePackage.findOne({ _id: id, isDeleted: false });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy gói dịch vụ.' });
    }

    const owned = await assertRestaurantOwned(pkg.restaurantId, vendorId);
    if (!owned) {
      return res.status(403).json({ success: false, message: 'Không có quyền sửa gói này.' });
    }

    const { name, type, price, items, description, images } = req.body || {};
    const updates = {};
    if (name !== undefined) {
      if (!isNonEmptyString(name)) {
        return res.status(400).json({ success: false, message: 'name không được rỗng.' });
      }
      updates.name = name.trim();
    }
    if (type !== undefined) {
      if (!['FOOD', 'DECORATION'].includes(type)) {
        return res.status(400).json({ success: false, message: 'type không hợp lệ.' });
      }
      updates.type = type;
      updates.unit = unitFromType(type);
    }
    if (price !== undefined) updates.price = Number(price);
    if (items !== undefined) {
      if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, message: 'items phải là mảng.' });
      }
      updates.items = items;
    }
    if (description !== undefined) updates.description = String(description);
    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return res.status(400).json({ success: false, message: 'images phải là mảng.' });
      }
      updates.images = images;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'Không có dữ liệu cập nhật.' });
    }

    Object.assign(pkg, updates);
    await pkg.save();
    return res.json({
      success: true,
      message: 'Cập nhật thành công.',
      servicePackage: pkg,
    });
  } catch (err) {
    console.error('service.update:', err);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật gói.' });
  }
};

// DELETE /api/vendor/services/:id
const remove = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ.' });
    }

    const pkg = await ServicePackage.findOne({ _id: id, isDeleted: false });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy gói dịch vụ.' });
    }

    const owned = await assertRestaurantOwned(pkg.restaurantId, vendorId);
    if (!owned) {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa gói này.' });
    }

    pkg.isDeleted = true;
    await pkg.save();
    return res.json({ success: true, message: 'Đã xóa gói (xóa mềm).' });
  } catch (err) {
    console.error('service.remove:', err);
    return res.status(500).json({ success: false, message: 'Lỗi xóa gói.' });
  }
};

module.exports = {
  create,
  list,
  update,
  remove,
};
