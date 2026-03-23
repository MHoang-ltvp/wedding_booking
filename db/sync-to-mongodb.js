/**
 * Đồng bộ dữ liệu từ các file JSON trong thư mục `db/` lên MongoDB.
 * Dùng MONGODB_URI trong backend/.env (mặc định: mongodb://127.0.0.1:27017/wedding_booking).
 *
 * Chạy từ thư mục gốc repo:
 *   node db/sync-to-mongodb.js
 * Hoặc từ backend:
 *   npm run db:sync
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const backendRoot = path.join(repoRoot, 'backend');
const dbDir = __dirname;

function requireBackend(pkg) {
  return require(path.join(backendRoot, 'node_modules', pkg));
}

const mongoose = requireBackend('mongoose');
const dotenv = requireBackend('dotenv');

dotenv.config({ path: path.join(backendRoot, '.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wedding_booking';

const {
  User,
  Restaurant,
  Hall,
  ServicePackage,
  Booking,
  Transaction,
} = require(path.join(backendRoot, 'models', 'index.js'));

/** Chuyển Extended JSON ($oid, $date) sang kiểu Mongoose */
function parseExtendedJson(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(parseExtendedJson);
  if (typeof value !== 'object') return value;
  if (value.$oid !== undefined) return new mongoose.Types.ObjectId(value.$oid);
  if (value.$date !== undefined) return new Date(value.$date);
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = parseExtendedJson(v);
  }
  return out;
}

function readJsonArray(filename) {
  const p = path.join(dbDir, filename);
  const raw = fs.readFileSync(p, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error(`${filename} phải là mảng JSON`);
  }
  return data.map(parseExtendedJson);
}

async function upsertAll(Model, docs) {
  if (docs.length === 0) return;
  const ops = docs.map((doc) => ({
    replaceOne: {
      filter: { _id: doc._id },
      replacement: doc,
      upsert: true,
    },
  }));
  await Model.bulkWrite(ops);
}

function enrichRestaurant(doc) {
  return {
    ...doc,
    contact: doc.contact ?? { name: '', phone: '', email: '' },
    approvalStatus: doc.approvalStatus ?? 'APPROVED',
    images: doc.images ?? [],
  };
}

async function main() {
  await mongoose.connect(MONGODB_URI);

  // Bỏ index unique vendorId cũ nếu schema đã cho phép nhiều nhà hàng / vendor
  await Restaurant.syncIndexes();

  const users = readJsonArray('users.json');
  const restaurants = readJsonArray('restaurants.json').map(enrichRestaurant);
  const halls = readJsonArray('halls.json');
  const servicePackages = readJsonArray('servicepackages.json');
  const bookings = readJsonArray('bookings.json');
  const transactions = readJsonArray('transactions.json');

  await upsertAll(User, users);
  await upsertAll(Restaurant, restaurants);
  await upsertAll(Hall, halls);
  await upsertAll(ServicePackage, servicePackages);
  await upsertAll(Booking, bookings);
  await upsertAll(Transaction, transactions);

  console.log(
    'Đã upsert MongoDB:',
    `users=${users.length}, restaurants=${restaurants.length}, halls=${halls.length},`,
    `servicepackages=${servicePackages.length}, bookings=${bookings.length}, transactions=${transactions.length}`
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
