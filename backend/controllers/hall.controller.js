/**
 * Hall — sảnh theo từng nhà hàng (restaurantId).
 */

const mongoose = require('mongoose');
const Hall = require('../models/Hall');
const Restaurant = require('../models/Restaurant');
const Booking = require('../models/Booking');
const { computeHallAvailabilitySlots } = require('../utils/hallAvailabilityRange');
const {
  uploadDiskFilesToCloudinary,
  safeUnlink,
} = require('./upload.controller');

/** Tối đa số ảnh lưu trên mỗi sảnh (đồng bộ với upload batch) */
const MAX_HALL_IMAGES = 20;

/**
 * Chuẩn hóa mảng ảnh từ body: chấp nhận `{ url, public_id }` hoặc chuỗi URL.
 */
function normalizeHallImages(images) {
  if (!Array.isArray(images)) return [];
  const out = [];
  for (const item of images) {
    if (out.length >= MAX_HALL_IMAGES) break;
    if (typeof item === 'string' && item.trim()) {
      out.push({ url: item.trim(), public_id: '' });
    } else if (item && typeof item === 'object' && typeof item.url === 'string' && item.url.trim()) {
      out.push({
        url: item.url.trim(),
        public_id: typeof item.public_id === 'string' ? item.public_id : '',
      });
    }
  }
  return out;
}

async function assertRestaurantOwned(restaurantId, vendorId) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) return null;
  return Restaurant.findOne({ _id: restaurantId, vendorId });
}

const create = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { restaurantId, name, capacity, area, basePrice, description, images, status } =
      req.body || {};

    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ success: false, message: 'Thiếu hoặc sai restaurantId.' });
    }
    const owned = await assertRestaurantOwned(restaurantId, vendorId);
    if (!owned) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhà hàng của bạn.' });
    }
    if (!name || typeof capacity !== 'number' || typeof basePrice !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Thiếu name, capacity hoặc basePrice (số).',
      });
    }

    const hall = await Hall.create({
      restaurantId,
      name: String(name).trim(),
      capacity,
      area: area !== undefined && area !== null ? Number(area) : undefined,
      basePrice,
      description: typeof description === 'string' ? description : '',
      images: normalizeHallImages(images),
      status: ['AVAILABLE', 'MAINTENANCE', 'LOCKED'].includes(status) ? status : 'AVAILABLE',
    });

    return res.status(201).json({
      success: true,
      message: 'Thêm sảnh thành công.',
      hall,
    });
  } catch (err) {
    console.error('hall.create:', err);
    return res.status(500).json({ success: false, message: 'Lỗi tạo sảnh.' });
  }
};

const list = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { restaurantId } = req.query;

    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Query bắt buộc: restaurantId.',
      });
    }

    const owned = await assertRestaurantOwned(restaurantId, vendorId);
    if (!owned) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhà hàng của bạn.' });
    }

    const halls = await Hall.find({ restaurantId, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, halls });
  } catch (err) {
    console.error('hall.list:', err);
    return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách sảnh.' });
  }
};

const update = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID sảnh không hợp lệ.' });
    }

    const hall = await Hall.findById(id);
    if (!hall || hall.isDeleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sảnh.' });
    }

    const owned = await assertRestaurantOwned(hall.restaurantId, vendorId);
    if (!owned) {
      return res.status(403).json({ success: false, message: 'Không có quyền sửa sảnh này.' });
    }

    const { name, capacity, area, basePrice, description, images, status } = req.body || {};
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (capacity !== undefined) updates.capacity = Number(capacity);
    if (area !== undefined) updates.area = area === null ? undefined : Number(area);
    if (basePrice !== undefined) updates.basePrice = Number(basePrice);
    if (description !== undefined) updates.description = String(description);
    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return res.status(400).json({ success: false, message: 'images phải là mảng.' });
      }
      updates.images = normalizeHallImages(images);
    }
    if (status !== undefined) {
      if (!['AVAILABLE', 'MAINTENANCE', 'LOCKED'].includes(status)) {
        return res.status(400).json({ success: false, message: 'status không hợp lệ.' });
      }
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'Không có dữ liệu cập nhật.' });
    }

    const updated = await Hall.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
    return res.json({ success: true, message: 'Cập nhật sảnh thành công.', hall: updated });
  } catch (err) {
    console.error('hall.update:', err);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật sảnh.' });
  }
};

const remove = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID sảnh không hợp lệ.' });
    }

    const hall = await Hall.findById(id);
    if (!hall || hall.isDeleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sảnh.' });
    }

    const owned = await assertRestaurantOwned(hall.restaurantId, vendorId);
    if (!owned) {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa sảnh này.' });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const future = await Booking.exists({
      hallId: id,
      status: { $nin: ['CANCELLED', 'REJECTED'] },
      bookingDate: { $gte: startOfToday },
    });

    if (future) {
      return res.status(409).json({
        success: false,
        message: 'Còn booking trong tương lai, không thể xóa sảnh.',
      });
    }

    hall.isDeleted = true;
    await hall.save();
    return res.json({ success: true, message: 'Đã xóa sảnh (xóa mềm).' });
  } catch (err) {
    console.error('hall.remove:', err);
    return res.status(500).json({ success: false, message: 'Lỗi xóa sảnh.' });
  }
};

/**
 * POST /api/vendor/halls/:id/images — multipart field `images`, upload Cloudinary và gắn vào sảnh.
 */
const uploadHallImages = async (req, res) => {
  const files = req.files || [];
  try {
    const vendorId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      for (const f of files) await safeUnlink(f.path);
      return res.status(400).json({ success: false, message: 'ID sảnh không hợp lệ.' });
    }
    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu file (multipart field: images).',
      });
    }

    const hall = await Hall.findById(id);
    if (!hall || hall.isDeleted) {
      for (const f of files) await safeUnlink(f.path);
      return res.status(404).json({ success: false, message: 'Không tìm thấy sảnh.' });
    }

    const owned = await assertRestaurantOwned(hall.restaurantId, vendorId);
    if (!owned) {
      for (const f of files) await safeUnlink(f.path);
      return res.status(403).json({ success: false, message: 'Không có quyền thêm ảnh sảnh này.' });
    }

    const current = Array.isArray(hall.images) ? hall.images : [];
    const remaining = MAX_HALL_IMAGES - current.length;
    if (remaining <= 0) {
      for (const f of files) await safeUnlink(f.path);
      return res.status(400).json({
        success: false,
        message: `Mỗi sảnh tối đa ${MAX_HALL_IMAGES} ảnh.`,
      });
    }

    const slice = files.slice(0, remaining);
    const rest = files.slice(remaining);
    for (const f of rest) await safeUnlink(f.path);

    const uploaded = await uploadDiskFilesToCloudinary(slice);
    hall.images = [...current, ...uploaded];
    await hall.save();

    return res.json({
      success: true,
      message: 'Đã thêm ảnh cho sảnh.',
      hall,
      added: uploaded,
    });
  } catch (err) {
    console.error('hall.uploadHallImages:', err);
    if (files.length) {
      for (const f of files) await safeUnlink(f.path);
    }
    return res.status(500).json({ success: false, message: 'Lỗi upload ảnh sảnh.' });
  }
};

/**
 * GET /api/vendor/halls/:id/availability-range?from=&days=
 * Lịch 2 ca (trống / hết) — cùng logic cổng khách, tối đa 14 ngày.
 */
const availabilityRange = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { id } = req.params;
    const { from: fromQ, days: daysQ } = req.query || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID sảnh không hợp lệ.' });
    }

    const hall = await Hall.findById(id).lean();
    if (!hall || hall.isDeleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sảnh.' });
    }

    const owned = await assertRestaurantOwned(hall.restaurantId, vendorId);
    if (!owned) {
      return res.status(403).json({ success: false, message: 'Không có quyền xem lịch sảnh này.' });
    }

    const { from, to, days, slots, hallBookable } = await computeHallAvailabilitySlots({
      hallId: id,
      hall,
      fromQ,
      daysQ,
      maxDays: 14,
    });

    return res.json({
      success: true,
      data: {
        hallId: id,
        hallName: hall.name,
        hallBookable,
        from,
        to,
        days,
        slots,
      },
    });
  } catch (err) {
    console.error('hall.availabilityRange:', err);
    return res.status(500).json({ success: false, message: 'Lỗi lấy lịch sảnh.' });
  }
};

module.exports = {
  create,
  list,
  update,
  remove,
  uploadHallImages,
  availabilityRange,
};
