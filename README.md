# mongo-mcp

[English](README_en.md) | **Tiếng Việt**

MCP Server hoàn chỉnh cho phép AI coding assistants (GitHub Copilot, Claude, Gemini) truy cập và thao tác MongoDB database.

## ✨ Tính năng nổi bật

- **27 công cụ** - Đầy đủ CRUD, aggregation, index management
- **PII Masking** - Tự động ẩn dữ liệu nhạy cảm
- **Dynamic Database Selection** - Chọn database sau khi connect
- **Security Config** - Read-only mode và disabled tools

## 📦 Cài đặt (Chọn 1 trong 3 cách)

### Cách 1: NPX (Khuyên dùng - Không cần cài đặt)

Chỉ cần cấu hình VS Code bên dưới, `npx` sẽ tự động tải và chạy package.

### Cách 2: Từ source

```bash
git clone https://github.com/quocthai0404/mongo-mcp.git
cd mongo-mcp
npm install && npm run build
```

### Cách 3: Docker

> ⚠️ **Lưu ý**: MCP Server sử dụng stdio transport, chỉ hoạt động khi được gọi từ MCP client (VS Code). Không thể chạy standalone bằng `docker run` trực tiếp.

```bash
docker pull ghcr.io/quocthai0404/mongo-mcp
```

---

## ⚙️ Cấu hình VS Code

Thêm vào `settings.json` của VS Code:

### Dùng NPX (Cách 1 - Khuyên dùng)

```json
"mcp": {
  "inputs": [
    {
      "type": "promptString",
      "id": "mongodb-uri",
      "description": "MongoDB URI",
      "password": true
    }
  ],
  "servers": {
    "mongo-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "@quocthai0404/mongo-mcp"
      ],
      "env": {
        "MONGODB_URI": "${input:mongodb-uri}"
      }
    }
  }
}
```

### Dùng Docker (Cách 3)

```json
"mcp": {
  "inputs": [
    {
      "type": "promptString",
      "id": "mongodb-uri",
      "description": "MongoDB URI",
      "password": true
    }
  ],
  "servers": {
    "mongo-mcp": {
      "type": "stdio",
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "--env", "MONGODB_URI",
        "ghcr.io/quocthai0404/mongo-mcp"
      ],
      "env": {
        "MONGODB_URI": "${input:mongodb-uri}"
      }
    }
  }
}
```

## 🛠️ Các công cụ (27 tools)

### Core Database Operations

| Công cụ            | Mô tả                                        |
| ------------------ | -------------------------------------------- |
| `list_databases`   | Liệt kê tất cả databases trong cluster       |
| `use_database`     | Chọn database để làm việc                    |
| `current_database` | Xem database hiện tại                        |
| `list_collections` | Liệt kê collections                          |
| `find`             | Query documents với filter, projection, sort |
| `count`            | Đếm documents                                |
| `distinct`         | Lấy giá trị unique của field                 |

### Aggregation & Analysis

| Công cụ          | Mô tả                           |
| ---------------- | ------------------------------- |
| `aggregate`      | Chạy aggregation pipeline       |
| `explain`        | Phân tích query execution plan  |
| `db_stats`       | Thống kê database               |
| `infer_schema`   | Phân tích schema của collection |
| `sample_data`    | Lấy dữ liệu mẫu với PII masking |
| `validate_query` | Validate MongoDB query          |

### Write Operations

| Công cụ       | Mô tả                  | Safety     |
| ------------- | ---------------------- | ---------- |
| `insert_one`  | Insert 1 document      | ✅         |
| `insert_many` | Insert nhiều documents | ✅         |
| `update_one`  | Update 1 document      | ✅         |
| `update_many` | Update nhiều documents | ✅         |
| `delete_one`  | Xóa 1 document         | 🔒 confirm |
| `delete_many` | Xóa nhiều documents    | 🔒 confirm |

### Index Management

| Công cụ        | Mô tả           | Safety     |
| -------------- | --------------- | ---------- |
| `list_indexes` | Liệt kê indexes | ✅         |
| `create_index` | Tạo index       | ✅         |
| `drop_index`   | Xóa index       | 🔒 confirm |

### Collection/Database Management

| Công cụ                   | Mô tả              | Safety     |
| ------------------------- | ------------------ | ---------- |
| `create_collection`       | Tạo collection     | ✅         |
| `rename_collection`       | Đổi tên collection | ✅         |
| `collection_storage_size` | Xem storage stats  | ✅         |
| `drop_collection`         | Xóa collection     | 🔒 confirm |
| `drop_database`           | Xóa database       | 🔒 confirm |

> 🔒 **confirm**: Tools yêu cầu `confirm: true` để thực thi

## 🔐 Bảo mật

### Read-Only Mode

```bash
MONGODB_READONLY=true  # Block tất cả write operations
```

### Disabled Tools

```bash
MONGODB_DISABLED_TOOLS=drop_database,drop_collection
```

### PII Masking

| Loại        | Patterns                | Mask              |
| ----------- | ----------------------- | ----------------- |
| Credentials | password, secret, token | `[MASKED_SECRET]` |
| Email       | email                   | `[MASKED_EMAIL]`  |
| Phone       | phone, mobile           | `[MASKED_PHONE]`  |
| Financial   | credit_card, cvv        | `[MASKED_CARD]`   |

## 📝 Variables

| Variable                 | Default    | Description                      |
| ------------------------ | ---------- | -------------------------------- |
| `MONGODB_URI`            | _required_ | Connection string                |
| `MONGODB_TIMEOUT`        | 30000      | Connection timeout (ms)          |
| `SCHEMA_SAMPLE_SIZE`     | 1000       | Documents to sample              |
| `MONGODB_READONLY`       | false      | Read-only mode                   |
| `MONGODB_DISABLED_TOOLS` | ""         | Comma-separated tools to disable |

## 📄 Giấy phép

MIT - Thai Phan ([@quocthai0404](https://github.com/quocthai0404))
