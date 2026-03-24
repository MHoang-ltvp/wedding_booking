const API_BASE = "https://provinces.open-api.vn/api";

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const getProvinces = async (req, res) => {
  try {
    const data = await fetchJson(`${API_BASE}/p/`);
    const provinces = Array.isArray(data)
      ? data.map((p) => ({ code: String(p.code), name: p.name }))
      : [];
    return res.json({ success: true, provinces });
  } catch (err) {
    console.error("location.getProvinces:", err);
    return res
      .status(502)
      .json({ success: false, message: "Không lấy được danh sách tỉnh/thành." });
  }
};

const getDistrictsByProvince = async (req, res) => {
  try {
    const { provinceCode } = req.query || {};
    if (!provinceCode) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu provinceCode." });
    }
    const data = await fetchJson(`${API_BASE}/p/${provinceCode}?depth=2`);
    const districts = Array.isArray(data?.districts)
      ? data.districts.map((d) => ({ code: String(d.code), name: d.name }))
      : [];
    return res.json({ success: true, districts });
  } catch (err) {
    console.error("location.getDistrictsByProvince:", err);
    return res
      .status(502)
      .json({ success: false, message: "Không lấy được danh sách quận/huyện." });
  }
};

const getWardsByDistrict = async (req, res) => {
  try {
    const { districtCode } = req.query || {};
    if (!districtCode) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu districtCode." });
    }
    const data = await fetchJson(`${API_BASE}/d/${districtCode}?depth=2`);
    const wards = Array.isArray(data?.wards)
      ? data.wards.map((w) => ({ code: String(w.code), name: w.name }))
      : [];
    return res.json({ success: true, wards });
  } catch (err) {
    console.error("location.getWardsByDistrict:", err);
    return res
      .status(502)
      .json({ success: false, message: "Không lấy được danh sách phường/xã." });
  }
};

module.exports = {
  getProvinces,
  getDistrictsByProvince,
  getWardsByDistrict,
};
