const AssetHistory = require("../../../models/assetHistory.schema");

const assetHistoryController = {
  getHistoryForAsset: async (req, res) => {
    try {
      const { assetId } = req.params;
      const history = await AssetHistory.find({ asset: assetId })
        .sort({ createdAt: -1 });
      res.status(200).json(history);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = assetHistoryController;

