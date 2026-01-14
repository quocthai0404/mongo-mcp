# mongo-mcp

**English** | [Tiếng Việt](README.md)

A production-grade Model Context Protocol (MCP) Server that exposes MongoDB database schema, field types, sample data, and query validation to AI coding assistants.

## Features

- **Schema Overview** - High-level database metadata
- **List Collections** - Discover all user collections
- **Infer Schema** - Analyze collection structure with field types
- **Sample Data** - Retrieve example documents with PII masking
- **Validate Query** - Check MongoDB query syntax

## Installation

```bash
git clone https://github.com/quocthai0404/mongo-mcp.git
cd mongo-mcp
npm install
npm run build
```

## VS Code Setup

### Step 1: Add MCP Server

1. Open **Command Palette** (`Ctrl+Shift+P`)
2. Type and select: `MCP: Add Server`
3. Select: **Command (stdio)**
4. Enter Server ID: `mongo-mcp`
5. Enter Command: `node`
6. Select: **User Settings** (to use across all projects)

### Step 2: Configure Server

VS Code will open `settings.json`. Find the `mcp` section and **modify it to**:

```json
"mcp": {
  "inputs": [
    {
      "type": "promptString",
      "id": "mongodb-uri",
      "description": "Enter MongoDB URI (mongodb://... or mongodb+srv://...)",
      "password": true
    }
  ],
  "servers": {
    "mongo-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/mongo-mcp/dist/index.js"],
      "env": {
        "MONGODB_URI": "${input:mongodb-uri}"
      }
    }
  }
}
```

> ⚠️ **Important**: Replace `/absolute/path/to/mongo-mcp` with your actual path!
>
> Windows example: `"C:/Users/yourname/mongo-mcp/dist/index.js"`

### Step 3: Start Server

1. Open **Command Palette** (`Ctrl+Shift+P`)
2. Run: `MCP: List Servers`
3. Click **Start** on `mongo-mcp`
4. VS Code will **prompt for MongoDB URI** → Enter your connection string
5. Done! Server is running 🎉

> 🔐 **Security**: MongoDB URI is encrypted and stored securely, never exposed in config!

### Uninstall

1. Open **Command Palette** (`Ctrl+Shift+P`)
2. Run: `Preferences: Open User Settings (JSON)`
3. Find `"mcp"` section and remove `"mongo-mcp"` from `"servers"`
4. Remove `"mongodb-uri"` input from `"inputs"` (if not used by other servers)
5. Save file

## Available Tools

| Tool               | Description                     |
| ------------------ | ------------------------------- |
| `list_collections` | Returns all user collections    |
| `infer_schema`     | Analyzes collection field types |
| `sample_data`      | Returns masked sample documents |
| `validate_query`   | Validates MongoDB query syntax  |

## Data Masking

| Category    | Patterns                | Mask              |
| ----------- | ----------------------- | ----------------- |
| Credentials | password, secret, token | `[MASKED_SECRET]` |
| Email       | email                   | `[MASKED_EMAIL]`  |
| Phone       | phone, mobile           | `[MASKED_PHONE]`  |
| Financial   | credit_card, cvv        | `[MASKED_CARD]`   |

## Security

- **Read-only access**: No write operations
- **PII masking**: Sensitive fields automatically masked
- **Encrypted credentials**: MongoDB URI stored securely by VS Code

## Development

```bash
npm test
npm run build
```

## License

MIT

## Author

Thai Phan ([@quocthai0404](https://github.com/quocthai0404))
