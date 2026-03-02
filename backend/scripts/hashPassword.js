/**
 * Script hash password dùng bcryptjs (cùng thư viện với auth).
 * Dùng để tạo hash khi seed user hoặc cập nhật mật khẩu trong DB.
 *
 * Cách chạy:
 *   node scripts/hashPassword.js <password>
 * Ví dụ:
 *   node scripts/hashPassword.js admin123
 */

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const password = process.argv[2];
if (!password) {
  console.error('Cách dùng: node scripts/hashPassword.js <password>');
  console.error('Ví dụ: node scripts/hashPassword.js admin123');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, SALT_ROUNDS);
console.log('Password (plain):', password);
console.log('Hash:', hash);
