const express = require("express");
const Users = require("./users/users.route");
const Chats = require("./chats/chats.routes");
const Messages = require("./messages/messages.routes")
const Admin = require("./admin/admin.routes");
const InternalRequests = require("./internal-requisitions/requsition/requsition.route")
const authMiddleware = require("../middleware/authMiddleware");
const routes = express.Router();

routes.use("/user", Users);
routes.use("/admin", Admin);
routes.use("/chats", authMiddleware, Chats);
routes.use("/messages", authMiddleware, Messages);
routes.use("/internalrequest", authMiddleware, InternalRequests)
module.exports = routes;
