/** Nhập tiền VNĐ: hiển thị phân cách hàng nghìn bằng dấu chấm (vd. 1.500.000). */

export function digitsOnly(s) {
  return String(s ?? '').replace(/\D/g, '');
}

/**
 * @param {string} rawInput — giá trị ô input (có thể đã có dấu chấm)
 * @returns {string} chuỗi hiển thị; rỗng nếu không còn chữ số
 */
export function formatVndMoneyInput(rawInput) {
  let d = digitsOnly(rawInput);
  if (!d) return '';
  d = d.replace(/^0+(?=\d)/, '') || '0';
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * @param {string} formatted — chuỗi có dấu chấm hoặc chỉ số
 * @returns {number} NaN nếu rỗng
 */
export function parseVndMoneyToNumber(formatted) {
  const d = digitsOnly(formatted);
  if (d === '') return NaN;
  return Number(d);
}
