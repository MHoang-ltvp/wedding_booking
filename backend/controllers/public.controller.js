/**
 * Public Controller - Thành viên 4 (Tdung)
 * API hiển thị ra ngoài cho Guest/Customer: tìm kiếm, chi tiết nhà hàng, sảnh, dịch vụ, kiểm tra lịch trống
 *
 * Không cần auth - public.
 */

const mongoose = require('mongoose');
const { Restaurant, Hall, ServicePackage, Booking } = require('../models');

/**
 * GET /api/public/restaurants
 * Tìm kiếm và liệt kê nhà hàng với bộ lọc và phân trang
 *
 * Query Parameters:
 * - page (default: 1)
 * - limit (default: 10, max: 100)
 * - search (tìm theo tên nhà hàng)
 * - address (tìm theo địa chỉ)
 * - minCapacity (sức chứa tối thiểu)
 * - maxCapacity (sức chứa tối đa)
 * - minPrice (giá tối thiểu)
 * - maxPrice (giá tối đa)
 */
const getRestaurants = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      address = '',
      minCapacity,
      maxCapacity,
      minPrice,
      maxPrice,
    } = req.query;

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = { status: 'ACTIVE' };

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (address) {
      filter.address = { $regex: address, $options: 'i' };
    }

    // Get restaurants matching basic filters
    const restaurants = await Restaurant.find(filter)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Enrich each restaurant with hall and service info
    const enrichedRestaurants = await Promise.all(
      restaurants.map(async (restaurant) => {
        // Get halls for this restaurant
        const halls = await Hall.find({
          restaurantId: restaurant._id,
          isDeleted: false,
        }).lean();

        // Filter halls by capacity and price if provided
        let filteredHalls = halls;
        if (minCapacity || maxCapacity || minPrice || maxPrice) {
          filteredHalls = halls.filter((hall) => {
            if (minCapacity && hall.capacity < parseInt(minCapacity)) return false;
            if (maxCapacity && hall.capacity > parseInt(maxCapacity)) return false;
            if (minPrice && hall.basePrice < parseInt(minPrice)) return false;
            if (maxPrice && hall.basePrice > parseInt(maxPrice)) return false;
            return true;
          });
        }

        // Get services for this restaurant
        const services = await ServicePackage.find({
          restaurantId: restaurant._id,
          isDeleted: false,
        }).lean();

        // Calculate min/max prices and capacities
        const prices = filteredHalls.map((h) => h.basePrice);
        const capacities = filteredHalls.map((h) => h.capacity);

        return {
          ...restaurant,
          minPrice: prices.length > 0 ? Math.min(...prices) : 0,
          maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
          minCapacity: capacities.length > 0 ? Math.min(...capacities) : 0,
          maxCapacity: capacities.length > 0 ? Math.max(...capacities) : 0,
          hallCount: filteredHalls.length,
          serviceCount: services.length,
        };
      })
    );

    // Filter out restaurants with no matching halls (if filters were applied)
    const finalRestaurants =
      minCapacity || maxCapacity || minPrice || maxPrice
        ? enrichedRestaurants.filter((r) => r.hallCount > 0)
        : enrichedRestaurants;

    // Get total count for pagination
    const totalCount = await Restaurant.countDocuments(filter);

    res.json({
      success: true,
      data: finalRestaurants,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error('Error in getRestaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm nhà hàng',
      error: error.message,
    });
  }
};

/**
 * GET /api/public/restaurants/:id
 * Xem chi tiết một nhà hàng (chỉ ACTIVE)
 */
const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID nhà hàng không hợp lệ',
      });
    }

    // Find restaurant
    const restaurant = await Restaurant.findOne({
      _id: id,
      status: 'ACTIVE',
    }).lean();

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Nhà hàng không tìm thấy',
      });
    }

    // Get halls
    const halls = await Hall.find({
      restaurantId: id,
      isDeleted: false,
    })
      .select('_id name capacity area basePrice description images status')
      .lean();

    // Get services
    const services = await ServicePackage.find({
      restaurantId: id,
      isDeleted: false,
    })
      .select('_id name type unit price items description images')
      .lean();

    res.json({
      success: true,
      data: {
        ...restaurant,
        halls,
        services,
      },
    });
  } catch (error) {
    console.error('Error in getRestaurantById:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết nhà hàng',
      error: error.message,
    });
  }
};

/**
 * GET /api/public/restaurants/:id/halls
 * Danh sách sảnh của một nhà hàng
 *
 * Query Parameters:
 * - minCapacity
 * - maxCapacity
 * - minPrice
 * - maxPrice
 */
const getHallsByRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { minCapacity, maxCapacity, minPrice, maxPrice } = req.query;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID nhà hàng không hợp lệ',
      });
    }

    // Check if restaurant exists and is ACTIVE
    const restaurant = await Restaurant.findOne({
      _id: id,
      status: 'ACTIVE',
    }).lean();

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Nhà hàng không tìm thấy',
      });
    }

    // Build filter
    const filter = {
      restaurantId: id,
      isDeleted: false,
    };

    // Get halls
    let halls = await Hall.find(filter).lean();

    // Apply filters
    if (minCapacity || maxCapacity || minPrice || maxPrice) {
      halls = halls.filter((hall) => {
        if (minCapacity && hall.capacity < parseInt(minCapacity)) return false;
        if (maxCapacity && hall.capacity > parseInt(maxCapacity)) return false;
        if (minPrice && hall.basePrice < parseInt(minPrice)) return false;
        if (maxPrice && hall.basePrice > parseInt(maxPrice)) return false;
        return true;
      });
    }

    res.json({
      success: true,
      data: halls,
    });
  } catch (error) {
    console.error('Error in getHallsByRestaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách sảnh',
      error: error.message,
    });
  }
};

/**
 * GET /api/public/restaurants/:id/services
 * Danh sách dịch vụ (menu & trang trí) của một nhà hàng
 *
 * Query Parameters:
 * - type (FOOD hoặc DECORATION, optional)
 */
const getServicesByRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID nhà hàng không hợp lệ',
      });
    }

    // Check if restaurant exists and is ACTIVE
    const restaurant = await Restaurant.findOne({
      _id: id,
      status: 'ACTIVE',
    }).lean();

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Nhà hàng không tìm thấy',
      });
    }

    // Build filter
    const filter = {
      restaurantId: id,
      isDeleted: false,
    };

    if (type && ['FOOD', 'DECORATION'].includes(type.toUpperCase())) {
      filter.type = type.toUpperCase();
    }

    // Get services
    const services = await ServicePackage.find(filter).lean();

    // Group by type if no specific type filter
    if (!type) {
      const grouped = {
        food: services.filter((s) => s.type === 'FOOD'),
        decoration: services.filter((s) => s.type === 'DECORATION'),
      };

      return res.json({
        success: true,
        data: grouped,
      });
    }

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Error in getServicesByRestaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách dịch vụ',
      error: error.message,
    });
  }
};

/**
 * GET /api/public/halls/:id/availability?date=YYYY-MM-DD
 * Kiểm tra lịch trống của sảnh theo ngày
 *
 * Query Parameters:
 * - date (required, format: YYYY-MM-DD)
 *
 * Response:
 * {
 *   MORNING: { available: true/false, bookingId: null/id },
 *   EVENING: { available: true/false, bookingId: null/id }
 * }
 */
const getHallAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sảnh không hợp lệ',
      });
    }

    // Validate date format (YYYY-MM-DD)
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD',
      });
    }

    // Check if hall exists
    const hall = await Hall.findById(id).lean();
    if (!hall) {
      return res.status(404).json({
        success: false,
        message: 'Sảnh không tìm thấy',
      });
    }

    // Parse date and create date range for the day
    const [year, month, day] = date.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    // Query bookings for this hall on this date with confirmed status
    const bookings = await Booking.find({
      hallId: id,
      bookingDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $in: ['PENDING', 'COMPLETED'] },
    })
      .select('_id shift')
      .lean();

    // Create availability map
    const bookedShifts = new Set(bookings.map((b) => b.shift));
    const availability = {
      MORNING: {
        available: !bookedShifts.has('MORNING'),
        bookingId: bookings.find((b) => b.shift === 'MORNING')?._id || null,
      },
      EVENING: {
        available: !bookedShifts.has('EVENING'),
        bookingId: bookings.find((b) => b.shift === 'EVENING')?._id || null,
      },
    };

    res.json({
      success: true,
      data: {
        hallId: id,
        hallName: hall.name,
        date,
        availability,
      },
    });
  } catch (error) {
    console.error('Error in getHallAvailability:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra lịch trống',
      error: error.message,
    });
  }
};

module.exports = {
  getRestaurants,
  getRestaurantById,
  getHallsByRestaurant,
  getServicesByRestaurant,
  getHallAvailability,
};
