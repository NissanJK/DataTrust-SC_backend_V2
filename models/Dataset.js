const mongoose = require("mongoose");

const DatasetSchema = new mongoose.Schema({
  metadata: {
    type: Object,
    required: true
    // Contains: Sector, Data_Provider_Type, Data_Category, 
    // Temperature_C, Air_Quality_Index, Traffic_Density, Energy_Consumption_kWh, etc.
  },
  encryptedPayload: {
    type: String,
    required: true
  },
  hash: {
    type: String,
    required: true,
    unique: true
  },
  policy: {
    type: String,
    required: true
  },
  ownerRole: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster sector queries
DatasetSchema.index({ "metadata.Sector": 1 });
DatasetSchema.index({ "metadata.Data_Category": 1 });
DatasetSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Dataset", DatasetSchema);
