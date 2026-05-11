/**
 * chainVerifier.js
 * ─────────────────────────────────────────────────────────────
 * Walks the BlockchainLog collection in chronological order
 * and verifies that each entry's `previousHash` correctly
 * references the hash of the entry before it.
 *
 * If any entry was tampered with or deleted, the chain breaks
 * and this utility reports exactly where.
 *
 * Used by: controllers/systemController.js → GET /api/system/verify-chain
 */

const crypto      = require("crypto");
const BlockchainLog = require("../models/BlockchainLog");

/**
 * Compute the canonical hash for a single log document.
 * We hash the fields that matter for integrity:
 *   type | hash | role | owner | attribute | policy | granted | chainIndex | timestamp
 *
 * Do NOT include _id or previousHash in the content hash —
 * _id is assigned by Mongo and previousHash is the link, not the content.
 */
const computeEntryHash = (log) => {
  const content = [
    log.type,
    log.hash       || "",
    log.role       || "",
    log.owner      || "",
    log.attribute  || "",
    log.policy     || "",
    String(log.granted   ?? ""),
    String(log.chainIndex ?? ""),
    new Date(log.timestamp).toISOString()
  ].join("|");

  return crypto.createHash("sha256").update(content).digest("hex");
};

/**
 * verifyChain()
 * Fetches all logs ordered by chainIndex (ascending) and
 * checks the previousHash linkage from entry to entry.
 *
 * Returns:
 * {
 *   valid: boolean,
 *   totalEntries: number,
 *   brokenAt: number | null,          // chainIndex where break was detected
 *   brokenEntryId: string | null,     // MongoDB _id of the bad entry
 *   message: string
 * }
 */
const verifyChain = async () => {
  const logs = await BlockchainLog
    .find()
    .sort({ chainIndex: 1 });

  if (logs.length === 0) {
    return {
      valid: true,
      totalEntries: 0,
      brokenAt: null,
      brokenEntryId: null,
      message: "Chain is empty — nothing to verify."
    };
  }

  let previousHash = "0".repeat(64); // Genesis previous hash

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];

    // 1. Verify the stored previousHash matches what we computed
    if (log.previousHash !== previousHash) {
      return {
        valid: false,
        totalEntries: logs.length,
        brokenAt: log.chainIndex,
        brokenEntryId: String(log._id),
        message: `Chain broken at index ${log.chainIndex}. ` +
                 `Expected previousHash "${previousHash.substring(0, 16)}..." ` +
                 `but found "${(log.previousHash || "").substring(0, 16)}...".`
      };
    }

    // 2. Recompute this entry's content hash and advance the pointer
    previousHash = computeEntryHash(log);
  }

  return {
    valid: true,
    totalEntries: logs.length,
    brokenAt: null,
    brokenEntryId: null,
    message: `All ${logs.length} log entries verified. Chain is intact ✅`
  };
};

module.exports = { verifyChain, computeEntryHash };