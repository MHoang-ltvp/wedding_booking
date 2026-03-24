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
const ServicePackage = require("../models/ServicePackage");
const Booking = require("../models/Booking");

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const normalizeContact = (contact = {}) => {
  if (!contact || typeof contact !== "object") return undefined;
  const result = {};
  /** Không còn nhập tên/bộ phận trên form — luôn lưu rỗng để xóa dữ liệu cũ khi cập nhật */
  result.name =
    typeof contact.name === "string" ? contact.name.trim() : "";
  if (typeof contact.phone === "string") result.phone = contact.phone.trim();
  if (typeof contact.email === "string")
    result.email = contact.email.trim().toLowerCase();
  return result;
};

const normalizeAddressDetail = (addressDetail = {}) => {
  if (!addressDetail || typeof addressDetail !== "object") return null;
  const provinceCode = String(addressDetail.provinceCode ?? "").trim();
  const provinceName = String(addressDetail.provinceName ?? "").trim();
  const districtCode = String(addressDetail.districtCode ?? "").trim();
  const districtName = String(addressDetail.districtName ?? "").trim();
  const wardCode = String(addressDetail.wardCode ?? "").trim();
  const wardName = String(addressDetail.wardName ?? "").trim();
  const street = String(addressDetail.street ?? "").trim();
  if (
    !provinceCode ||
    !provinceName ||
    !districtCode ||
    !districtName ||
    !wardCode ||
    !wardName ||
    !street
  ) {
    return null;
  }
  return {
    provinceCode,
    provinceName,
    districtCode,
    districtName,
    wardCode,
    wardName,
    street,
  };
};

const buildFullAddress = (detail) => {
  const line1 = String(detail.street ?? "").trim();
  return `${line1}, ${detail.wardName}, ${detail.districtName}, ${detail.provinceName}`;
};

// POST /api/vendor/restaurants - Tạo một hồ sơ nhà hàng mới
const create = async (req, res) => {
  try {
    const vendorId = req.user?._id;
    if (!vendorId)
      return res
        .status(401)
        .json({ success: false, message: "Vui lòng đăng nhập." });

    const {
      name,
      address,
      addressDetail,
      description,
      contact,
      images,
      status,
    } =
      req.body || {};

    const normalizedAddressDetail = normalizeAddressDetail(addressDetail);
    const addressText = normalizedAddressDetail
      ? buildFullAddress(normalizedAddressDetail)
      : isNonEmptyString(address)
      ? address.trim()
      : "";

    if (!isNonEmptyString(name) || !isNonEmptyString(addressText)) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Thiếu name hoặc địa chỉ. Hãy chọn tỉnh/quận/phường và nhập tên đường (số nhà nên điền đầy đủ).",
        });
    }

    const restaurant = await Restaurant.create({
      vendorId,
      name: name.trim(),
      address: addressText,
      addressDetail: normalizedAddressDetail || undefined,
      description: typeof description === "string" ? description.trim() : "",
      contact: normalizeContact(contact),
      images: Array.isArray(images) ? images : [],
      approvalStatus: "DRAFT",
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

    const {
      name,
      address,
      addressDetail,
      description,
      contact,
      images,
      status,
    } =
      req.body || {};
    const updates = {};

    const currentRestaurant = await Restaurant.findOne({ _id: restaurantId, vendorId }).lean();
    if (!currentRestaurant) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Không tìm thấy nhà hàng của vendor.",
        });
    }
    if (currentRestaurant.approvalStatus === "PENDING") {
      return res.status(409).json({
        success: false,
        message: "Nhà hàng đang chờ duyệt, không thể chỉnh sửa.",
      });
    }

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
    if (addressDetail !== undefined) {
      const normalizedAddressDetail = normalizeAddressDetail(addressDetail);
      if (!normalizedAddressDetail) {
        return res.status(400).json({
          success: false,
          message:
            "addressDetail không hợp lệ. Cần đủ tỉnh/quận/phường và tên đường (số nhà khuyến nghị có).",
        });
      }
      updates.addressDetail = normalizedAddressDetail;
      updates.address = buildFullAddress(normalizedAddressDetail);
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
    const [hallCounts, menuCounts] =
      ids.length === 0
        ? [[], []]
        : await Promise.all([
            Hall.aggregate([
              {
                $match: {
                  restaurantId: { $in: ids },
                  isDeleted: false,
                },
              },
              { $group: { _id: "$restaurantId", count: { $sum: 1 } } },
            ]),
            ServicePackage.aggregate([
              {
                $match: {
                  restaurantId: { $in: ids },
                  isDeleted: false,
                  type: "FOOD",
                },
              },
              { $group: { _id: "$restaurantId", count: { $sum: 1 } } },
            ]),
          ]);
    const hallCountMap = Object.fromEntries(
      hallCounts.map((c) => [String(c._id), c.count]),
    );
    const menuCountMap = Object.fromEntries(
      menuCounts.map((c) => [String(c._id), c.count]),
    );

    const restaurantsWithCounts = restaurants.map((r) => ({
      ...r,
      hallCount: hallCountMap[String(r._id)] || 0,
      menuCount: menuCountMap[String(r._id)] || 0,
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

    if (approvalStatus !== undefined && approvalStatus !== "") {
      const allowed = ["DRAFT", "PENDING", "APPROVED", "REJECTED"];
      if (!allowed.includes(approvalStatus)) {
        return res
          .status(400)
          .json({ success: false, message: "approvalStatus không hợp lệ." });
      }
      filter.approvalStatus = approvalStatus;
    } else {
      // Admin chỉ thấy hồ sơ đã gửi duyệt hoặc đã xử lý; không hiển thị DRAFT.
      filter.approvalStatus = { $ne: "DRAFT" };
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
const MAX_REJECTION_REASON_LEN = 2000;

const setAdminRestaurantApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus, rejectionReason } = req.body || {};

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

    const update = { approvalStatus };
    if (approvalStatus === "REJECTED") {
      const text =
        typeof rejectionReason === "string" ? rejectionReason.trim() : "";
      if (text.length > MAX_REJECTION_REASON_LEN) {
        return res.status(400).json({
          success: false,
          message: `Lý do từ chối tối đa ${MAX_REJECTION_REASON_LEN} ký tự.`,
        });
      }
      update.rejectionReason = text;
    } else {
      update.rejectionReason = "";
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      update,
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

    const [hallCount, menuCount] = await Promise.all([
      Hall.countDocuments({
        restaurantId: id,
        isDeleted: false,
      }),
      ServicePackage.countDocuments({
        restaurantId: id,
        isDeleted: false,
        type: "FOOD",
      }),
    ]);

    return res.json({
      success: true,
      restaurant: { ...restaurant, hallCount, menuCount },
    });
  } catch (err) {
    console.error('restaurant.getById:', err);
    return res.status(500).json({ success: false, message: 'Lỗi lấy nhà hàng.' });
  }
};

// GET /api/admin/restaurants/:id — Chi tiết nhà hàng cho admin (kèm sảnh + menu)
const getAdminRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID nhà hàng không hợp lệ." });
    }

    const restaurant = await Restaurant.findById(id)
      .populate("vendorId", "email fullName phone role status")
      .lean();
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Không tìm thấy nhà hàng." });
    }
    if (restaurant.approvalStatus === "DRAFT") {
      return res.status(404).json({
        success: false,
        message: "Nhà hàng chưa gửi duyệt nên admin chưa thể xem chi tiết.",
      });
    }

    const [halls, services] = await Promise.all([
      Hall.find({ restaurantId: id, isDeleted: false })
        .sort({ createdAt: -1 })
        .lean(),
      ServicePackage.find({ restaurantId: id, isDeleted: false })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return res.json({
      success: true,
      restaurant,
      halls,
      services,
    });
  } catch (err) {
    console.error("restaurant.getAdminRestaurantById:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi lấy chi tiết nhà hàng." });
  }
};

// PUT /api/vendor/restaurants/:id/submit-approval
const submitForApproval = async (req, res) => {
  try {
    const vendorId = req.user?._id;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Vui lòng đăng nhập." });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID nhà hàng không hợp lệ." });
    }

    const restaurant = await Restaurant.findOne({ _id: id, vendorId });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Không tìm thấy nhà hàng." });
    }
    if (restaurant.approvalStatus === "PENDING") {
      return res.status(409).json({
        success: false,
        message: "Nhà hàng đã gửi duyệt và đang chờ admin xử lý.",
      });
    }
    if (!isNonEmptyString(restaurant.name) || !isNonEmptyString(restaurant.address)) {
      return res.status(400).json({
        success: false,
        message: "Nhà hàng thiếu thông tin tên hoặc địa chỉ.",
      });
    }

    const [hallCount, menuCount] = await Promise.all([
      Hall.countDocuments({ restaurantId: id, isDeleted: false }),
      ServicePackage.countDocuments({
        restaurantId: id,
        isDeleted: false,
        type: "FOOD",
      }),
    ]);

    if (hallCount < 1 || menuCount < 1) {
      return res.status(400).json({
        success: false,
        message:
          "Cần tối thiểu 1 sảnh và 1 menu (FOOD) trước khi gửi duyệt.",
        requirements: {
          minHalls: 1,
          minMenus: 1,
          hallCount,
          menuCount,
        },
      });
    }

    restaurant.approvalStatus = "PENDING";
    restaurant.rejectionReason = "";
    await restaurant.save();

    return res.json({
      success: true,
      message: "Đã gửi hồ sơ nhà hàng để admin duyệt.",
      restaurant,
    });
  } catch (err) {
    console.error("restaurant.submitForApproval:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi gửi duyệt nhà hàng." });
  }
};

// PUT /api/vendor/restaurants/:id/withdraw-approval — Thu hồi hồ sơ đang chờ duyệt (PENDING → DRAFT) để chỉnh sửa
const withdrawApproval = async (req, res) => {
  try {
    const vendorId = req.user?._id;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Vui lòng đăng nhập." });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "ID nhà hàng không hợp lệ." });
    }

    const restaurant = await Restaurant.findOne({ _id: id, vendorId });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Không tìm thấy nhà hàng." });
    }
    if (restaurant.approvalStatus !== "PENDING") {
      return res.status(409).json({
        success: false,
        message: "Chỉ thu hồi được khi hồ sơ đang chờ duyệt.",
      });
    }

    restaurant.approvalStatus = "DRAFT";
    restaurant.rejectionReason = "";
    await restaurant.save();

    return res.json({
      success: true,
      message: "Đã thu hồi hồ sơ. Bạn có thể chỉnh sửa và gửi duyệt lại.",
      restaurant,
    });
  } catch (err) {
    console.error("restaurant.withdrawApproval:", err);
    return res.status(500).json({ success: false, message: "Lỗi thu hồi hồ sơ." });
  }
};

/**
 * DELETE /api/vendor/restaurants/:id — Xóa nhà hàng (chỉ của vendor), khi chưa có booking nào.
 */
const remove = async (req, res) => {
  try {
    const vendorId = req.user?._id;
    if (!vendorId) {
      return res
        .status(401)
        .json({ success: false, message: "Vui lòng đăng nhập." });
    }

    const restaurantId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res
        .status(400)
        .json({ success: false, message: "Restaurant id không hợp lệ." });
    }

    const owned = await Restaurant.findOne({ _id: restaurantId, vendorId });
    if (!owned) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhà hàng của bạn.",
      });
    }

    const bookingCount = await Booking.countDocuments({ restaurantId });
    if (bookingCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Không thể xóa nhà hàng đã có lịch đặt chỗ. Hủy hoàn tất các booking trước hoặc liên hệ admin.",
      });
    }

    await Hall.updateMany(
      { restaurantId, isDeleted: false },
      { $set: { isDeleted: true } },
    );
    await ServicePackage.updateMany(
      { restaurantId, isDeleted: false },
      { $set: { isDeleted: true } },
    );
    await Restaurant.deleteOne({ _id: restaurantId, vendorId });

    return res.json({
      success: true,
      message: "Đã xóa nhà hàng.",
    });
  } catch (err) {
    console.error("restaurant.remove error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi xóa nhà hàng." });
  }
};

module.exports = {
  create,
  update,
  remove,
  getMyRestaurant,
  getById,
  getAdminRestaurantById,
  submitForApproval,
  withdrawApproval,
  getAdminRestaurants,
  setAdminRestaurantApproval,
};
