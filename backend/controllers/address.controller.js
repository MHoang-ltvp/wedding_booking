/**
 * Proxy đơn vị hành chính VN (nguồn: provinces.open-api.vn).
 * GET tỉnh → quận/huyện → phường/xã theo từng bước.
 */

const OPEN_API_BASE = "https://provinces.open-api.vn/api";

async function fetchJson(path) {
  const url = `${OPEN_API_BASE}${path}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

const listProvinces = async (_req, res) => {
  try {
    const data = await fetchJson("/?depth=1");
    if (!Array.isArray(data)) {
      return res.status(502).json({
        success: false,
        message: "Dữ liệu tỉnh/thành không hợp lệ.",
      });
    }
    const provinces = data.map((p) => ({
      code: String(p.code),
      name: p.name,
      division_type: p.division_type || "",
    }));
    return res.json({ success: true, provinces });
  } catch (err) {
    console.error("address.listProvinces:", err.message);
    return res.status(502).json({
      success: false,
      message: "Không tải được danh sách tỉnh/thành. Thử lại sau.",
    });
  }
};

const listDistrictsByProvince = async (req, res) => {
  try {
    const code = String(req.params.provinceCode || "").trim();
    if (!code) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu mã tỉnh/thành." });
    }
    const data = await fetchJson(`/p/${encodeURIComponent(code)}?depth=2`);
    const raw = data?.districts;
    if (!Array.isArray(raw)) {
      return res.status(502).json({
        success: false,
        message: "Dữ liệu quận/huyện không hợp lệ.",
      });
    }
    const districts = raw.map((d) => ({
      code: String(d.code),
      name: d.name,
      division_type: d.division_type || "",
      province_code: d.province_code != null ? String(d.province_code) : code,
    }));
    return res.json({ success: true, districts });
  } catch (err) {
    console.error("address.listDistrictsByProvince:", err.message);
    return res.status(502).json({
      success: false,
      message: "Không tải được quận/huyện. Thử lại sau.",
    });
  }
};

const listWardsByDistrict = async (req, res) => {
  try {
    const code = String(req.params.districtCode || "").trim();
    if (!code) {
      return res.status(400).json({ success: false, message: "Thiếu mã quận/huyện." });
    }
    const data = await fetchJson(`/d/${encodeURIComponent(code)}?depth=2`);
    const raw = data?.wards;
    if (!Array.isArray(raw)) {
      return res.status(502).json({
        success: false,
        message: "Dữ liệu phường/xã không hợp lệ.",
      });
    }
    const wards = raw.map((w) => ({
      code: String(w.code),
      name: w.name,
      division_type: w.division_type || "",
      district_code: w.district_code != null ? String(w.district_code) : code,
    }));
    return res.json({ success: true, wards });
  } catch (err) {
    console.error("address.listWardsByDistrict:", err.message);
    return res.status(502).json({
      success: false,
      message: "Không tải được phường/xã. Thử lại sau.",
    });
  }
};

module.exports = {
  listProvinces,
  listDistrictsByProvince,
  listWardsByDistrict,
};
