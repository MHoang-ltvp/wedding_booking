# Checklist – UI tối giản, ưu tiên nối API

**Mục tiêu:** UI đơn giản, ít code, tập trung nối dữ liệu với API backend.

---

## Nguyên tắc UI tối giản

- **Không** dùng thư viện UI nặng (Material, Ant Design, …) trừ khi bắt buộc.
- **Chỉ** dùng HTML quen thuộc: `form`, `input`, `button`, `table`, `ul/li`, `div`, `a`.
- **Một ít CSS** trong `index.css`: container, spacing, màu nền/chữ cho dễ nhìn.
- **Mỗi trang** = 1 mục đích: hiển thị list từ API, form gửi API, hoặc link sang trang khác.
- **Dữ liệu từ BE** hiển thị đơn giản: bảng, list, hoặc `JSON.stringify` tạm thời để debug.

---

## 1. Chuẩn bị

- [ ] Cài React Router: `npm i react-router-dom`
- [ ] (Tùy chọn) Cài client gọi API: `axios` hoặc dùng `fetch`
- [ ] Tạo thư mục: `src/pages/`, `src/components/`

---

## 2. Layout tối giản

- [ ] **Header:** Tên app (link về `/`) + link "Đăng nhập" (→ `/login`). Nếu đã login: hiển thị tên user + "Đăng xuất".
- [ ] **Footer:** 1 dòng chữ (vd: "© Wedding Booking") – có thể bỏ qua giai đoạn đầu.
- [ ] **Layout:** 1 component bọc `{children}`, bên trong render Header + `children` (+ Footer nếu có).

---

## 3. Trang Home (tối giản)

- [ ] Route `/` → trang Home.
- [ ] Nội dung: 1 tiêu đề (h1), 1 đoạn mô tả ngắn (p), 1 nút/link "Đăng nhập" → `/login`. Không hero, không grid tính năng.
- [ ] (Tùy chọn) Một khu vực nhỏ "Dữ liệu mẫu từ API": gọi 1 API GET công khai (vd danh sách sảnh), hiển thị dạng bảng hoặc list đơn giản.

---

## 4. Routing trong App

- [ ] `main.jsx`: bọc `<App />` bằng `<BrowserRouter>`.
- [ ] `App.jsx`: dùng `<Routes>` + `<Route path="/" element={...} />`, `<Route path="/login" element={...} />`. Trang Home và Login dùng Layout chung.

---

## 5. Style tối giản

- [ ] Trong `index.css`: 1 class `.container` (max-width, margin auto), padding cho body/main. Không cần reset phức tạp.
- [ ] Không bắt buộc responsive chi tiết; chỉ cần trang đọc được trên desktop.

---

## 6. Trang Login – nối API

- [ ] Route `/login`.
- [ ] Form: 2 input (username, password), 1 button "Đăng nhập".
- [ ] onSubmit: gọi API POST login (backend), lưu token (localStorage hoặc state/context), redirect về `/` hoặc trang dashboard (nếu có).
- [ ] Hiển thị lỗi từ API (vd message) dưới form bằng 1 đoạn text đơn giản.

---

## 7. Các trang khác – ưu tiên nối API

Với mỗi nghiệp vụ (vd: danh sách sảnh, đặt tiệc, quản lý vendor):

- [ ] 1 trang = 1 route.
- [ ] Trang chỉ gồm: tiêu đề, (form nếu cần), và **khu vực hiển thị dữ liệu từ API** (bảng/list đơn giản).
- [ ] Không làm UI phức tạp (modal, wizard, drag-drop); chỉ form + list/table + nút gọi API.

---

## Thứ tự làm gợi ý

1. Chuẩn bị (router, axios/fetch, thư mục).
2. Layout (Header + wrapper), Routing (/, /login).
3. Trang Home tối giản + Trang Login gọi API.
4. Các trang còn lại: mỗi trang = form/list + nối 1 (vài) API.

---

*Giữ UI tối giản để dễ nối BE; khi API ổn định có thể chỉnh giao diện đẹp dần.*
