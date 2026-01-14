# mongo-mcp

[English](README_en.md) | **Tiếng Việt**

MCP Server cấp production cho phép AI coding assistants truy cập MongoDB database schema, field types, sample data và query validation.

## Tính năng

- **Schema Overview** - Metadata tổng quan về database
- **List Collections** - Liệt kê tất cả collections
- **Infer Schema** - Phân tích cấu trúc collection với field types
- **Sample Data** - Lấy dữ liệu mẫu với PII masking
- **Validate Query** - Kiểm tra cú pháp MongoDB query

## Cài đặt

```bash
git clone https://github.com/quocthai0404/mongo-mcp.git
cd mongo-mcp
npm install
npm run build
```

## Cấu hình VS Code

### Bước 1: Thêm MCP Server

1. Mở **Command Palette** (`Ctrl+Shift+P`)
2. Gõ và chọn: `MCP: Add Server`
3. Chọn: **Command (stdio)**
4. Nhập Server ID: `mongo-mcp`
5. Nhập Command: `node`
6. Chọn: **User Settings** (để dùng cho tất cả projects)

### Bước 2: Cấu hình Server

VS Code sẽ mở file `settings.json`. Tìm phần `mcp` và **sửa thành**:

```json
"mcp": {
  "inputs": [
    {
      "type": "promptString",
      "id": "mongodb-uri",
      "description": "Nhập MongoDB URI (mongodb://... hoặc mongodb+srv://...)",
      "password": true
    }
  ],
  "servers": {
    "mongo-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/đường/dẫn/tới/mongo-mcp/dist/index.js"],
      "env": {
        "MONGODB_URI": "${input:mongodb-uri}"
      }
    }
  }
}
```

> ⚠️ **Quan trọng**: Thay `/đường/dẫn/tới/mongo-mcp` bằng đường dẫn thực tế!
>
> Ví dụ Windows: `"C:/Users/yourname/mongo-mcp/dist/index.js"`

### Bước 3: Khởi động Server

1. Mở **Command Palette** (`Ctrl+Shift+P`)
2. Chạy: `MCP: List Servers`
3. Click **Start** trên `mongo-mcp`
4. VS Code sẽ **hỏi nhập MongoDB URI** → Nhập connection string của bạn
5. Hoàn tất! Server đang chạy 🎉

> 🔐 **Bảo mật**: MongoDB URI được mã hóa và lưu an toàn, không xuất hiện trong config!

### Gỡ cài đặt

1. Mở **Command Palette** (`Ctrl+Shift+P`)
2. Chạy: `Preferences: Open User Settings (JSON)`
3. Tìm phần `"mcp"` và xóa `"mongo-mcp"` trong `"servers"`
4. Xóa input `"mongodb-uri"` trong `"inputs"` (nếu không dùng cho server khác)
5. Lưu file

## Các công cụ

| Công cụ            | Mô tả                                   |
| ------------------ | --------------------------------------- |
| `list_collections` | Liệt kê tất cả collections              |
| `infer_schema`     | Phân tích field types của collection    |
| `sample_data`      | Lấy documents mẫu với dữ liệu đã masked |
| `validate_query`   | Kiểm tra cú pháp MongoDB query          |

## Data Masking

| Loại        | Patterns                | Mask              |
| ----------- | ----------------------- | ----------------- |
| Credentials | password, secret, token | `[MASKED_SECRET]` |
| Email       | email                   | `[MASKED_EMAIL]`  |
| Phone       | phone, mobile           | `[MASKED_PHONE]`  |
| Tài chính   | credit_card, cvv        | `[MASKED_CARD]`   |

## Bảo mật

- **Chỉ đọc**: Không có thao tác ghi
- **PII masking**: Dữ liệu nhạy cảm tự động được ẩn
- **Mã hóa credentials**: MongoDB URI được VS Code lưu trữ an toàn

## Phát triển

```bash
npm test
npm run build
```

## Giấy phép

MIT

## Tác giả

Thai Phan ([@quocthai0404](https://github.com/quocthai0404))
