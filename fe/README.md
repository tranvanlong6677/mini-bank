# Mini Bank Frontend

React frontend cho Mini Bank API.

## Cài đặt

```bash
cd fe
npm install
```

## Chạy development server

```bash
npm run dev
```

Truy cập: http://localhost:3000

## Build production

```bash
npm run build
```

## Tính năng

- 🔐 **Authentication**: Đăng nhập/Đăng ký với JWT
- 👥 **User Management**: CRUD users đầy đủ
- 🎨 **UI**: TailwindCSS responsive design
- 🔄 **API Integration**: Axios với interceptors

## Cấu trúc thư mục

```
fe/
├── src/
│   ├── components/     # Components chung
│   ├── context/        # React Context (Auth)
│   ├── pages/          # Các trang
│   ├── services/       # API services
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## API Endpoints

Frontend kết nối với các API sau:

### Auth (Public)
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký

### Users (Protected - cần JWT)
- `GET /api/users` - Lấy danh sách users
- `GET /api/users/:id` - Lấy user theo ID
- `POST /api/users` - Tạo user mới
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user
