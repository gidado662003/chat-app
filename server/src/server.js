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

        // Tell the Sidebars to refresh their lists
        io.emit("chat_list_update", { chatId, userId, reason: "read_receipt" });
      }
    } catch (err) {
      console.error("mark_as_read error:", err);
    }
  });

  // Send message with reply support
  socket.on("send_message", async (data) => {
    try {
      // Prepare reply snapshot if this is a reply
      let replyToSnapshot = null;

      if (data.replyToMessageId) {
        try {
          const originalMessage = await Message.findById(
            data.replyToMessageId,
          ).populate("senderId", "username _id");

          if (originalMessage) {
            // Create snapshot of the original message
            replyToSnapshot = {
              _id: originalMessage._id.toString(),
              text: originalMessage.text || "",
              type: originalMessage.type || "text",
              fileName: originalMessage.fileName,
              fileUrl: originalMessage.fileUrl,
              senderId: {
                _id: originalMessage.senderId._id.toString(),
                username: originalMessage.senderId.username,
              },
              createdAt: originalMessage.createdAt,
            };
          }
        } catch (replyError) {
          console.error("Error fetching reply message:", replyError);
          // Continue without reply if original message not found
        }
      }

      // Prepare message data
      const messageData = {
        text: data.text,
        senderId: data.senderId,
        chatId: data.chatId,
        createdAt: data.timestamp || new Date().toISOString(),
        readBy: [data.senderId],
        type: data.type || "text",
        fileUrl: data.fileUrl,
        fileName: data.fileName,

        // Forwarded message fields
        forwardedMessage: data.forwardedMessage || false,
        forwardedFrom: data.forwardedFrom || null,
        originalSender: data.originalSender || null,
        originalChatId: data.originalChatId || null,

        // Reply fields
        replyTo: data.replyToMessageId || null,
        replyToSnapshot: replyToSnapshot,
      };

      // Create the new message
      const newMessage = await Message.create(messageData);

      // Update chat with new message
      if (data.chatId) {
        const chat = await Chat.findById(data.chatId);
        if (!chat) {
          console.error("Chat not found:", data.chatId);
          return;
        }

        if (chat.type === "group") {
          chat.groupMessages.push(newMessage._id);
          chat.groupLastMessage = newMessage._id;
        } else {
          chat.privateChat.push(newMessage._id);
          chat.privateLastChat = newMessage._id;
        }
        await chat.save();

        // Populate message for sending to clients
        const populatedMessage = await Message.findById(newMessage._id)
          .populate("senderId", "username avatar email _id")
          .populate("readBy", "username avatar email _id")
          .populate("originalSender", "username avatar")
          .populate("forwardedFrom");

        // Broadcast message to chat room
        io.to(data.chatId).emit("receive_message", {
          ...populatedMessage.toObject(),
          chatId: data.chatId,
        });

        // Update chat list for all users
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
      socket.emit("error", {
        message: "Failed to send message",
        error: err.message,
      });
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
      console.error("Error updating online status:", error);
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
