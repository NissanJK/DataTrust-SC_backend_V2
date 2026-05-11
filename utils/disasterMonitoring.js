/**
 * Disaster Warning & Aid Center - Monitoring Utility
 * Analyzes sensor data and generates alerts for potential disasters
 */

// Disaster thresholds based on smart city standards
const THRESHOLDS = {
  temperature: {
    critical_high: 38,    // Heat wave warning
    warning_high: 35,     // High heat alert
    caution_high: 32,
    warning_low: 5,       // Cold wave alert
    critical_low: 0       // Extreme cold warning
  },
  aqi: {
    good: 50,             // Good air quality
    moderate: 100,        // Moderate
    unhealthy_sensitive: 150, // Unhealthy for sensitive groups
    unhealthy: 200,       // Unhealthy
    very_unhealthy: 250,  // Very unhealthy
    hazardous: 300        // Hazardous - disaster level
  },
  traffic: {
    normal: 30,           // Normal traffic
    moderate: 50,         // Moderate congestion
    heavy: 70,            // Heavy traffic
    critical: 85          // Critical - possible emergency/evacuation
  },
  energy: {
    normal: 200,          // Normal consumption
    high: 350,            // High consumption
    critical: 450,        // Critical - possible grid overload
    emergency: 500        // Emergency - blackout risk
  }
};

/**
 * Analyze temperature data for heat waves, cold waves
 */
const analyzeTemperature = (temp, sector) => {
  if (temp === null || temp === undefined) return null;

  if (temp >= THRESHOLDS.temperature.critical_high) {
    return {
      type: 'HEAT_WAVE',
      severity: 'CRITICAL',
      sector,
      metric: 'Temperature',
      value: temp,
      message: `🔥 CRITICAL: Extreme heat detected in ${sector}`,
      recommendation: 'Stay indoors, hydrate frequently, check on elderly neighbors',
      actions: [
        'Open cooling centers',
        'Issue public health advisory',
        'Deploy emergency medical teams'
      ]
    };
  }

  if (temp >= THRESHOLDS.temperature.warning_high) {
    return {
      type: 'HIGH_TEMPERATURE',
      severity: 'WARNING',
      sector,
      metric: 'Temperature',
      value: temp,
      message: `⚠️ WARNING: High temperature in ${sector}`,
      recommendation: 'Limit outdoor activities, stay hydrated',
      actions: ['Monitor vulnerable populations', 'Prepare cooling centers']
    };
  }

  if (temp <= THRESHOLDS.temperature.critical_low) {
    return {
      type: 'EXTREME_COLD',
      severity: 'CRITICAL',
      sector,
      metric: 'Temperature',
      value: temp,
      message: `❄️ CRITICAL: Extreme cold detected in ${sector}`,
      recommendation: 'Stay indoors, avoid exposure, check heating systems',
      actions: [
        'Open warming centers',
        'Check on homeless population',
        'Deploy emergency heating units'
      ]
    };
  }

  if (temp <= THRESHOLDS.temperature.warning_low) {
    return {
      type: 'COLD_WAVE',
      severity: 'WARNING',
      sector,
      metric: 'Temperature',
      value: temp,
      message: `🌡️ WARNING: Cold wave in ${sector}`,
      recommendation: 'Dress warmly, limit outdoor exposure',
      actions: ['Prepare warming centers', 'Monitor heating systems']
    };
  }

  return null;
};

/**
 * Analyze Air Quality Index for pollution disasters
 */
const analyzeAQI = (aqi, sector) => {
  if (aqi === null || aqi === undefined) return null;

  if (aqi >= THRESHOLDS.aqi.hazardous) {
    return {
      type: 'AIR_POLLUTION_HAZARDOUS',
      severity: 'CRITICAL',
      sector,
      metric: 'Air Quality Index',
      value: aqi,
      message: `☠️ CRITICAL: Hazardous air quality in ${sector}`,
      recommendation: 'Stay indoors, seal windows, use air purifiers, wear N95 masks if going outside',
      actions: [
        'Issue emergency air quality alert',
        'Close schools and public facilities',
        'Restrict vehicle movement',
        'Deploy medical teams for respiratory emergencies'
      ]
    };
  }

  if (aqi >= THRESHOLDS.aqi.very_unhealthy) {
    return {
      type: 'AIR_POLLUTION_SEVERE',
      severity: 'CRITICAL',
      sector,
      metric: 'Air Quality Index',
      value: aqi,
      message: `🚨 CRITICAL: Very unhealthy air quality in ${sector}`,
      recommendation: 'Avoid all outdoor activities, vulnerable groups stay indoors',
      actions: [
        'Issue health advisory',
        'Restrict industrial emissions',
        'Recommend work-from-home'
      ]
    };
  }

  if (aqi >= THRESHOLDS.aqi.unhealthy) {
    return {
      type: 'AIR_POLLUTION_UNHEALTHY',
      severity: 'WARNING',
      sector,
      metric: 'Air Quality Index',
      value: aqi,
      message: `⚠️ WARNING: Unhealthy air quality in ${sector}`,
      recommendation: 'Limit outdoor activities, sensitive groups stay indoors',
      actions: ['Monitor air quality', 'Advise vulnerable populations']
    };
  }

  if (aqi >= THRESHOLDS.aqi.unhealthy_sensitive) {
    return {
      type: 'AIR_POLLUTION_MODERATE',
      severity: 'CAUTION',
      sector,
      metric: 'Air Quality Index',
      value: aqi,
      message: `⚡ CAUTION: Air quality unhealthy for sensitive groups in ${sector}`,
      recommendation: 'Sensitive groups limit prolonged outdoor activities',
      actions: ['Monitor sensitive populations']
    };
  }

  return null;
};

/**
 * Analyze traffic density for emergencies/evacuations
 */
const analyzeTraffic = (traffic, sector) => {
  if (traffic === null || traffic === undefined) return null;

  if (traffic >= THRESHOLDS.traffic.critical) {
    return {
      type: 'TRAFFIC_EMERGENCY',
      severity: 'CRITICAL',
      sector,
      metric: 'Traffic Density',
      value: traffic,
      message: `🚦 CRITICAL: Emergency traffic situation in ${sector}`,
      recommendation: 'Avoid area, possible emergency or evacuation in progress',
      actions: [
        'Deploy traffic police',
        'Activate emergency routes',
        'Coordinate with emergency services',
        'Check for accidents or disasters'
      ]
    };
  }

  if (traffic >= THRESHOLDS.traffic.heavy) {
    return {
      type: 'TRAFFIC_HEAVY',
      severity: 'WARNING',
      sector,
      metric: 'Traffic Density',
      value: traffic,
      message: `⚠️ WARNING: Heavy traffic congestion in ${sector}`,
      recommendation: 'Use alternate routes, expect delays',
      actions: ['Monitor traffic flow', 'Consider traffic management measures']
    };
  }

  return null;
};

/**
 * Analyze energy consumption for grid failures
 */
const analyzeEnergy = (energy, sector) => {
  if (energy === null || energy === undefined) return null;

  if (energy >= THRESHOLDS.energy.emergency) {
    return {
      type: 'POWER_GRID_EMERGENCY',
      severity: 'CRITICAL',
      sector,
      metric: 'Energy Consumption',
      value: energy,
      message: `⚡ CRITICAL: Grid overload emergency in ${sector}`,
      recommendation: 'Reduce non-essential power usage immediately, blackout imminent',
      actions: [
        'Implement emergency load shedding',
        'Alert hospitals and critical infrastructure',
        'Deploy backup generators',
        'Prepare for potential blackout'
      ]
    };
  }

  if (energy >= THRESHOLDS.energy.critical) {
    return {
      type: 'POWER_GRID_CRITICAL',
      severity: 'WARNING',
      sector,
      metric: 'Energy Consumption',
      value: energy,
      message: `⚠️ WARNING: Critical energy consumption in ${sector}`,
      recommendation: 'Reduce power usage, grid strain detected',
      actions: ['Monitor grid stability', 'Prepare load management']
    };
  }

  if (energy >= THRESHOLDS.energy.high) {
    return {
      type: 'POWER_HIGH_USAGE',
      severity: 'CAUTION',
      sector,
      metric: 'Energy Consumption',
      value: energy,
      message: `⚡ CAUTION: High energy consumption in ${sector}`,
      recommendation: 'Consider reducing non-essential power usage',
      actions: ['Monitor grid load']
    };
  }

  return null;
};

/**
 * Multi-factor disaster detection
 * Checks for combined conditions that indicate major disasters
 */
const detectMultiFactorDisasters = (data, sector) => {
  const alerts = [];

  // Heat wave + High energy = Cooling emergency
  if (data.Temperature_C >= 35 && data.Energy_Consumption_kWh >= 400) {
    alerts.push({
      type: 'HEAT_EMERGENCY',
      severity: 'CRITICAL',
      sector,
      metric: 'Multiple',
      message: `🔥 CRITICAL: Heat emergency in ${sector} - Grid at risk`,
      recommendation: 'Cooling centers at capacity, power grid stressed',
      actions: [
        'Prioritize power to critical cooling facilities',
        'Expand cooling center capacity',
        'Deploy emergency medical teams'
      ]
    });
  }

  // High AQI + High traffic = Pollution crisis
  if (data.Air_Quality_Index >= 200 && data.Traffic_Density >= 70) {
    alerts.push({
      type: 'POLLUTION_CRISIS',
      severity: 'CRITICAL',
      sector,
      metric: 'Multiple',
      message: `☠️ CRITICAL: Pollution crisis in ${sector} - Traffic contributing to hazard`,
      recommendation: 'Immediate traffic restrictions needed',
      actions: [
        'Implement odd-even vehicle restrictions',
        'Close non-essential industries',
        'Issue public health emergency'
      ]
    });
  }

  // Low temp + High energy = Heating emergency
  if (data.Temperature_C <= 5 && data.Energy_Consumption_kWh >= 400) {
    alerts.push({
      type: 'COLD_EMERGENCY',
      severity: 'CRITICAL',
      sector,
      metric: 'Multiple',
      message: `❄️ CRITICAL: Cold emergency in ${sector} - Heating strain`,
      recommendation: 'Power grid strained by heating demand',
      actions: [
        'Prioritize power to heating',
        'Open emergency warming centers',
        'Check vulnerable populations'
      ]
    });
  }

  return alerts;
};

/**
 * Main disaster analysis function
 */
const analyzeDataForDisasters = (dataRecords) => {
  const alerts = [];
  const sectorStats = {
    sector1: { alerts: 0, critical: 0 },
    sector2: { alerts: 0, critical: 0 },
    sector3: { alerts: 0, critical: 0 },
    sector4: { alerts: 0, critical: 0 },
    sector5: { alerts: 0, critical: 0 }
  };

  for (const record of dataRecords) {
    const sector = record.metadata.Sector || 'unknown';
    const data = record.metadata;

    // Individual metric analysis
    const tempAlert = analyzeTemperature(data.Temperature_C, sector);
    const aqiAlert = analyzeAQI(data.Air_Quality_Index, sector);
    const trafficAlert = analyzeTraffic(data.Traffic_Density, sector);
    const energyAlert = analyzeEnergy(data.Energy_Consumption_kWh, sector);

    // Multi-factor analysis
    const multiAlerts = detectMultiFactorDisasters(data, sector);

    // Collect all alerts
    [tempAlert, aqiAlert, trafficAlert, energyAlert, ...multiAlerts]
      .filter(Boolean)
      .forEach(alert => {
        alerts.push({
          ...alert,
          timestamp: record.createdAt,
          recordId: record._id
        });

        // Update stats
        if (sectorStats[sector]) {
          sectorStats[sector].alerts++;
          if (alert.severity === 'CRITICAL') {
            sectorStats[sector].critical++;
          }
        }
      });
  }

  // Sort by severity
  alerts.sort((a, b) => {
    const severityOrder = { CRITICAL: 0, WARNING: 1, CAUTION: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return { alerts, sectorStats };
};

module.exports = {
  analyzeDataForDisasters,
  analyzeTemperature,
  analyzeAQI,
  analyzeTraffic,
  analyzeEnergy,
  THRESHOLDS
};
