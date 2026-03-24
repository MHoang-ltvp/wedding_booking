/**
 * Migration: gộp addressDetail.houseNumber + street → street, $unset houseNumber.
 * Dùng collection mongodb thô để không phụ thuộc schema Mongoose (tránh mất dữ liệu cũ).
 *
 *   cd backend && npm run db:migrate-address
 *
 * MONGODB_URI trong .env (mặc định: mongodb://127.0.0.1:27017/wedding_booking).
 */

require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/wedding_booking";

function buildFullAddress(ad, mergedStreet) {
  const line1 = String(mergedStreet || "").trim();
  const wardName = ad.wardName;
  const districtName = ad.districtName;
  const provinceName = ad.provinceName;
  if (!line1 || !wardName || !districtName || !provinceName) return null;
  return `${line1}, ${wardName}, ${districtName}, ${provinceName}`;
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Đã kết nối:", MONGODB_URI);

  const col = mongoose.connection.db.collection("restaurants");
  const cursor = col.find({ "addressDetail.houseNumber": { $exists: true } });
  let updated = 0;

  for await (const doc of cursor) {
    const ad = doc.addressDetail || {};
    const hn = String(ad.houseNumber ?? "").trim();
    const st = String(ad.street ?? "").trim();
    const mergedStreet = [hn, st].filter(Boolean).join(" ").trim();

    const $set = { "addressDetail.street": mergedStreet };
    const rebuilt = buildFullAddress(ad, mergedStreet);
    if (rebuilt) {
      $set.address = rebuilt;
    }

    await col.updateOne(
      { _id: doc._id },
      {
        $set,
        $unset: { "addressDetail.houseNumber": "" },
      },
    );
    updated += 1;
  }

  const total = await col.countDocuments({});
  console.log(
    `Xong. Đã migrate ${updated} bản ghi có houseNumber. Tổng restaurants trong DB: ${total}.`,
  );
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
