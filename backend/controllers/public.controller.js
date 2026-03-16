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

    const filter = { status: 'ACTIVE' };

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
 * Xem chi tiết một nhà hàng (chỉ ACTIVE)
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
    }).lean();

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Nhà hàng không tìm thấy',
      });
    }


    const halls = await Hall.find({
      restaurantId: id,
      isDeleted: false,
    })
      .select('_id name capacity area basePrice description images status')
      .lean();

  
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
    if (!hall) {
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
      status: { $in: ['PENDING', 'COMPLETED'] },
    })
      .select('_id shift')
      .lean();

   
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
