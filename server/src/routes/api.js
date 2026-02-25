const express = require("express");
const Users = require("./users/users.route");
const Chats = require("./chats/chats.routes");
const Messages = require("./messages/messages.routes");
const Admin = require("./admin/admin.routes");
const InternalRequests = require("./internal-requisitions/requsition/requsition.route");
const authMiddleware = require("../middleware/authMiddleware");
const validateSanctumToken = require("../middleware/validateSanctumToken");
const dashboardMetrics = require("./internal-requisitions/dashboard/dashboard.route");
const meetingApp = require("./metting-app/meetingApp.route");
const Inventory = require("./inventory-system/inventory/inventory.routes");
const Asset = require("./inventory-system/asset/asset.routes");
const Products = require("./inventory-system/products/products.routes");
const BatchProduct = require("./inventory-system/batchProduct/batchProduct.routes");
const InventoryMovements = require("./inventory-system/inventoryMovement/inventoryMovement.routes");
const Supplier = require("./supplier/supplier.route");
const routes = express.Router();

routes.use("/admin", Admin);

routes.use(validateSanctumToken); // Apply token validation to all routes below
routes.use("/internalrequest/dashboard", dashboardMetrics);
routes.use("/user", Users);
routes.use("/chats", Chats);
routes.use("/messages", Messages);
routes.use("/internalrequest", InternalRequests);
routes.use("/inventory", Inventory);
routes.use("/asset", Asset);
routes.use("/meeting", meetingApp);
routes.use("/products", Products);
routes.use("/procurement-batches", BatchProduct);
routes.use("/inventory-movements", InventoryMovements);
routes.use("/suppliers", Supplier);
module.exports = routes;
