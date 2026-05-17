# DataTrust-SC Backend

Express and MongoDB backend for DataTrust-SC, a trusted and privacy-preserving smart city data distribution framework. The API stores encrypted smart city datasets, evaluates access policies, records blockchain-style audit logs, supports CSV import/export, and exposes disaster monitoring endpoints for the frontend dashboard.

## Features

- REST API for dataset upload, listing, import, and export.
- AES-based encryption for stored dataset payloads.
- Attribute-based access control using role and attribute policy checks.
- Smart-contract-inspired policy execution helper.
- Blockchain-style audit log records with chain index, previous hash, and entry hash.
- Chain integrity verification endpoint.
- Disaster monitoring endpoints for alerts, sector statistics, and thresholds.
- MongoDB persistence with Mongoose models.
- Configurable CORS for local, deployed, and Vercel preview frontends.

## Tech Stack

- Node.js 16+
- Express
- MongoDB
- Mongoose
- Multer
- csv-parser
- crypto-js
- dotenv

## Repository

```bash
git clone https://github.com/NissanJK/DataTrust-SC_backend_V2.git
cd DataTrust-SC_backend_V2
```

## Prerequisites

- Node.js 16 or newer
- npm
- MongoDB local instance or MongoDB Atlas cluster

## Environment Variables

Create a `.env` file in the backend project root:

```env
MONGO_URI=mongodb://localhost:27017/DataTrust-SC
SECRET_KEY=replace-with-a-strong-secret-key-at-least-32-chars
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Required variables:

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | Yes | MongoDB connection string. |
| `SECRET_KEY` | Yes | Encryption secret used by the crypto utilities. Keep it stable after data is encrypted. |
| `PORT` | No | Server port. Defaults to `5000`. |
| `NODE_ENV` | No | Runtime environment. |
| `FRONTEND_URL` | No | Frontend origin allowed by CORS. |

## Installation

```bash
npm install
```

## Available Scripts

Start the server:

```bash
npm start
```

Start the server with nodemon:

```bash
npm run dev
```

The API runs at `http://localhost:5000` by default.

## Project Structure

```text
backend/
├── controllers/
│   ├── accessController.js
│   ├── datasetController.js
│   ├── disasterController.js
│   └── systemController.js
├── models/
│   ├── BlockchainLog.js
│   └── Dataset.js
├── routes/
│   ├── accessRoutes.js
│   ├── datasetRoutes.js
│   ├── disasterRoutes.js
│   └── systemRoutes.js
├── utils/
│   ├── chainVerifier.js
│   ├── crypto.js
│   ├── disasterMonitoring.js
│   └── SmartContract.js
├── server.js
├── package.json
└── readme.md
```

## API Reference

### Health

```http
GET /health
```

Returns server status and database connectivity.

### Dataset

```http
GET /api/dataset
```

Returns all dataset metadata without encrypted payloads.

```http
POST /api/dataset/upload
Content-Type: application/json
```

Required JSON fields:

```json
{
  "ownerRole": "CityAuthority",
  "Sector": "sector1",
  "Data_Provider_Type": "IoT Sensor",
  "Data_Category": "Environmental",
  "policy": "role:CityAuthority OR role:Researcher"
}
```

Optional metric fields include `Temperature_C`, `Air_Quality_Index`, `Traffic_Density`, `Energy_Consumption_kWh`, `Blockchain_Tx_Cost_Gas`, and `Authorization_Latency_sec`.

```http
POST /api/dataset/import
Content-Type: multipart/form-data
```

Upload a CSV file using the form field name `file`.

```http
GET /api/dataset/export
```

Downloads the stored dataset as CSV.

### Access Control

```http
POST /api/access/request
Content-Type: application/json
```

Request body:

```json
{
  "category": "Environmental",
  "role": "Researcher",
  "attribute": "sensitivity=public"
}
```

Returns decrypted records when the policy grants access.

```http
GET /api/access/logs
```

Returns blockchain-style audit log entries sorted by newest first.

### Disaster Monitoring

```http
GET /api/disaster/alerts
GET /api/disaster/alerts/:sector
GET /api/disaster/sectors/stats
GET /api/disaster/thresholds
```

These endpoints power the disaster warning center and sector analytics in the frontend.

### System

```http
POST /api/system/reset
```

Deletes all datasets and blockchain logs. Use only for local demos or controlled resets.

```http
GET /api/system/verify-chain
```

Verifies audit log chain integrity and returns `200` when valid or `409` when tampering or a broken chain is detected.

## Data Model Summary

Dataset records contain:

- `metadata`: smart city values and generated blockchain metrics.
- `encryptedPayload`: encrypted JSON payload.
- `hash`: unique SHA-256 record hash.
- `policy`: access policy string.
- `ownerRole`: owner role used during policy checks.
- `createdAt`: creation timestamp.

Blockchain log records contain:

- `type`: `DATA_REGISTER` or `ACCESS_REQUEST`.
- `hash`: related dataset hash.
- `role`, `attribute`, `policy`, and `granted` fields for access requests.
- `contractId`: generated policy contract identifier.
- `chainIndex`, `previousHash`, and `entryHash` for chain verification.
- `timestamp`: event time.

## Troubleshooting

### Missing environment variables

The server exits when `MONGO_URI` or `SECRET_KEY` is missing. Add both values to `.env` and restart.

### MongoDB connection failure

- Confirm MongoDB is running locally or the Atlas URI is valid.
- Confirm Atlas network access allows your current IP address.
- Confirm `MONGO_URI` includes the database name.

### CORS error from the frontend

- Set `FRONTEND_URL` to the frontend origin, for example `http://localhost:3000`.
- Restart the backend after changing `.env`.
- Vercel preview URLs ending in `.vercel.app` are allowed automatically.

### Port already in use

Change `PORT` in `.env` or stop the process currently using port `5000`.

## Author

- GitHub: [@NissanJK](https://github.com/NissanJK)
- Email: jawadul.karim78@gmail.com
