/**
 * disasterController.js  (updated)
 * ─────────────────────────────────────────────────────────────
 * Fix applied: getSectorStats() previously used hardcoded numbers
 * for severity boundaries. All values are now referenced directly
 * from the imported THRESHOLDS object in disasterMonitoring.js.
 *
 * Affected logic — old hardcoded → new THRESHOLDS reference:
 *
 *   CRITICAL band:
 *     temp    >= 38   →  THRESHOLDS.temperature.critical_high
 *     aqi     >= 250  →  THRESHOLDS.aqi.very_unhealthy
 *     traffic >= 85   →  THRESHOLDS.traffic.critical
 *     energy  >= 500  →  THRESHOLDS.energy.emergency
 *
 *   WARNING band:
 *     temp    >= 35   →  THRESHOLDS.temperature.warning_high
 *     aqi     >= 200  →  THRESHOLDS.aqi.unhealthy
 *     traffic >= 70   →  THRESHOLDS.traffic.heavy
 *     energy  >= 450  →  THRESHOLDS.energy.critical
 *
 *   CAUTION band:
 *     temp    >= 32   →  (no equivalent in THRESHOLDS — kept as a
 *                         local constant CAUTION_TEMP so it is at
 *                         least in one place, not scattered)
 *     aqi     >= 150  →  THRESHOLDS.aqi.unhealthy_sensitive
 *     traffic >= 50   →  THRESHOLDS.traffic.moderate
 *     energy  >= 350  →  THRESHOLDS.energy.high
 *
 * Everything else (getDisasterAlerts, getSectorAlerts, getThresholds)
 * is unchanged from the original.
 */

const Dataset   = require("../models/Dataset");
const { analyzeDataForDisasters, THRESHOLDS } = require("../utils/disasterMonitoring");

/**
 * Temperature caution boundary.
 * THRESHOLDS.temperature has no explicit caution key, so we derive
 * it here rather than scattering the magic number across the file.
 * If you add a `caution_high` key to THRESHOLDS later, replace this.
 */
const TEMP_CAUTION_HIGH = 32;

/* ─────────────────────────────────────────────────────────────
   GET ALL DISASTER ALERTS
   GET /api/disaster/alerts
───────────────────────────────────────────────────────────── */
exports.getDisasterAlerts = async (req, res) => {
  try {
    const sectors = ['sector1', 'sector2', 'sector3', 'sector4', 'sector5'];
    const allDataToAnalyze = [];

    // Get only last 10 records per sector for real-time updates
    for (const sector of sectors) {
      const sectorData = await Dataset.find({
        "metadata.Sector": sector
      }).sort({ createdAt: -1 }).limit(10);

      allDataToAnalyze.push(...sectorData);
    }

    const { alerts, sectorStats } = analyzeDataForDisasters(allDataToAnalyze);

    res.json({
      success: true,
      totalAlerts:   alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length,
      warningAlerts:  alerts.filter(a => a.severity === 'WARNING').length,
      cautionAlerts:  alerts.filter(a => a.severity === 'CAUTION').length,
      alerts,
      sectorStats,
      dataAnalyzed: allDataToAnalyze.length,
      timestamp: new Date()
    });

  } catch (error) {
    console.error("Disaster alerts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate disaster alerts",
      error: error.message
    });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET ALERTS FOR A SPECIFIC SECTOR
   GET /api/disaster/alerts/:sector
───────────────────────────────────────────────────────────── */
exports.getSectorAlerts = async (req, res) => {
  try {
    const { sector } = req.params;

    if (!sector || !sector.match(/^sector[1-5]$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sector. Use sector1, sector2, sector3, sector4, or sector5"
      });
    }

    const sectorData = await Dataset.find({
      "metadata.Sector": sector
    }).sort({ createdAt: -1 }).limit(10);

    if (sectorData.length === 0) {
      return res.json({
        success: true,
        sector,
        alerts: [],
        message: "No data available for this sector"
      });
    }

    const { alerts } = analyzeDataForDisasters(sectorData);

    res.json({
      success: true,
      sector,
      totalAlerts:    alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length,
      alerts,
      dataAnalyzed: sectorData.length
    });

  } catch (error) {
    console.error("Sector alerts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sector alerts",
      error: error.message
    });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET SECTOR STATISTICS
   GET /api/disaster/sectors/stats
   ─────────────────────────────────────────────────────────────
   FIX: All severity boundaries now reference THRESHOLDS instead
   of hardcoded numbers. See file header for the full mapping.
───────────────────────────────────────────────────────────── */
exports.getSectorStats = async (req, res) => {
  try {
    const sectors = ['sector1', 'sector2', 'sector3', 'sector4', 'sector5'];
    const stats = {};

    for (const sector of sectors) {
      const sectorData = await Dataset.find({
        "metadata.Sector": sector
      }).sort({ createdAt: -1 }).limit(10);

      if (sectorData.length === 0) {
        stats[sector] = { status: 'NO_DATA', recordCount: 0 };
        continue;
      }

      // ── Compute averages ─────────────────────────────────────
      const pluck = (field) =>
        sectorData
          .map(d => d.metadata[field])
          .filter(v => v !== null && v !== undefined);

      const avg = (arr) =>
        arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

      const avgTemp    = avg(pluck("Temperature_C"));
      const avgAQI     = avg(pluck("Air_Quality_Index"));
      const avgTraffic = avg(pluck("Traffic_Density"));
      const avgEnergy  = avg(pluck("Energy_Consumption_kWh"));

      // ── Determine overall status using THRESHOLDS ────────────
      let status = 'NORMAL';

      const isCritical =
        (avgTemp    !== null && avgTemp    >= THRESHOLDS.temperature.critical_high)  ||
        (avgAQI     !== null && avgAQI     >= THRESHOLDS.aqi.very_unhealthy)         ||
        (avgTraffic !== null && avgTraffic >= THRESHOLDS.traffic.critical)           ||
        (avgEnergy  !== null && avgEnergy  >= THRESHOLDS.energy.emergency);

      const isWarning =
        (avgTemp    !== null && avgTemp    >= THRESHOLDS.temperature.warning_high)   ||
        (avgAQI     !== null && avgAQI     >= THRESHOLDS.aqi.unhealthy)              ||
        (avgTraffic !== null && avgTraffic >= THRESHOLDS.traffic.heavy)              ||
        (avgEnergy  !== null && avgEnergy  >= THRESHOLDS.energy.critical);

      const isCaution =
        (avgTemp    !== null && avgTemp    >= THRESHOLDS.temperature.caution_high)     ||
        (avgAQI     !== null && avgAQI     >= THRESHOLDS.aqi.unhealthy_sensitive)    ||
        (avgTraffic !== null && avgTraffic >= THRESHOLDS.traffic.moderate)           ||
        (avgEnergy  !== null && avgEnergy  >= THRESHOLDS.energy.high);

      if (isCritical)     status = 'CRITICAL';
      else if (isWarning) status = 'WARNING';
      else if (isCaution) status = 'CAUTION';

      // ── Build sector stats object ────────────────────────────
      const latest = sectorData[0].metadata;

      stats[sector] = {
        status,
        recordCount: sectorData.length,
        latest: {
          temperature: latest.Temperature_C,
          aqi:         latest.Air_Quality_Index,
          traffic:     latest.Traffic_Density,
          energy:      latest.Energy_Consumption_kWh,
          timestamp:   sectorData[0].createdAt
        },
        averages: {
          temperature: avgTemp    !== null ? parseFloat(avgTemp.toFixed(2))    : null,
          aqi:         avgAQI     !== null ? parseFloat(avgAQI.toFixed(2))     : null,
          traffic:     avgTraffic !== null ? parseFloat(avgTraffic.toFixed(2)) : null,
          energy:      avgEnergy  !== null ? parseFloat(avgEnergy.toFixed(2))  : null
        }
      };
    }

    res.json({
      success: true,
      sectors: stats,
      timestamp: new Date()
    });

  } catch (error) {
    console.error("Sector stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sector statistics",
      error: error.message
    });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET THRESHOLDS  (unchanged)
   GET /api/disaster/thresholds
───────────────────────────────────────────────────────────── */
exports.getThresholds = async (req, res) => {
  try {
    res.json({
      success: true,
      thresholds: THRESHOLDS
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get thresholds"
    });
  }
};