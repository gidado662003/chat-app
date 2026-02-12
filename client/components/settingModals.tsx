import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import {
  createGroupChat,
  getAllusers,
  addUserToGroup,
  createOrGetPrivateChat,
  getGroupInfo,
  getUserChats,
} from "@/app/api";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/app/api";
import { socket } from "@/lib/socket";
import type { User, Chat, Message } from "@/lib/chatTypes";

export function CreateGroupChatModal() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [allUsers, setGetAllUsers] = useState();
  const [groupDescription, setGroupDescription] = useState("");
  const [groupAvatar, setGroupAvatar] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [groupAdmins, setGroupAdmins] = useState<string[]>([]);
  const [groupMessages, setGroupMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [open, setOpen] = useState(false);
  const [groupData, setGroupData] = useState({
    groupName: groupName,
    groupDescription: groupDescription,
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupData({
      ...groupData,
      [e.target.name]: e.target.value,
    });
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await getAllusers();

      setGetAllUsers(response.data?.users || []);
    } catch (error) {
      console.error("Fetch users error:", error);
    }
  };

  const handleCreateGroup = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await createGroupChat(groupData);

      setSuccess("Group created successfully");
      // Redirect to the new group chat - server returns { group }
      router.push(`chat/chats/${response.group._id}`);
      setOpen(false);
    } catch (error) {
      console.error("Failed to create group:", error);
      setError("Failed to create group");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">New Group</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Group Chat</DialogTitle>
          <DialogDescription>
            Create a new group chat with your friends.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <div className="grid flex-1 gap-2">
            <Input
              id="groupName"
              name="groupName"
              value={groupData.groupName}
              onChange={handleChange}
              placeholder="Enter group name"
            />
            <Input
              id="groupDescription"
              name="groupDescription"
              value={groupData.groupDescription}
              onChange={handleChange}
              placeholder="Enter group description"
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button type="button" variant="secondary" onClick={handleCreateGroup}>
            {isLoading ? "Creating Group..." : "Create Group"}
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddToGroup({ chatId }: { chatId: string }) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingUser, setAddingUser] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsersForGroup();
  }, []);

  const fetchUsersForGroup = async () => {
    setLoading(true);
    try {
      const response = await getAllusers();
      setAllUsers(response.data?.users || []);
    } catch (error) {
      console.error("AddToGroup: Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (userId: string) => {
    if (!chatId) {
      console.error("No chatId provided");
      return;
    }

    setAddingUser(userId);
    try {
      await addUserToGroup({ userId, chatId });
      // Remove the user from the list since they're now added
      setAllUsers((prev) => prev.filter((user) => user._id !== userId));
    } catch (error) {
      console.error("Failed to add user:", error);
    } finally {
      setAddingUser(null);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div>Add members</div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add To Group</DialogTitle>
          <DialogDescription>
            Select users to add to this group.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="max-h-48 overflow-y-auto space-y-2">
            {loading ? (
              <p className="text-gray-500 text-center py-4">Loading users...</p>
            ) : allUsers.length > 0 ? (
              allUsers
                .filter((user) =>
                  user.username.toLowerCase().includes(search.toLowerCase()),
                )
                .map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <button
                      onClick={() => handleAddUser(user._id)}
                      disabled={
                        addingUser === user._id ||
                        user?.joinedRooms?.includes(chatId)
                      }
                      className="ml-auto px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {addingUser === user._id ? "Adding..." : "Add"}
                    </button>
                  </div>
                ))
            ) : (
              <p className="text-gray-500 text-center py-4">No users found</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ImagePreviewModal({
  imageUrl,
  isOpen,
  onClose,
  onSend, // New callback prop
  selectedFile,
}: {
  imageUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (uploadedUrl: string, type: string) => void;
  selectedFile: File | null;
}) {
  const handleSend = async () => {
    try {
      const response = await uploadFile(selectedFile);
      const uploadedUrl = response.url;
      let type = "file"; // default
      if (selectedFile) {
        if (selectedFile.type.startsWith("image/")) {
          type = "image";
        } else if (selectedFile.type.startsWith("video/")) {
          type = "video";
        } else {
          type = "file"; // for documents
        }
      }
      onSend(uploadedUrl, type);
    } catch (error) {
      console.error("Failed to upload file:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Image Preview</DialogTitle>
          <DialogDescription>
            Preview the selected image before sending.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Image Preview"
              className="max-w-full max-h-96 object-contain rounded-lg"
            />
          )}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              handleSend();
              onClose();
            }}
            className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded"
          >
            Send
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GroupInfoModal({ chatId }: { chatId: string }) {
  const router = useRouter();
  const [groupInfo, setGroupInfo] = useState<any>(null);

  useEffect(() => {
    fetchGroupInfo();
  }, []);
  const fetchGroupInfo = async () => {
    try {
      const response = await getGroupInfo(chatId);
      setGroupInfo(response.group);
    } catch (error) {
      console.error("Failed to fetch group info:", error);
    }
  };
  const goToChat = async (userId: string) => {
    try {
      const response = await createOrGetPrivateChat(userId);
      if (response && response.chat) {
        router.push(`chat/chats/${response.chat._id}`);
      }
    } catch (error) {
      console.error("Failed to create/get private chat:", error);
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <button>Group Info</button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          {groupInfo ? (
            <div className="space-y-6">
              {/* Group Avatar and Basic Info */}
              {/* Top Section */}
              <center>
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {groupInfo.name?.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  {groupInfo.name}
                </h3>
              </center>

              {/* Bottom Section */}
              <div className="flex items-center gap-4 p-4 rounded-xl border">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">
                    Created {new Date(groupInfo.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-blue-600 font-medium">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      {groupInfo.memberCount} members
                    </span>
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      {groupInfo.admins?.length || 0} admins
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {groupInfo.description && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Description
                  </h4>
                  <p className="text-gray-800 leading-relaxed">
                    {groupInfo.description}
                  </p>
                </div>
              )}

              {/* Admins Section */}
              {groupInfo.admins && groupInfo.admins.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                    Group Admins ({groupInfo.admins.length})
                  </h4>
                  <div className="space-y-2">
                    {groupInfo.admins.map((admin: User) => (
                      <div
                        key={admin._id}
                        className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {admin.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {admin.username}
                          </p>
                          <p className="text-xs text-green-600 font-medium">
                            Administrator
                          </p>
                        </div>
                        <div
                          className={`w-3 h-3 rounded-full ${admin.isOnline ? "bg-green-400" : "bg-gray-300"}`}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members Section */}
              {groupInfo.members && groupInfo.members.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Group Members ({groupInfo.members.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {groupInfo.members.map((member: User) => (
                      <div
                        onClick={() => goToChat(member._id)}
                        key={member._id}
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {member.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            {member.email}
                          </p>
                        </div>
                        <div
                          className={`w-3 h-3 rounded-full ${member.isOnline ? "bg-green-400" : "bg-gray-300"}`}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600">Loading group information...</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ForwardeMessageModal({
  messageToForward,
}: {
  messageToForward: Message;
}) {
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [search, setSearch] = useState("");
  const { user: currentUser } = useAuthStore();
  const router = useRouter();
  console.log("Message to forward:", messageToForward);
  console.log("Current user:", currentUser);
  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await getUserChats("");
      setChatList(response.data?.chats || response.chats || []);
    } catch (error) {
      console.error("Fetch chats error:", error);
    }
  };

  const handleForwardMessage = async (chatId: string) => {
    setForwarding(true);
    try {
      socket.emit("send_message", {
        chatId: chatId,
        text: messageToForward.text,
        type: messageToForward.type,
        fileUrl: messageToForward.fileUrl || "",
        fileName: messageToForward.fileName || "",
        senderId: currentUser?._id,
        timestamp: new Date().toISOString(),
        forwardedFrom: messageToForward._id,
        originalSender: messageToForward.senderId,
        originalChatId: messageToForward.chatId,
        forwardedMessage: true,
      });

      router.push(`/chat/chats/${chatId}`);
    } catch (error) {
      console.error("Failed to forward message:", error);
    } finally {
      setForwarding(false);
    }
  };

  const getChatDisplayName = (chat: Chat): string => {
    if (chat.type === "group") {
      return chat.groupName || "Group Chat";
    } else {
      // For private chat, find the other participant's name
      const otherParticipant = chat.participants?.find(
        (p) => p._id !== currentUser?._id,
      );
      return otherParticipant?.username || "Private Chat";
    }
  };

  const getMemberCount = (chat: Chat): number => {
    if (chat.type === "group") {
      return chat.groupMembers?.length || 0;
    } else {
      return chat.participants?.length || 2;
    }
  };

  const filteredChats = chatList.filter((chat) =>
    getChatDisplayName(chat).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button>Forward message</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Forward Message</DialogTitle>
          <DialogDescription>
            Select a chat to forward this message to.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-48 overflow-y-auto space-y-2">
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <div
                  key={chat._id}
                  className="flex items-center justify-between p-2 hover:bg-gray-100 rounded"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {getChatDisplayName(chat)?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {getChatDisplayName(chat)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {chat.type === "group"
                          ? `${getMemberCount(chat)} members`
                          : "Private chat"}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleForwardMessage(chat._id)}
                    disabled={forwarding}
                  >
                    {forwarding ? "Forwarding..." : "Forward"}
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No chats found</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
