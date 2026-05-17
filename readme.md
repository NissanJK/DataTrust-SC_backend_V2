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
MONGO_URI=your-mongodb-connection-string
SECRET_KEY=your-strong-secret-key
PORT=your-server-port
NODE_ENV=your-runtime-environment
FRONTEND_URL=your-frontend-origin
```

Do not commit real connection strings, deployed service URLs, encryption secrets, API keys, tokens, or private infrastructure details.

Required variables:

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | Yes | MongoDB connection string. |
| `SECRET_KEY` | Yes | Encryption secret used by the crypto utilities. Keep it stable after data is encrypted. |
| `PORT` | No | Server port. |
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

The API runs on the configured `PORT`.

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

## API Overview

The backend exposes REST endpoints for datasets, access control, audit logs, disaster monitoring, system reset, chain verification, and health checks. Keep route-level documentation, request examples, deployment URLs, and private operational details in internal documentation rather than this public README.

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

- Set `FRONTEND_URL` to the approved frontend origin.
- Restart the backend after changing `.env`.
- Confirm preview deployment rules are appropriate for your production security requirements.

### Port already in use

Change `PORT` in `.env` or stop the process currently using the configured port.

## Author

- GitHub: [@NissanJK](https://github.com/NissanJK)
- Email: jawadul.karim78@gmail.com
