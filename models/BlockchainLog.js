/**
 * BlockchainLog.js  (updated)
 * ─────────────────────────────────────────────────────────────
 * Mongoose model for the audit log.
 *
 * New fields added to turn the flat log into a real chain:
 *   - previousHash  : SHA-256 hash of the immediately preceding log entry
 *   - entryHash     : SHA-256 hash of THIS entry's content
 *   - chainIndex    : monotonically increasing integer (0, 1, 2, …)
 *   - contractId    : ID of the PolicyContract that produced this event
 *                     (null for DATA_REGISTER entries where no access check ran)
 *
 * With these four fields every entry is cryptographically
 * linked to the one before it, so any tampering or deletion
 * can be detected by chainVerifier.js.
 */

const mongoose = require("mongoose");

const BlockchainLogSchema = new mongoose.Schema({
  // ── Original fields ────────────────────────────────────────
  type: {
    type: String,
    enum: ["DATA_REGISTER", "ACCESS_REQUEST"],
    required: true
  },
  hash:      { type: String },   // SHA-256 of the dataset payload
  role:      { type: String },
  owner:     { type: String },
  attribute: { type: String },
  policy:    { type: String },
  granted:   { type: Boolean },

  // ── Chain-linking fields (smart contract additions) ────────
  /**
   * Hash of the PREVIOUS log entry's content.
   * Genesis entry (chainIndex === 0) stores "0".repeat(64).
   */
  previousHash: {
    type: String,
    default: "0000000000000000000000000000000000000000000000000000000000000000"
  },

  /**
   * SHA-256 of this entry's own content fields.
   * Computed by chainVerifier.computeEntryHash() and stored at
   * write time so we don't have to recompute it during verification.
   */
  entryHash: {
    type: String,
    default: null
  },

  /**
   * Monotonically increasing position in the chain.
   * Computed as (count of existing logs) at write time.
   */
  chainIndex: {
    type: Number,
    default: 0
  },

  /**
   * ID of the PolicyContract instance that executed the
   * access check producing this log entry.
   * Null for DATA_REGISTER events.
   */
  contractId: {
    type: String,
    default: null
  },

  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index to support ordered chain walks
BlockchainLogSchema.index({ chainIndex: 1 });

module.exports = mongoose.model("BlockchainLog", BlockchainLogSchema);