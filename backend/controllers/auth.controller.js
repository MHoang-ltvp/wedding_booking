/**
 * Auth Controller - Thành viên 5 (Triệu Hoàng)
 * POST /api/auth/register (validate email, SĐT), POST /api/auth/login (JWT)
 *
 * Logic đăng ký/đăng nhập viết tại đây. Route gọi qua auth.routes.js.
 * Tạm thời chưa gắn middleware (các route auth thường public).
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");

const JWT_SECRET = process.env.JWT_SECRET || "wedding-booking-secret-dev";

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// POST /api/auth/register - Đăng ký Customer hoặc Vendor (email, SĐT, fullName, password, role)
const register = async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      phone,
      role = "CUSTOMER",
    } = req.body || {};

    if (!email || !password || !fullName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Thiếu email, password, fullName hoặc phone.",
      });
    }

    const allowedRoles = ["CUSTOMER", "VENDOR"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role đăng ký chỉ được là CUSTOMER hoặc VENDOR.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email đã được sử dụng.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      fullName: String(fullName).trim(),
      phone: String(phone).trim(),
      role,
      status: "ACTIVE",
    });

    if (role === "VENDOR") {
      // 1 vendor -> 1 restaurant profile. Admin sẽ duyệt theo approvalStatus.
      await Restaurant.create({
        vendorId: user._id,
        name: "Chưa cập nhật",
        address: "Chưa cập nhật",
        description: "",
        approvalStatus: "PENDING",
        status: "ACTIVE",
      });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công.",
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Email đã được sử dụng." });
    }
    return res.status(500).json({ success: false, message: "Lỗi đăng ký." });
  }
};

// POST /api/auth/login - Đăng nhập (email, password), trả về JWT + user
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Thiếu email hoặc password.",
      });
    }

    // Backward-compatible: tìm email không phân biệt hoa thường (hữu ích nếu DB cũ lưu email khác casing)
    const rawEmail = String(email).trim();
    const emailRegex = new RegExp(`^${escapeRegex(rawEmail)}$`, "i");
    const user = await User.findOne({ email: emailRegex });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Sai email hoặc mật khẩu.",
      });
    }

    const storedPassword = user.password || "";
    const looksLikeBcrypt =
      typeof storedPassword === "string" &&
      (storedPassword.startsWith("$2a$") ||
        storedPassword.startsWith("$2b$") ||
        storedPassword.startsWith("$2y$"));

    let match = false;
    if (looksLikeBcrypt) {
      match = await bcrypt.compare(password, storedPassword);
    } else if (typeof storedPassword === "string") {
      // Support legacy/plain-text DB entries (then migrate to bcrypt)
      match = String(password) === storedPassword;
      if (match) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      }
    }

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Sai email hoặc mật khẩu.",
      });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Lỗi đăng nhập." });
  }
};

module.exports = {
  register,
  login,
};
