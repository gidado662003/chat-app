const express = require("express");
const Users = require("./users/users.route");
const Chats = require("./chats/chats.routes");
const Messages = require("./messages/messages.routes")
const Admin = require("./admin/admin.routes");
const InternalRequests = require("./internal-requisitions/requsition/requsition.route")
const authMiddleware = require("../middleware/authMiddleware");
const validateSanctumToken = require("../middleware/validateSanctumToken");
const dashboardMetrics = require("./internal-requisitions/dashboard/dashboard.route")
const meetingApp = require("./metting-app/meetingApp.route")
const routes = express.Router();

routes.use("/internalrequest/dashboard", dashboardMetrics)
routes.use("/user", validateSanctumToken, Users);
routes.use("/admin", Admin);
routes.use("/chats", validateSanctumToken, Chats);
routes.use("/messages", validateSanctumToken, Messages);
routes.use("/internalrequest", validateSanctumToken, InternalRequests)
routes.use("/meeting", meetingApp)
module.exports = routes;
