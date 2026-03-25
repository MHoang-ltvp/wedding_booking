/**
 * Booking — Customer / Vendor / Admin
 */

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Restaurant = require('../models/Restaurant');
const Hall = require('../models/Hall');
const ServicePackage = require('../models/ServicePackage');

function startOfDay(d) {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}

function endOfDay(d) {
  const s = startOfDay(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 1);
  return e;
}

async function assertVendorOwnsBooking(vendorId, booking) {
  const rest = await Restaurant.findOne({
    _id: booking.restaurantId,
    vendorId,
  }).lean();
  return !!rest;
}

// ---- Customer ----

const create = async (req, res) => {
  try {
    const customerId = req.user._id;
    const {
      restaurantId,
      hallId,
      bookingDate,
      shift,
      services = [],
      customerNote,
    } = req.body || {};

    if (!restaurantId || !hallId || !bookingDate || !shift) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu restaurantId, hallId, bookingDate hoặc shift.',
      });
    }
    if (!['MORNING', 'EVENING'].includes(shift)) {
      return res.status(400).json({ success: false, message: 'shift không hợp lệ.' });
    }

    const restaurant = await Restaurant.findById(restaurantId).lean();
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhà hàng.' });
    }
    if (restaurant.approvalStatus !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Nhà hàng chưa được duyệt, không thể đặt.',
      });
    }
    if (restaurant.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Nhà hàng đang tạm ẩn khỏi cổng khách, không thể đặt chỗ.',
      });
    }

    const hall = await Hall.findOne({
      _id: hallId,
      restaurantId,
      isDeleted: false,
    }).lean();
    if (!hall) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sảnh.' });
    }
    if (hall.status !== 'AVAILABLE') {
      return res.status(400).json({ success: false, message: 'Sảnh không khả dụng.' });
    }

    const bd = new Date(bookingDate);
    const bdStart = startOfDay(bd);
    const todayStart = startOfDay(new Date());
    const diffDays = Math.round((bdStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays < 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể đặt ngày trong quá khứ.',
      });
    }
    if (diffDays > 13) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ được đặt trong vòng 14 ngày kể từ hôm nay (cùng ngày và 13 ngày tiếp theo).',
      });
    }

    const conflict = await Booking.findOne({
      hallId,
      bookingDate: { $gte: startOfDay(bd), $lt: endOfDay(bd) },
      shift,
      status: { $nin: ['CANCELLED', 'REJECTED'] },
    }).lean();
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'Sảnh đã có lịch vào ngày và ca này.',
      });
    }

    const lineServices = [];
    let servicesTotal = 0;

    if (Array.isArray(services) && services.length > 0) {
      for (const line of services) {
        const { packageId, quantity = 1 } = line || {};
        if (!packageId || !mongoose.Types.ObjectId.isValid(packageId)) {
          return res.status(400).json({ success: false, message: 'packageId không hợp lệ.' });
        }
        const pkg = await ServicePackage.findOne({
          _id: packageId,
          restaurantId,
          isDeleted: false,
        }).lean();
        if (!pkg) {
          return res.status(400).json({
            success: false,
            message: `Gói dịch vụ ${packageId} không thuộc nhà hàng.`,
          });
        }
        const q = Math.max(1, Number(quantity) || 1);
        const lineTotal = pkg.price * q;
        servicesTotal += lineTotal;
        lineServices.push({
          packageId: pkg._id,
          type: pkg.type,
          snapshotPrice: pkg.price,
          quantity: q,
        });
      }
    }

    const estimatedTotal = hall.basePrice + servicesTotal;
    const paidAt = new Date();

    /** Luồng đặt chỗ hiện tại: thanh toán trọn gói ngay (mock), chấp nhận nhà hàng ngay — không cọc / không bước xác minh thêm */
    const booking = await Booking.create({
      customerId,
      restaurantId,
      hallId,
      bookingDate: bd,
      shift,
      services: lineServices,
      customerNote: typeof customerNote === 'string' ? customerNote : '',
      estimatedTotal,
      vendorAccepted: true,
      paidInFull: true,
      paidAt,
      finalAmount: estimatedTotal,
      status: 'COMPLETED',
    });

    const populated = await Booking.findById(booking._id)
      .populate('restaurantId', 'name address')
      .populate('hallId', 'name basePrice images')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Đặt chỗ thành công — đã thanh toán và hoàn tất.',
      booking: populated,
    });
  } catch (err) {
    console.error('booking.create:', err);
    return res.status(500).json({ success: false, message: 'Lỗi tạo booking.' });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query || {};
    const filter = { customerId };
    if (status && ['PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(String(status).toUpperCase())) {
      filter.status = String(status).toUpperCase();
    }
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [total, items] = await Promise.all([
      Booking.countDocuments(filter),
      Booking.find(filter)
        .populate('restaurantId', 'name address')
        .populate('hallId', 'name basePrice images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
    ]);

    return res.json({
      success: true,
      page: safePage,
      limit: safeLimit,
      total,
      items,
    });
  } catch (err) {
    console.error('booking.getMyBookings:', err);
    return res.status(500).json({ success: false, message: 'Lỗi danh sách booking.' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ.' });
    }
    const booking = await Booking.findOne({
      _id: id,
      customerId: req.user._id,
    })
      .populate('restaurantId', 'name address contact')
      .populate('hallId', 'name capacity basePrice images')
      .lean();

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking.' });
    }
    return res.json({ success: true, booking });
  } catch (err) {
    console.error('booking.getById:', err);
    return res.status(500).json({ success: false, message: 'Lỗi chi tiết booking.' });
  }
};

const cancel = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ.' });
    }

    const booking = await Booking.findOne({ _id: id, customerId: req.user._id });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking.' });
    }
    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ hủy được khi đang chờ xử lý.',
      });
    }
    if (booking.paidInFull) {
      return res.status(400).json({
        success: false,
        message: 'Đã thanh toán đủ, không thể hủy qua ứng dụng.',
      });
    }

    booking.status = 'CANCELLED';
    booking.cancelReason = typeof cancelReason === 'string' ? cancelReason : '';
    await booking.save();

    return res.json({ success: true, message: 'Đã hủy booking.', booking });
  } catch (err) {
    console.error('booking.cancel:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hủy booking.' });
  }
};

const resubmit = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ.' });
    }

    const booking = await Booking.findOne({ _id: id, customerId: req.user._id });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking.' });
    }
    if (!['CANCELLED', 'REJECTED'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ gửi lại khi đã hủy hoặc bị từ chối.',
      });
    }

    if (body.restaurantId) booking.restaurantId = body.restaurantId;
    if (body.hallId) booking.hallId = body.hallId;
    if (body.bookingDate) booking.bookingDate = new Date(body.bookingDate);
    if (body.shift) booking.shift = body.shift;
    if (body.customerNote !== undefined) booking.customerNote = String(body.customerNote);
    booking.status = 'PENDING';
    booking.cancelReason = undefined;
    booking.rejectReason = undefined;

    const restaurantCheck = await Restaurant.findById(booking.restaurantId).lean();
    if (
      !restaurantCheck ||
      restaurantCheck.approvalStatus !== 'APPROVED' ||
      restaurantCheck.status !== 'ACTIVE'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Nhà hàng không khả dụng để gửi lại đặt chỗ.',
      });
    }

    booking.vendorAccepted = false;
    booking.paidInFull = false;
    booking.paidAt = undefined;
    booking.finalAmount = undefined;
    await booking.save();
    return res.json({ success: true, message: 'Đã gửi lại booking.', booking });
  } catch (err) {
    console.error('booking.resubmit:', err);
    return res.status(500).json({ success: false, message: 'Lỗi gửi lại booking.' });
  }
};

/**
 * POST /api/bookings/:id/confirm-payment — Khách xác nhận đã thanh toán trọn gói một lần (mock).
 */
const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ.' });
    }

    const booking = await Booking.findOne({ _id: id, customerId: req.user._id });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking.' });
    }
    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ thanh toán khi booking đang chờ xử lý.',
      });
    }
    if (!booking.vendorAccepted) {
      return res.status(400).json({
        success: false,
        message: 'Nhà hàng chưa chấp nhận đặt chỗ. Vui lòng chờ xác nhận.',
      });
    }
    if (booking.paidInFull) {
      return res.status(400).json({
        success: false,
        message: 'Đã ghi nhận thanh toán đủ.',
      });
    }
    const total = Number(booking.estimatedTotal);
    if (Number.isNaN(total) || total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Tổng tiền không hợp lệ.',
      });
    }

    booking.paidInFull = true;
    booking.paidAt = new Date();
    booking.finalAmount = total;
    booking.status = 'COMPLETED';
    await booking.save();

    return res.json({
      success: true,
      message: 'Đã ghi nhận thanh toán — đặt chỗ hoàn tất.',
      booking,
    });
  } catch (err) {
    console.error('booking.confirmPayment:', err);
    return res.status(500).json({ success: false, message: 'Lỗi xác nhận thanh toán.' });
  }
};

// ---- Vendor ----

const getVendorBookings = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { status, restaurantId, page = 1, limit = 20 } = req.query || {};

    const owned = await Restaurant.find({ vendorId }).select('_id').lean();
    const ids = owned.map((r) => r._id);
    if (ids.length === 0) {
      return res.json({
        success: true,
        page: 1,
        limit: 20,
        total: 0,
        items: [],
      });
    }

    const filter = { restaurantId: { $in: ids } };
    if (restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)) {
      if (!ids.some((x) => String(x) === String(restaurantId))) {
        return res.status(403).json({ success: false, message: 'Không thuộc nhà hàng của bạn.' });
      }
      filter.restaurantId = restaurantId;
    }
    if (status && ['PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(String(status).toUpperCase())) {
      filter.status = String(status).toUpperCase();
    }

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [total, items] = await Promise.all([
      Booking.countDocuments(filter),
      Booking.find(filter)
        .populate('customerId', 'email fullName phone')
        .populate('restaurantId', 'name address')
        .populate('hallId', 'name capacity basePrice images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
    ]);

    return res.json({
      success: true,
      page: safePage,
      limit: safeLimit,
      total,
      items,
    });
  } catch (err) {
    console.error('booking.getVendorBookings:', err);
    return res.status(500).json({ success: false, message: 'Lỗi danh sách booking nhà hàng.' });
  }
};

const approve = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ.' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking.' });
    }
    const ok = await assertVendorOwnsBooking(req.user._id, booking);
    if (!ok) {
      return res.status(403).json({ success: false, message: 'Không có quyền với booking này.' });
    }
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Booking không ở trạng thái chờ xử lý.' });
    }
    if (booking.vendorAccepted) {
      return res.status(400).json({
        success: false,
        message: 'Đặt chỗ đã được chấp nhận trước đó.',
      });
    }

    booking.vendorAccepted = true;
    await booking.save();

    return res.json({
      success: true,
      message: 'Đã chấp nhận đặt chỗ. Khách có thể thanh toán trọn gói một lần.',
      booking,
    });
  } catch (err) {
    console.error('booking.approve:', err);
    return res.status(500).json({ success: false, message: 'Lỗi chấp nhận booking.' });
  }
};

const reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectReason } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ.' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking.' });
    }
    const ok = await assertVendorOwnsBooking(req.user._id, booking);
    if (!ok) {
      return res.status(403).json({ success: false, message: 'Không có quyền với booking này.' });
    }
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Booking không ở trạng thái chờ xử lý.' });
    }
    if (booking.paidInFull) {
      return res.status(400).json({
        success: false,
        message: 'Đã thanh toán, không thể từ chối qua đây.',
      });
    }

    booking.status = 'REJECTED';
    booking.rejectReason = typeof rejectReason === 'string' ? rejectReason : '';
    await booking.save();

    return res.json({ success: true, message: 'Đã từ chối booking.', booking });
  } catch (err) {
    console.error('booking.reject:', err);
    return res.status(500).json({ success: false, message: 'Lỗi từ chối booking.' });
  }
};

const updateVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: nextStatus } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ.' });
    }
    if (nextStatus !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ hỗ trợ chuyển sang COMPLETED.',
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking.' });
    }
    const ok = await assertVendorOwnsBooking(req.user._id, booking);
    if (!ok) {
      return res.status(403).json({ success: false, message: 'Không có quyền với booking này.' });
    }
    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ hoàn thành khi booking đang chờ xử lý.',
      });
    }
    if (!booking.paidInFull) {
      return res.status(400).json({
        success: false,
        message: 'Khách chưa thanh toán đủ, không thể đánh dấu hoàn thành.',
      });
    }

    booking.status = 'COMPLETED';
    await booking.save();

    return res.json({ success: true, message: 'Đã đánh dấu hoàn thành.', booking });
  } catch (err) {
    console.error('booking.updateVendorStatus:', err);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái.' });
  }
};

// ---- Admin ----

const getAdminBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, restaurantId } = req.query || {};
    const filter = {};
    if (status && ['PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(String(status).toUpperCase())) {
      filter.status = String(status).toUpperCase();
    }
    if (restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)) {
      filter.restaurantId = restaurantId;
    }

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [total, items] = await Promise.all([
      Booking.countDocuments(filter),
      Booking.find(filter)
        .populate('customerId', 'email fullName phone role')
        .populate('restaurantId', 'name address approvalStatus')
        .populate('hallId', 'name capacity basePrice images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
    ]);

    return res.json({
      success: true,
      page: safePage,
      limit: safeLimit,
      total,
      items,
    });
  } catch (err) {
    console.error('booking.getAdminBookings:', err);
    return res.status(500).json({ success: false, message: 'Lỗi danh sách đặt chỗ.' });
  }
};

module.exports = {
  create,
  getMyBookings,
  getById,
  cancel,
  resubmit,
  confirmPayment,
  getVendorBookings,
  approve,
  reject,
  updateVendorStatus,
  getAdminBookings,
};
