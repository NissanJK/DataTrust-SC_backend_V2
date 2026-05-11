/**
 * systemController.js  (updated)
 * ─────────────────────────────────────────────────────────────
 * Changes from original:
 *   1. resetSystem() is unchanged.
 *   2. New export: verifyChain() — walks the BlockchainLog and
 *      reports whether the chain is intact or broken.
 *      Exposed at GET /api/system/verify-chain
 */

const Dataset       = require("../models/Dataset");
const BlockchainLog = require("../models/BlockchainLog");
const { verifyChain: runVerification } = require("../utils/chainVerifier");

/* ─────────────────────────────────────────────────────────────
   RESET SYSTEM  (unchanged)
───────────────────────────────────────────────────────────── */
exports.resetSystem = async (req, res) => {
  try {
    console.log("🔄 System reset requested...");

    const datasetsDeleted = await Dataset.deleteMany({});
    console.log(`✅ Deleted ${datasetsDeleted.deletedCount} datasets`);

    const logsDeleted = await BlockchainLog.deleteMany({});
    console.log(`✅ Deleted ${logsDeleted.deletedCount} blockchain logs`);

    res.json({
      success: true,
      message: "System reset successful",
      deleted: {
        datasets: datasetsDeleted.deletedCount,
        logs:     logsDeleted.deletedCount
      }
    });

    console.log("✅ System reset complete!");

  } catch (error) {
    console.error("❌ Reset error:", error);
    res.status(500).json({
      success: false,
      message: "Reset failed",
      error:   error.message
    });
  }
};

/* ─────────────────────────────────────────────────────────────
   VERIFY CHAIN  (new)
   GET /api/system/verify-chain
───────────────────────────────────────────────────────────── */
exports.verifyChain = async (req, res) => {
  try {
    console.log("🔍 Chain verification requested...");

    const result = await runVerification();

    const statusCode = result.valid ? 200 : 409; // 409 Conflict if tampered

    res.status(statusCode).json({
      ...result,
      verifiedAt: new Date().toISOString()
    });

    console.log(`🔍 Chain verification complete — valid: ${result.valid}`);

  } catch (error) {
    console.error("❌ Chain verification error:", error);
    res.status(500).json({
      valid:   false,
      message: "Chain verification failed due to a server error",
      error:   error.message
    });
  }
};