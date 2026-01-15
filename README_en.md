# mongo-mcp

**English** | [Tiếng Việt](README.md)

A production-grade Model Context Protocol (MCP) Server that exposes MongoDB database schema, field types, sample data, and query validation to AI coding assistants.

## Features

- **Schema Overview** - High-level database metadata
- **List Collections** - Discover all user collections
- **Infer Schema** - Analyze collection structure with field types
- **Sample Data** - Retrieve example documents with PII masking
- **Validate Query** - Check MongoDB query syntax

## Installation (Choose ONE)

### Option 1: NPX (Recommended - No installation needed)

Just configure VS Code below, `npx` will automatically download and run the package.

### Option 2: From source

```bash
git clone https://github.com/quocthai0404/mongo-mcp.git
cd mongo-mcp
npm install && npm run build
```

### Option 3: Docker

> ⚠️ **Note**: MCP Server uses stdio transport, it only works when called from an MCP client (VS Code). Cannot run standalone with `docker run` directly.

```bash
docker pull ghcr.io/quocthai0404/mongo-mcp
```

---

## VS Code Setup

Add the following to your VS Code `settings.json`:

### Using NPX (Option 1 - Recommended)

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

### Using Docker (Option 3)

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

### Start Server

1. Open **Command Palette** (`Ctrl+Shift+P`)
2. Run: `MCP: List Servers`
3. Click **Start** on `mongo-mcp`
4. VS Code will **prompt for MongoDB URI** → Enter your connection string
5. Done! Server is running 🎉

> 🔐 **Security**: MongoDB URI is encrypted and stored securely by VS Code!

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
