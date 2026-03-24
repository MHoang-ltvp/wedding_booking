import api from '../api/axiosInstance';
import { paths } from '../api/endpoints';

export async function fetchProvinces() {
  const { data } = await api.get(paths.address.provinces);
  if (!data.success) throw new Error(data.message || 'Lỗi tải tỉnh/thành');
  return Array.isArray(data.provinces) ? data.provinces : [];
}

export async function fetchDistrictsByProvince(provinceCode) {
  if (!provinceCode) return [];
  const { data } = await api.get(paths.address.provinceDistricts(provinceCode));
  if (!data.success) throw new Error(data.message || 'Lỗi tải quận/huyện');
  return Array.isArray(data.districts) ? data.districts : [];
}

export async function fetchWardsByDistrict(districtCode) {
  if (!districtCode) return [];
  const { data } = await api.get(paths.address.districtWards(districtCode));
  if (!data.success) throw new Error(data.message || 'Lỗi tải phường/xã');
  return Array.isArray(data.wards) ? data.wards : [];
}
