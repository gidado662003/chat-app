require("dotenv").config();
const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Chat = require("../src/models/chat.schema");
const Message = require("../src/models/message.schema");
const User = require("../src/models/user.schema");

const server = http.createServer(app);

// Environment variables with defaults
const PORT = process.env.PORT || 5001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const MONGODB_URI = process.env.MONGODB_URI;
const NODE_ENV = process.env.NODE_ENV;

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

io.on("connection", async (socket) => {
  const userId = socket.handshake.auth.userId;
  try {
    const res = await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit("user_status_changed", { userId, status: "online" });
  } catch (error) {
    console.error("Error updating online status:", error);
  }

  // Join a specific chat room
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
  });

  // Typing indicators
  socket.on("typing", ({ chatId, user }) => {
    socket.to(chatId).emit("user_typing", { chatId, user });
  });

  socket.on("stop_typing", ({ chatId, userId }) => {
    socket.to(chatId).emit("user_stop_typing", { chatId, userId });
  });

  // Leave a specific chat room
  socket.on("leave_chat", (chatId) => {
    socket.leave(chatId);
  });

  // User is online
  // socket.on("user_is_online", (userId, isConnectd) => { })

  // Update pin message
  socket.on("update_pin", async ({ chatId, messageId, action }) => {
    try {
      io.to(chatId).emit("pin_updated", {
        chatId,
        messageId,
        action,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Pin update error:", error);
      socket.emit("error", { message: "Failed to update pin status" });
    }
  });
  // Delete message
  socket.on("message_delete", async ({ messageId, chatId }) => {
    io.to(chatId).emit("message_was_deleted", {
      messageId: messageId,
      chatId: chatId,
    });
  });

  // Mark as read
  socket.on("mark_as_read", async ({ chatId, userId }) => {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const chatObjectId = new mongoose.Types.ObjectId(chatId);

      const result = await Message.updateMany(
        {
          chatId: chatObjectId,
          readBy: { $ne: userObjectId },
        },
        {
          $addToSet: { readBy: userObjectId },
        },
      );

      if (result.modifiedCount > 0) {
        socket.to(chatId).emit("messages_read", { chatId, userId });

        // 2. Tell the Sidebars EVERYWHERE to refresh their lists
        // We send the chatId so sidebars know which chat changed
        io.emit("chat_list_update", { chatId, userId, reason: "read_receipt" });
      }
    } catch (err) {
      console.error("mark_as_read error:", err);
    }
  });

  // Send message
  socket.on("send_message", async (data) => {
    try {
      const messageData = {
        text: data.text,
        senderId: data.senderId,
        chatId: data.chatId,
        createdAt: data.timestamp || new Date().toISOString(),
        readBy: [data.senderId],
        type: data.type,
        fileUrl: data.fileUrl,
      };

      const newMessage = await Message.create(messageData);

      if (data.chatId) {
        const chat = await Chat.findById(data.chatId);
        if (!chat) return;

        if (chat.type === "group") {
          chat.groupMessages.push(newMessage._id);
          chat.groupLastMessage = newMessage._id;
        } else {
          chat.privateChat.push(newMessage._id);
          chat.privateLastChat = newMessage._id;
        }
        await chat.save();

        const populatedMessage = await Message.findById(newMessage._id)
          .populate("senderId", "username avatar")
          .populate("readBy", "username avatar");

        io.to(data.chatId).emit("receive_message", {
          ...populatedMessage.toObject(),
          chatId: data.chatId,
        });

        io.emit("chat_list_update", {
          chatId: data.chatId,
          lastMessage: {
            text: messageData.text,
            senderId: messageData.senderId,
            timestamp: messageData.createdAt,
          },
        });
      } else {
        io.emit("receive_message", messageData);
      }
    } catch (err) {
      console.error("send_message error:", err);
    }
  });

  socket.on("disconnect", async () => {
    const userId = socket.handshake.auth.userId;
    try {
      const res = await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });
      io.emit("user_status_changed", {
        userId,
        status: "offline",
        lastseen: new Date(),
      });
    } catch (error) {
      console.error("Error updating online status:", err);
    }
  });
});

/**
 * Start Server and Connect DB
 */
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    server.listen(PORT, () => {
      console.log(`Server started on port ${PORT} in ${NODE_ENV} mode`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

/**
 * Graceful Shutdown Handler
 * This prevents the EADDRINUSE (port 5001 busy) error on restarts
 */
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Closing HTTP server...`);

  // Close the server to free up the port
  server.close(async () => {
    console.log("HTTP server closed.");

    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");
      process.exit(0);
    } catch (err) {
      console.error("Error during MongoDB closure:", err);
      process.exit(1);
    }
  });

  // Force shutdown after 3 seconds if graceful fails
  setTimeout(() => {
    console.error("Forcefully shutting down after timeout.");
    process.exit(1);
  }, 3000);
};

// Listen for Nodemon and System signals
process.once("SIGUSR2", () => gracefulShutdown("SIGUSR2")); // Nodemon restart
process.on("SIGINT", () => gracefulShutdown("SIGINT")); // Ctrl+C
process.on("SIGTERM", () => gracefulShutdown("SIGTERM")); // System kill
startServer();
