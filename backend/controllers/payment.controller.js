/**
 * Thống kê vendor/admin. Doanh thu đã thu = tổng tiền các booking khách đã thanh toán trọn gói (paidInFull).
 */

const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Booking = require('../models/Booking');

// GET /api/vendor/stats
const getVendorStats = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const restaurants = await Restaurant.find({ vendorId }).select('_id name').lean();
    const restaurantIds = restaurants.map((r) => r._id);

    if (restaurantIds.length === 0) {
      return res.json({
        success: true,
        stats: {
          restaurantCount: 0,
          bookingTotal: 0,
          bookingsByStatus: {},
          paidRevenue: 0,
        },
        restaurants: [],
      });
    }

    const bookings = await Booking.find({ restaurantId: { $in: restaurantIds } })
      .select('_id status restaurantId')
      .lean();
    const bookingIds = bookings.map((b) => b._id);

    const bookingsByStatus = {};
    for (const b of bookings) {
      bookingsByStatus[b.status] = (bookingsByStatus[b.status] || 0) + 1;
    }

    const paidAgg = await Booking.aggregate([
      {
        $match: {
          _id: { $in: bookingIds },
          paidInFull: true,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ['$finalAmount', '$estimatedTotal'] } },
        },
      },
    ]);
    const paidRevenue = paidAgg[0]?.total || 0;

    return res.json({
      success: true,
      stats: {
        restaurantCount: restaurants.length,
        bookingTotal: bookings.length,
        bookingsByStatus,
        paidRevenue,
      },
      restaurants,
    });
  } catch (err) {
    console.error('payment.getVendorStats:', err);
    return res.status(500).json({ success: false, message: 'Lỗi thống kê vendor.' });
  }
};

// GET /api/admin/stats
const getAdminStats = async (req, res) => {
  try {
    const [
      usersTotal,
      admins,
      vendors,
      customers,
      restaurantsTotal,
      pendingRestaurants,
      bookingsTotal,
      bookingAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'ADMIN' }),
      User.countDocuments({ role: 'VENDOR' }),
      User.countDocuments({ role: 'CUSTOMER' }),
      Restaurant.countDocuments(),
      Restaurant.countDocuments({ approvalStatus: 'PENDING' }),
      Booking.countDocuments(),
      Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const bookingsByStatus = {};
    for (const row of bookingAgg) {
      bookingsByStatus[row._id] = row.count;
    }

    return res.json({
      success: true,
      stats: {
        usersTotal,
        admins,
        vendors,
        customers,
        restaurantsTotal,
        pendingRestaurantApprovals: pendingRestaurants,
        bookingsTotal,
        bookingsByStatus,
      },
    });
  } catch (err) {
    console.error('payment.getAdminStats:', err);
    return res.status(500).json({ success: false, message: 'Lỗi thống kê admin.' });
  }
};

module.exports = {
  getVendorStats,
  getAdminStats,
};
