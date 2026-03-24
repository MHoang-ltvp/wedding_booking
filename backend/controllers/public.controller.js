/**
 * DANH SÁCH API TEST CHO POSTMAN - PUBLIC VIEWS & SEARCH ENGINE (Tdung)
 * Base URL: http://localhost:9999
 * Lưu ý: Thay thế [ID_NHA_HANG] và [ID_SANH] bằng ObjectId thực tế trong DB.
 

// 1. TÌM KIẾM & LIỆT KÊ NHÀ HÀNG
// Lấy tất cả & Phân trang cơ bản:
GET http://localhost:9999/api/public/restaurants?page=1&limit=10

// Test Full Bộ Lọc (Tên, địa chỉ, sức chứa, giá tiền):
GET http://localhost:9999/api/public/restaurants?page=1&limit=10&search=Palace&address=Hanoi&minCapacity=100&maxCapacity=500&minPrice=1000000&maxPrice=5000000

// 2. CHI TIẾT NHÀ HÀNG
// Xem chi tiết nhà hàng (Kèm danh sách sảnh và dịch vụ):
GET http://localhost:9999/api/public/restaurants/[ID_NHA_HANG]

// 3. DANH SÁCH SẢNH CỦA NHÀ HÀNG
// Lấy tất cả sảnh:
GET http://localhost:9999/api/public/restaurants/[ID_NHA_HANG]/halls

// Lọc sảnh theo sức chứa và giá:
GET http://localhost:9999/api/public/restaurants/[ID_NHA_HANG]/halls?minCapacity=200&maxPrice=3000000

// 4. DANH SÁCH DỊCH VỤ (MENU / TRANG TRÍ)
// Lấy tất cả dịch vụ (tự động nhóm):
GET http://localhost:9999/api/public/restaurants/[ID_NHA_HANG]/services

// Lọc chỉ lấy Menu đồ ăn:
GET http://localhost:9999/api/public/restaurants/[ID_NHA_HANG]/services?type=FOOD

// Lọc chỉ lấy Gói trang trí:
GET http://localhost:9999/api/public/restaurants/[ID_NHA_HANG]/services?type=DECORATION

// 5. KIỂM TRA LỊCH TRỐNG (AVAILABILITY)
// Kiểm tra lịch sảnh theo ngày (YYYY-MM-DD):
GET http://localhost:9999/api/public/halls/[ID_SANH]/availability?date=2026-10-20  */

const mongoose = require('mongoose');
const { Restaurant, Hall, ServicePackage, Booking } = require('../models');

/** Thêm coverImage (URL ảnh đầu) để client hiển thị không cần parse images[] */
function hallWithCover(h) {
  if (!h) return h;
  const imgs = Array.isArray(h.images) ? h.images : [];
  return {
    ...h,
    coverImage: imgs[0]?.url || null,
  };
}

function serviceWithCover(s) {
  if (!s) return s;
  const imgs = Array.isArray(s.images) ? s.images : [];
  return {
    ...s,
    coverImage: imgs[0]?.url || null,
  };
}

/** Ngày theo giờ local (server), YYYY-MM-DD */
function ymdLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayYmdLocal() {
  return ymdLocal(new Date());
}

function parseYmdLocal(ymd) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, mo, d] = ymd.split('-').map(Number);
  return new Date(y, mo - 1, d, 0, 0, 0, 0);
}

/** Trạng thái booking chiếm slot — khớp booking.controller create */
const BOOKING_STATUSES_BLOCKING = { $nin: ['CANCELLED', 'REJECTED'] };

/** Nhà hàng được hiển thị / đặt qua cổng khách */
async function isRestaurantOnPublicChannel(restaurantId) {
  if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) return false;
  const r = await Restaurant.findOne({
    _id: restaurantId,
    status: 'ACTIVE',
    approvalStatus: 'APPROVED',
  })
    .select('_id')
    .lean();
  return !!r;
}

/**
 * GET /api/public/restaurants
 * Tìm kiếm và liệt kê nhà hàng với bộ lọc và phân trang
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

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const filter = { status: 'ACTIVE', approvalStatus: 'APPROVED' };

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (address) {
      filter.address = { $regex: address, $options: 'i' };
    }

    const restaurants = await Restaurant.find(filter)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const enrichedRestaurants = await Promise.all(
      restaurants.map(async (restaurant) => {
       
        const halls = await Hall.find({
          restaurantId: restaurant._id,
          isDeleted: false,
        }).lean();

     
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

     
        const services = await ServicePackage.find({
          restaurantId: restaurant._id,
          isDeleted: false,
        }).lean();

       
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

  
    const finalRestaurants =
      minCapacity || maxCapacity || minPrice || maxPrice
        ? enrichedRestaurants.filter((r) => r.hallCount > 0)
        : enrichedRestaurants;

   
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
 * Xem chi tiết một nhà hàng (ACTIVE + đã duyệt)
 */
const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;

  
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID nhà hàng không hợp lệ',
      });
    }


    const restaurant = await Restaurant.findOne({
      _id: id,
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
    }).lean();

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Nhà hàng không tìm thấy',
      });
    }

    const hallsRaw = await Hall.find({
      restaurantId: id,
      isDeleted: false,
    })
      .select('_id name capacity area basePrice description images status')
      .lean();

    const halls = hallsRaw.map(hallWithCover);

    const servicesRaw = await ServicePackage.find({
      restaurantId: id,
      isDeleted: false,
    })
      .select('_id name type unit price items description images')
      .lean();

    const services = servicesRaw.map(serviceWithCover);

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
 */
const getHallsByRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { minCapacity, maxCapacity, minPrice, maxPrice } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID nhà hàng không hợp lệ',
      });
    }

 
    const restaurant = await Restaurant.findOne({
      _id: id,
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
    }).lean();

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Nhà hàng không tìm thấy',
      });
    }

    const filter = {
      restaurantId: id,
      isDeleted: false,
    };

    let halls = await Hall.find(filter).lean();

   
    if (minCapacity || maxCapacity || minPrice || maxPrice) {
      halls = halls.filter((hall) => {
        if (minCapacity && hall.capacity < parseInt(minCapacity)) return false;
        if (maxCapacity && hall.capacity > parseInt(maxCapacity)) return false;
        if (minPrice && hall.basePrice < parseInt(minPrice)) return false;
        if (maxPrice && hall.basePrice > parseInt(maxPrice)) return false;
        return true;
      });
    }

    const data = halls.map(hallWithCover);

    res.json({
      success: true,
      data,
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
 * GET /api/public/halls?page=1&limit=24
 * Danh sách sảnh (nhà hàng ACTIVE, sảnh còn hoạt động) — dùng trang chủ / khám phá nhanh.
 */
const getAllPublicHalls = async (req, res) => {
  try {
    const { limit = 24, page = 1 } = req.query;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 24));
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const skip = (pageNum - 1) * limitNum;

    const activeIds = await Restaurant.find({
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
    }).distinct('_id');
    if (!activeIds.length) {
      return res.json({
        success: true,
        data: [],
        pagination: { page: pageNum, limit: limitNum, total: 0, pages: 0 },
      });
    }

    const filter = {
      restaurantId: { $in: activeIds },
      isDeleted: false,
      status: 'AVAILABLE',
    };

    const total = await Hall.countDocuments(filter);

    const halls = await Hall.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('restaurantId', 'name address status')
      .lean();

    const data = halls
      .filter((h) => h.restaurantId && h.restaurantId.status === 'ACTIVE')
      .map((h) => {
        const r = h.restaurantId;
        const flat = {
          ...hallWithCover(h),
          restaurantId: r._id,
          restaurantName: r.name || '',
          restaurantAddress: r.address || '',
        };
        return flat;
      });

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 0,
      },
    });
  } catch (error) {
    console.error('Error in getAllPublicHalls:', error);
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
 */
const getServicesByRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

   
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID nhà hàng không hợp lệ',
      });
    }
    const restaurant = await Restaurant.findOne({
      _id: id,
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
    }).lean();

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Nhà hàng không tìm thấy',
      });
    }

    const filter = {
      restaurantId: id,
      isDeleted: false,
    };

    if (type && ['FOOD', 'DECORATION'].includes(type.toUpperCase())) {
      filter.type = type.toUpperCase();
    }

    const services = await ServicePackage.find(filter).lean();

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
 */
const getHallAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sảnh không hợp lệ',
      });
    }

 
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD',
      });
    }

    
    const hall = await Hall.findById(id).lean();
    if (!hall || hall.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Sảnh không tìm thấy',
      });
    }

    if (!(await isRestaurantOnPublicChannel(hall.restaurantId))) {
      return res.status(404).json({
        success: false,
        message: 'Sảnh không tìm thấy',
      });
    }

    const [year, month, day] = date.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);


    const bookings = await Booking.find({
      hallId: id,
      bookingDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: BOOKING_STATUSES_BLOCKING,
    })
      .select('_id shift')
      .lean();

   
    const hallOk = hall.status === 'AVAILABLE' && !hall.isDeleted;
    const bookedShifts = new Set(bookings.map((b) => b.shift));
    const availability = {
      MORNING: {
        available: hallOk && !bookedShifts.has('MORNING'),
        bookingId: bookings.find((b) => b.shift === 'MORNING')?._id || null,
      },
      EVENING: {
        available: hallOk && !bookedShifts.has('EVENING'),
        bookingId: bookings.find((b) => b.shift === 'EVENING')?._id || null,
      },
    };

    res.json({
      success: true,
      data: {
        hallId: id,
        hallName: hall.name,
        hallBookable: hallOk,
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

/**
 * GET /api/public/halls/:id/availability-range?from=YYYY-MM-DD&days=14
 * Lịch trống nhiều ngày (mặc định từ hôm nay, 14 ngày), mỗi ngày 2 ca — khớp logic đặt chỗ.
 */
const getHallAvailabilityRange = async (req, res) => {
  try {
    const { id } = req.params;
    let { from: fromQ, days: daysQ } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID sảnh không hợp lệ',
      });
    }

    const hall = await Hall.findById(id).lean();
    if (!hall || hall.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Sảnh không tìm thấy',
      });
    }

    if (!(await isRestaurantOnPublicChannel(hall.restaurantId))) {
      return res.status(404).json({
        success: false,
        message: 'Sảnh không tìm thấy',
      });
    }

    const days = Math.min(31, Math.max(1, parseInt(daysQ, 10) || 14));
    const today = parseYmdLocal(todayYmdLocal());
    let start = fromQ && parseYmdLocal(fromQ) ? parseYmdLocal(fromQ) : today;
    if (start < today) start = today;

    const fromStr = ymdLocal(start);
    const endLast = new Date(start);
    endLast.setDate(endLast.getDate() + days - 1);
    const rangeEnd = new Date(
      endLast.getFullYear(),
      endLast.getMonth(),
      endLast.getDate(),
      23,
      59,
      59,
      999,
    );

    const bookings = await Booking.find({
      hallId: id,
      bookingDate: { $gte: start, $lte: rangeEnd },
      status: BOOKING_STATUSES_BLOCKING,
    })
      .select('bookingDate shift')
      .lean();

    const takenByDate = new Map();
    for (const b of bookings) {
      const key = ymdLocal(new Date(b.bookingDate));
      if (!takenByDate.has(key)) takenByDate.set(key, new Set());
      takenByDate.get(key).add(b.shift);
    }

    const hallOk = hall.status === 'AVAILABLE' && !hall.isDeleted;
    const slots = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = ymdLocal(d);
      const taken = takenByDate.get(dateStr) || new Set();
      slots.push({
        date: dateStr,
        availability: {
          MORNING: { available: hallOk && !taken.has('MORNING') },
          EVENING: { available: hallOk && !taken.has('EVENING') },
        },
      });
    }

    const toStr = slots.length ? slots[slots.length - 1].date : fromStr;

    res.json({
      success: true,
      data: {
        hallId: id,
        hallName: hall.name,
        hallBookable: hallOk,
        from: fromStr,
        to: toStr,
        days,
        slots,
      },
    });
  } catch (error) {
    console.error('Error in getHallAvailabilityRange:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch trống',
      error: error.message,
    });
  }
};

module.exports = {
  getRestaurants,
  getRestaurantById,
  getHallsByRestaurant,
  getAllPublicHalls,
  getServicesByRestaurant,
  getHallAvailability,
  getHallAvailabilityRange,
};
