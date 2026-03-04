const {
  getOrCreatePrivateChat,
  createGroup,
  getUserChats,
  addUserToGroup,
  pinMessage,
  unpinMessage,
} = require("../../services/chat.service");
const Chat = require("../../models/chat.schema");
const Message = require("../../models/message.schema");
// Controller to handle API request
async function createOrGetPrivateChat(req, res) {
  try {
    const userId = req.userId; // logged-in user
    const { otherUserId } = req.body; // the user you want to chat with

    if (!otherUserId) {
      return res.status(400).json({ message: "Other user ID required" });
    }

    const chat = await getOrCreatePrivateChat(userId, otherUserId);

    res.status(200).json({ chat });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function createGroupChat(req, res) {
  try {
    const userId = req.userId; // logged-in user
    const { groupName, groupDescription } = req.body;
    const group = await createGroup(userId, groupName, groupDescription);
    if (!group) {
      return res.status(400).json({ message: "Failed to create group" });
    }
    res.status(200).json({ group });
  } catch (err) {
    console.error("Group chat error:", err);
    res.status(500).json({ message: "Server error" });
  }
}
// NEW function - finds chat by ID and returns other user info
async function getChatWithUser(req, res) {
  try {
    const userId = req.userId; // logged-in user
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({ message: "Chat ID required" });
    }

    const chat = await getChatById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Find the other participant (not the current user)
    const otherUser = chat.participants.find(
      (user) => user._id.toString() !== userId,
    );

    if (!otherUser) {
      return res.status(400).json({ message: "Invalid chat participants" });
    }

    res.status(200).json({
      chat,
      otherUser, // Now populated with full user data
    });
  } catch (err) {
    console.error("Get chat error:", err);
    res.status(500).json({ message: "Server error" });
  }
}
async function getPrivateChatById(req, res) {
  try {
    const { chatId } = req.params;
    const currentUserId = req.userId;

    const chat = await Chat.findById(chatId)
      .populate({
        path: "participants",
        select: "username email avatar displayName bio isOnline lastSeen",
      })
      .populate({
        path: "privateLastChat",
        select: "text senderId createdAt readBy type fileUrl fileName",
        populate: {
          path: "senderId",
          select: "username avatar ",
        },
      })
      .populate({
        path: "groupLastMessage",
        select: "text senderId createdAt readBy type fileUrl fileName",
        populate: {
          path: "senderId",
          select: "username avatar ",
        },
      })
      .populate({
        path: "pinnedMessages",
        select: "text senderId createdAt type fileUrl fileName",
        populate: {
          path: "senderId",
          select: "username avatar",
        },
      });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const otherUser = chat.participants.find(
      (p) => p._id.toString() !== currentUserId,
    );

    res.status(200).json({
      chat,
      otherUser,
    });
  } catch (error) {
    console.error("Get chat error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getUserChatsController(req, res) {
  try {
    const userId = req.userId;
    const { search } = req.query;
    const chats = await getUserChats(userId, search);

    res.status(200).json({ chats });
  } catch (error) {
    console.error("Get user chats error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

async function addUserToGroupController(req, res) {
  try {
    const adderId = req.userId; // From auth middleware
    const { userId, chatId } = req.body;

    // Validate required fields
    if (!userId || !chatId) {
      return res.status(400).json({
        error: "userId and chatId are required",
      });
    }

    // Validate userId and chatId are valid ObjectIds
    // if (!mongoose.Types.ObjectId.isValid(userId) ||
    //     !mongoose.Types.ObjectId.isValid(chatId)) {
    //   return res.status(400).json({
    //     error: "Invalid userId or chatId format"
    //   });
    // }

    const result = await addUserToGroup(userId, chatId, adderId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Add user to group error:", error);
    res.status(400).json({
      error: error.message || "Failed to add user to group",
    });
  }
}

async function uploadFileController(req, res) {
  try {
    const file = req.file;
    const fileUrl = `/uploads/${file.filename}`;

    res.status(200).json({
      url: fileUrl,
      filename: file.filename,
      success: true,
    });
  } catch (error) {
    console.error("Upload file error:", error);
    res.status(500).json({ message: "Server error" });
  }
}
async function getGroupInfo(req, res) {
  try {
    const { chatId } = req.params;
    const currentUserId = req.userId;

    const chat = await Chat.findById(chatId)
      .populate({
        path: "groupMembers",
        select: "username email avatar isOnline lastSeen",
      })
      .populate({
        path: "groupAdmins",
        select: "username email avatar isOnline lastSeen",
      });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat.type !== "group") {
      return res.status(400).json({ message: "This is not a group chat" });
    }

    // Check if current user is a member of the group
    const isMember = chat.groupMembers.some(
      (member) => member._id.toString() === currentUserId,
    );

    if (!isMember) {
      return res
        .status(403)
        .json({
          message: "Access denied. You are not a member of this group.",
        });
    }

    const groupInfo = {
      _id: chat._id,
      name: chat.groupName,
      description: chat.groupDescription,
      avatar: chat.groupAvatar,
      members: chat.groupMembers,
      admins: chat.groupAdmins,
      memberCount: chat.groupMembers.length,
      createdAt: chat.createdAt,
    };

    res.status(200).json({ group: groupInfo });
  } catch (error) {
    console.error("Get group info error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function pinMessageController(req, res) {
  try {
    const { chatId, messageId, action } = req.body; // action: 'pin' or 'unpin'
    const userId = req.userId;

    if (!chatId || !messageId) {
      return res.status(400).json({ message: "chatId and messageId required" });
    }

    let result;
    if (action === "unpin") {
      result = await unpinMessage(chatId, messageId);
    } else {
      result = await pinMessage(chatId, messageId);
    }

    res.status(200).json({
      message: action === "unpin" ? "Message unpinned" : "Message pinned",
      pinnedMessages: result,
    });
  } catch (error) {
    console.error("Pin message error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to pin/unpin message" });
  }
}

module.exports = {
  createOrGetPrivateChat,
  getChatWithUser,
  getPrivateChatById,
  createGroupChat,
  getUserChatsController,
  addUserToGroupController,
  uploadFileController,
  getGroupInfo,
  pinMessageController,
};
