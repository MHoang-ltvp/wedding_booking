/**
 * Restaurant Controller - Thành viên 2 (VHoang)
 * Vendor - Restaurant Management + Admin - Approval (danh sách nhà hàng)
 *
 * Nghiệp vụ: một VENDOR có thể có nhiều Restaurant (vendorId không unique).
 * GET /me trả về mảng `restaurants`.
 */

const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const Hall = require("../models/Hall");

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const normalizeContact = (contact = {}) => {
  if (!contact || typeof contact !== "object") return undefined;
  const result = {};
  if (typeof contact.name === "string") result.name = contact.name.trim();
  if (typeof contact.phone === "string") result.phone = contact.phone.trim();
  if (typeof contact.email === "string")
    result.email = contact.email.trim().toLowerCase();
  return result;
};

// POST /api/vendor/restaurants - Tạo một hồ sơ nhà hàng mới
const create = async (req, res) => {
  try {
    const vendorId = req.user?._id;
    if (!vendorId)
      return res
        .status(401)
        .json({ success: false, message: "Vui lòng đăng nhập." });

    const { name, address, description, contact, images, status } =
      req.body || {};

    if (!isNonEmptyString(name) || !isNonEmptyString(address)) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu name hoặc address." });
    }

    const restaurant = await Restaurant.create({
      vendorId,
      name: name.trim(),
      address: address.trim(),
      description: typeof description === "string" ? description.trim() : "",
      contact: normalizeContact(contact),
      images: Array.isArray(images) ? images : [],
      approvalStatus: "PENDING",
      status: status === "HIDDEN" ? "HIDDEN" : "ACTIVE",
    });

    return res.status(201).json({
      success: true,
      message: "Tạo hồ sơ nhà hàng thành công.",
      restaurant,
    });
  } catch (err) {
    console.error("restaurant.create error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi tạo hồ sơ nhà hàng." });
  }
};

// PUT /api/vendor/restaurants/:id - Cập nhật thông tin nhà hàng
const update = async (req, res) => {
  try {
    const vendorId = req.user?._id;
    if (!vendorId)
      return res
        .status(401)
        .json({ success: false, message: "Vui lòng đăng nhập." });

    const restaurantId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res
        .status(400)
        .json({ success: false, message: "Restaurant id không hợp lệ." });
    }

    const { name, address, description, contact, images, status } =
      req.body || {};
    const updates = {};

    if (name !== undefined) {
      if (!isNonEmptyString(name))
        return res
          .status(400)
          .json({ success: false, message: "name không được rỗng." });
      updates.name = name.trim();
    }
    if (address !== undefined) {
      if (!isNonEmptyString(address)) {
        return res
          .status(400)
          .json({ success: false, message: "address không được rỗng." });
      }
      updates.address = address.trim();
    }
    if (description !== undefined) {
      updates.description =
        typeof description === "string" ? description.trim() : "";
    }
    if (contact !== undefined) {
      const normalized = normalizeContact(contact);
      if (normalized) {
        if (normalized.name !== undefined)
          updates["contact.name"] = normalized.name;
        if (normalized.phone !== undefined)
          updates["contact.phone"] = normalized.phone;
        if (normalized.email !== undefined)
          updates["contact.email"] = normalized.email;
      }
    }
    if (images !== undefined) {
      if (!Array.isArray(images))
        return res
          .status(400)
          .json({ success: false, message: "images phải là mảng." });
      updates.images = images;
    }
    if (status !== undefined) {
      const allowed = ["ACTIVE", "HIDDEN"];
      if (!allowed.includes(status)) {
        return res
          .status(400)
          .json({
            success: false,
            message: "status không hợp lệ (ACTIVE|HIDDEN).",
          });
      }
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Không có dữ liệu cập nhật." });
    }

    const restaurant = await Restaurant.findOneAndUpdate(
      { _id: restaurantId, vendorId },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!restaurant) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Không tìm thấy nhà hàng của vendor.",
        });
    }

    return res.json({
      success: true,
      message: "Cập nhật nhà hàng thành công.",
      restaurant,
    });
  } catch (err) {
    console.error("restaurant.update error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi cập nhật nhà hàng." });
  }
};

// GET /api/vendor/restaurants/me - Danh sách nhà hàng của Vendor đang đăng nhập
const getMyRestaurant = async (req, res) => {
  try {
    const vendorId = req.user?._id;
    if (!vendorId)
      return res
        .status(401)
        .json({ success: false, message: "Vui lòng đăng nhập." });

    const restaurants = await Restaurant.find({ vendorId })
      .sort({
        createdAt: -1,
      })
      .lean();

    const ids = restaurants.map((r) => r._id);
    const hallCounts =
      ids.length === 0
        ? []
        : await Hall.aggregate([
            {
              $match: {
                restaurantId: { $in: ids },
                isDeleted: false,
              },
            },
            { $group: { _id: "$restaurantId", count: { $sum: 1 } } },
          ]);
    const countMap = Object.fromEntries(
      hallCounts.map((c) => [String(c._id), c.count]),
    );

    const restaurantsWithCounts = restaurants.map((r) => ({
      ...r,
      hallCount: countMap[String(r._id)] || 0,
    }));

    return res.json({ success: true, restaurants: restaurantsWithCounts });
  } catch (err) {
    console.error("restaurant.getMyRestaurant error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi lấy thông tin nhà hàng." });
  }
};

// GET /api/admin/restaurants - Danh sách toàn bộ nhà hàng, lọc theo trạng thái duyệt
const getAdminRestaurants = async (req, res) => {
  try {
    const {
      approvalStatus,
      status,
      vendorId,
      search,
      page = 1,
      limit = 10,
    } = req.query || {};

    const filter = {};

    if (approvalStatus !== undefined) {
      const allowed = ["PENDING", "APPROVED", "REJECTED"];
      if (!allowed.includes(approvalStatus)) {
        return res
          .status(400)
          .json({ success: false, message: "approvalStatus không hợp lệ." });
      }
      filter.approvalStatus = approvalStatus;
    }

    if (status !== undefined) {
      const allowed = ["ACTIVE", "HIDDEN"];
      if (!allowed.includes(status))
        return res
          .status(400)
          .json({ success: false, message: "status không hợp lệ." });
      filter.status = status;
    }

    if (vendorId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(vendorId)) {
        return res
          .status(400)
          .json({ success: false, message: "vendorId không hợp lệ." });
      }
      filter.vendorId = vendorId;
    }

    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { address: { $regex: q, $options: "i" } },
      ];
    }

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [total, items] = await Promise.all([
      Restaurant.countDocuments(filter),
      Restaurant.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .populate("vendorId", "email fullName phone role status"),
    ]);

    return res.json({
      success: true,
      page: safePage,
      limit: safeLimit,
      total,
      items,
    });
  } catch (err) {
    console.error("restaurant.getAdminRestaurants error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi lấy danh sách nhà hàng." });
  }
};

// PUT /api/admin/restaurants/:id/approval — Duyệt / từ chối hồ sơ nhà hàng
const setAdminRestaurantApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID nhà hàng không hợp lệ." });
    }
    if (!["PENDING", "APPROVED", "REJECTED"].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: "approvalStatus phải là PENDING, APPROVED hoặc REJECTED.",
      });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      { approvalStatus },
      { new: true },
    ).populate("vendorId", "email fullName phone role");

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nhà hàng." });
    }

    return res.json({
      success: true,
      message: "Đã cập nhật trạng thái duyệt.",
      restaurant,
    });
  } catch (err) {
    console.error("restaurant.setAdminRestaurantApproval error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi cập nhật duyệt nhà hàng." });
  }
};

// GET /api/vendor/restaurants/:id — Chi tiết một nhà hàng (của vendor)
const getById = async (req, res) => {
  try {
    const vendorId = req.user?._id;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID nhà hàng không hợp lệ.' });
    }

    const restaurant = await Restaurant.findOne({ _id: id, vendorId }).lean();
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhà hàng.' });
    }

    const hallCount = await Hall.countDocuments({
      restaurantId: id,
      isDeleted: false,
    });

    return res.json({
      success: true,
      restaurant: { ...restaurant, hallCount },
    });
  } catch (err) {
    console.error('restaurant.getById:', err);
    return res.status(500).json({ success: false, message: 'Lỗi lấy nhà hàng.' });
  }
};

module.exports = {
  create,
  update,
  getMyRestaurant,
  getById,
  getAdminRestaurants,
  setAdminRestaurantApproval,
};
