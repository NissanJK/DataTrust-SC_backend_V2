const fs      = require("fs");
const csv     = require("csv-parser");
const crypto  = require("crypto");

const Dataset            = require("../models/Dataset");
const BlockchainLog      = require("../models/BlockchainLog");
const { encrypt }        = require("../utils/crypto");
const PolicyContract     = require("../utils/SmartContract");
const { computeEntryHash } = require("../utils/chainVerifier");

// ── Helper: next chain index + previous hash ───────────────
// FIX: guard against old log entries that have no chainIndex field
// (written before the smart contract schema update). Without this,
// last.chainIndex is undefined → undefined + 1 = NaN → Mongoose
// rejects the create() call and the entire upload fails.
const getChainTip = async () => {
  const last = await BlockchainLog
    .findOne()
    .sort({ chainIndex: -1 })
    .lean();

  if (!last) {
    return { chainIndex: 0, previousHash: "0".repeat(64) };
  }

  const chainIndex = (typeof last.chainIndex === "number" && !isNaN(last.chainIndex))
    ? last.chainIndex + 1
    : 0; // fall back to 0 if old entry has no chainIndex

  return {
    chainIndex,
    previousHash: last.entryHash || "0".repeat(64)
  };
};

const generateBlockchainMetrics = () => ({
  Blockchain_Tx_Cost_Gas:    Math.floor(50000 + Math.random() * 30000),
  Authorization_Latency_sec: parseFloat((1 + Math.random() * 4).toFixed(2))
});

/* ─────────────────────────────────────────────────────────────
   DATA OWNER UPLOAD
───────────────────────────────────────────────────────────── */
exports.upload = async (req, res) => {
  try {
    const requiredFields = [
      "ownerRole", "Sector", "Data_Provider_Type", "Data_Category", "policy"
    ];
    const missing = requiredFields.filter(f => !req.body[f]);
    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    }

    const blockchainMetrics = generateBlockchainMetrics();
    const dataWithMetrics = {
      ...req.body,
      Blockchain_Tx_Cost_Gas:    req.body.Blockchain_Tx_Cost_Gas    || blockchainMetrics.Blockchain_Tx_Cost_Gas,
      Authorization_Latency_sec: req.body.Authorization_Latency_sec || blockchainMetrics.Authorization_Latency_sec
    };

    const payload   = JSON.stringify(dataWithMetrics, null, 2);
    const encrypted = encrypt(payload);
    const entropy   = crypto.randomBytes(8).toString("hex");
    const hash      = crypto.createHash("sha256").update(payload + entropy).digest("hex");

    const contract = new PolicyContract(req.body.policy, req.body.ownerRole, hash);
    console.log(`📜 PolicyContract deployed: ${contract.contractId.substring(0, 16)}...`);

    await Dataset.create({
      metadata:         dataWithMetrics,
      encryptedPayload: encrypted,
      hash,
      policy:           req.body.policy,
      ownerRole:        req.body.ownerRole
    });

    const { chainIndex, previousHash } = await getChainTip();

    const logData = {
      type:         "DATA_REGISTER",
      hash,
      owner:        req.body.ownerRole,
      policy:       req.body.policy,
      contractId:   contract.contractId,
      chainIndex,
      previousHash,
      timestamp:    new Date()
    };

    const entryHash = computeEntryHash({ ...logData, chainIndex, timestamp: logData.timestamp });
    await BlockchainLog.create({ ...logData, entryHash });

    res.json({ message: "Upload successful", hash, contractId: contract.contractId });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   CSV IMPORT
───────────────────────────────────────────────────────────── */
exports.importCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const records = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", row => records.push(row))
    .on("end", async () => {
      try {
        let importedCount = 0;
        let errorCount    = 0;

        for (const row of records) {
          try {
            const blockchainMetrics =
              row.Blockchain_Tx_Cost_Gas && row.Authorization_Latency_sec
                ? {
                    Blockchain_Tx_Cost_Gas:    parseInt(row.Blockchain_Tx_Cost_Gas),
                    Authorization_Latency_sec: parseFloat(row.Authorization_Latency_sec)
                  }
                : generateBlockchainMetrics();

            const metadata = {
              Record_ID:              row.Record_ID,
              Timestamp:              row.Timestamp,
              Sector:                 row.Sector,
              Data_Provider_Type:     row.Data_Provider_Type,
              Data_Owner:             row.Data_Owner || row.ownerRole,
              Data_Category:          row.Data_Category,
              Temperature_C:          row.Temperature_C          !== "-" ? parseFloat(row.Temperature_C)          : null,
              Air_Quality_Index:      row.Air_Quality_Index      !== "-" ? parseFloat(row.Air_Quality_Index)      : null,
              Traffic_Density:        row.Traffic_Density        !== "-" ? parseFloat(row.Traffic_Density)        : null,
              Energy_Consumption_kWh: row.Energy_Consumption_kWh !== "-" ? parseFloat(row.Energy_Consumption_kWh) : null,
              ...blockchainMetrics
            };

            const plaintext = JSON.stringify(metadata, null, 2);
            const encrypted = encrypt(plaintext);
            const entropy   = crypto.randomBytes(8).toString("hex");
            const hash      = crypto.createHash("sha256").update(plaintext + entropy).digest("hex");

            const ownerRole = row.ownerRole || row.Data_Owner || "System";
            const policy    = row.Access_Policy || "role:CityAuthority";

            const contract = new PolicyContract(policy, ownerRole, hash);

            await Dataset.create({
              metadata,
              encryptedPayload: encrypted,
              hash,
              ownerRole,
              policy
            });

            const { chainIndex, previousHash } = await getChainTip();

            const logData = {
              type:         "DATA_REGISTER",
              hash,
              owner:        ownerRole,
              policy,
              contractId:   contract.contractId,
              chainIndex,
              previousHash,
              timestamp:    new Date()
            };

            const entryHash = computeEntryHash({ ...logData, chainIndex, timestamp: logData.timestamp });
            await BlockchainLog.create({ ...logData, entryHash });

            importedCount++;
          } catch (rowError) {
            console.error(`Error importing row ${row.Record_ID}:`, rowError);
            errorCount++;
          }
        }

        fs.unlinkSync(req.file.path);

        res.json({
          message:  "CSV import completed",
          imported: importedCount,
          errors:   errorCount,
          total:    records.length
        });

      } catch (error) {
        console.error("CSV import error:", error);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: "CSV import failed", error: error.message });
      }
    })
    .on("error", (error) => {
      console.error("CSV parsing error:", error);
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(400).json({ message: "Failed to parse CSV file", error: error.message });
    });
};

/* ─────────────────────────────────────────────────────────────
   CSV EXPORT
───────────────────────────────────────────────────────────── */
exports.exportCSV = async (req, res) => {
  try {
    const data = await Dataset.find();

    let csvData =
      "Record_ID,Timestamp,Data_Owner,Sector,Data_Provider_Type,Data_Category," +
      "Temperature_C,Air_Quality_Index,Traffic_Density,Energy_Consumption_kWh," +
      "Blockchain_Tx_Cost_Gas,Authorization_Latency_sec\n";

    data.forEach((d, i) => {
      const m = d.metadata;
      csvData +=
        `${i + 1},${d.createdAt},${m.ownerRole || m.Data_Owner || "unknown"},` +
        `${m.Sector || "unknown"},${m.Data_Provider_Type},${m.Data_Category},` +
        `${m.Temperature_C          ?? "-"},` +
        `${m.Air_Quality_Index      ?? "-"},` +
        `${m.Traffic_Density        ?? "-"},` +
        `${m.Energy_Consumption_kWh ?? "-"},` +
        `${m.Blockchain_Tx_Cost_Gas ?? "-"},` +
        `${m.Authorization_Latency_sec ?? "-"}\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment("DataTrust-SC_dataset.csv");
    res.send(csvData);

  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: "Export failed", error: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   FETCH ALL
───────────────────────────────────────────────────────────── */
exports.getAll = async (req, res) => {
  try {
    const data = await Dataset.find({}, { encryptedPayload: 0 });
    res.json(data);
  } catch (error) {
    console.error("Get all error:", error);
    res.status(500).json({ message: "Failed to retrieve datasets", error: error.message });
  }
};