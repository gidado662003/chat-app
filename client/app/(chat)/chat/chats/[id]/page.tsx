"use client";

import { useEffect, useState, use, useRef } from "react";
import { socket } from "../../../../../lib/socket";
import {
  FiSend,
  FiWifi,
  FiWifiOff,
  FiUser,
  FiCopy,
  FiTrash2,
  FiMaximize2,
  FiFileText,
  FiDownload,
  FiMapPin,
  FiImage,
  FiFile,
  FiVideo,
  FiPhoneCall,
  FiMoreVertical,
  FiPhoneForwarded,
  FiCornerUpLeft, // NEW: Reply icon
  FiX, // NEW: Close icon
  FiSearch,
} from "react-icons/fi";
import { useSocketStore } from "../../../../../store/useSocketStore";
import {
  getPrivateChatById,
  getChatMesssages,
  pinChat,
  deleteMessage,
} from "@/app/api";
import { useAuthStore } from "@/lib/store";
import { AddToGroup, GroupInfoModal } from "@/components/settingModals";
import { SettingDropdown } from "@/components/settingDropdDown";
import { ForwardeMessageModal } from "@/components/settingModals";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import type {
  User,
  Message,
  GroupInfo,
  ReplyToSnapshot,
} from "@/lib/chatTypes";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { id } = use(params);
  const { user: currentUser } = useAuthStore();
  const isConnected = useSocketStore((state) => state.isConnected);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [chat, setChat] = useState<any>(null);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [typing, setTyping] = useState<boolean>(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [cursorTimestamp, setCursorTimestamp] = useState<string>("");
  const [cursorId, setCursorId] = useState("");
  const currentUserId = currentUser?._id ?? "";
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingOlderMessagesRef = useRef<boolean>(false);
  const lastMessageIdRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  // NEW: Reply state
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const API_URL = "http://10.10.253.3:5001";

  useEffect(() => {
    if (chat?.type === "group") {
      const lastAtIndex = message.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        const textAfterAt = message.slice(lastAtIndex + 1);
        const hasSpace = textAfterAt.includes(" ");

        if (!hasSpace) {
          setMentionQuery(textAfterAt.toLowerCase());
          setIsMentionOpen(true);
        } else {
          setIsMentionOpen(false);
          setMentionQuery("");
        }
      } else {
        setIsMentionOpen(false);
        setMentionQuery("");
      }
    } else {
      setIsMentionOpen(false);
      setMentionQuery("");
    }
  }, [message, chat?.type]);

  // Filter participants based on search
  const filteredParticipants =
    chat?.participants?.filter((part: any) =>
      part.username.toLowerCase().includes(mentionQuery),
    ) || [];

  // Grouping Logic
  const getDateKey = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toISOString().split("T")[0];
  };

  const messagesToShow =
    messageSearchQuery.trim() === ""
      ? messages
      : messages.filter((msg) => {
          const q = messageSearchQuery.toLowerCase();
          const text = (msg.text ?? "").toLowerCase();
          const fileName = (msg.fileName ?? "").toLowerCase();
          return text.includes(q) || fileName.includes(q);
        });

  const groupedMessages = messagesToShow.reduce(
    (acc: Record<string, Message[]>, msg) => {
      const dayKey = getDateKey(msg.createdAt);
      if (!acc[dayKey]) acc[dayKey] = [];
      acc[dayKey].push(msg);
      return acc;
    },
    {},
  );

  const formatDayLabel = (dayKey: string) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const dayDate = new Date(dayKey);

    if (dayDate.toDateString() === today.toDateString()) return "Today";

    if (dayDate.toDateString() === yesterday.toDateString()) return "Yesterday";

    return new Date(dayKey).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    const fetchChat = async () => {
      try {
        const response = await getPrivateChatById(id);
        const messagesData = await getChatMesssages(
          response.chat._id,
          cursorTimestamp,
          cursorId,
        );
        setChat(response.chat);
        const initialMessages = [...messagesData.data.messages].reverse();
        setMessages(initialMessages);
        if (initialMessages.length > 0) {
          lastMessageIdRef.current =
            initialMessages[initialMessages.length - 1]._id;
        }

        if (
          messagesData.data.nextCursor?.timestamp &&
          messagesData.data.nextCursor?.id
        ) {
          setCursorTimestamp(messagesData.data.nextCursor.timestamp);
          setCursorId(messagesData.data.nextCursor.id);
          setHasMoreMessages(messagesData.data.hasMore);
        } else {
          setCursorTimestamp("");
          setCursorId("");
          setHasMoreMessages(false);
        }

        if (response.chat.type === "group") {
          setUser(null);
          setGroupInfo({
            name: response.chat.groupName,
            description: response.chat.groupDescription,
            members: response.chat.groupMembers,
            admins: response.chat.groupAdmins,
          });
        } else {
          setUser(response.otherUser);
          setGroupInfo(null);
        }
      } catch (error) {
        console.error("Failed to fetch chat:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChat();
  }, [id]);

  async function handleGetMessages() {
    if (!chat?._id || isLoading || !scrollContainerRef.current) return;
    isLoadingOlderMessagesRef.current = true;
    const container = scrollContainerRef.current;
    const prevScrollHeight = container.scrollHeight;

    const newMessagesData = await getChatMesssages(
      chat._id,
      cursorTimestamp,
      cursorId,
    );

    if (
      newMessagesData.data.nextCursor?.timestamp &&
      newMessagesData.data.nextCursor?.id
    ) {
      setCursorTimestamp(newMessagesData.data.nextCursor.timestamp);
      setCursorId(newMessagesData.data.nextCursor.id);
    } else {
      setHasMoreMessages(false);
    }

    const olderMessages = [...newMessagesData.data.messages].reverse();
    setMessages((prevMessages) => {
      const existingIds = new Set(prevMessages.map((m) => m._id));
      const uniqueOlder = olderMessages.filter(
        (m: Message) => !existingIds.has(m._id),
      );
      return [...uniqueOlder, ...prevMessages];
    });

    requestAnimationFrame(() => {
      const newScrollHeight = container.scrollHeight;
      container.scrollTop += newScrollHeight - prevScrollHeight;
      isLoadingOlderMessagesRef.current = false;
    });
  }

  useEffect(() => {
    if (!id) return;
    socket.emit("join_chat", id);
    socket.emit("mark_as_read", { chatId: id, userId: currentUserId });
    return () => {
      socket.emit("leave_chat", id);
    };
  }, [id, currentUserId]);

  useEffect(() => {
    const handleReceiveMessage = (msg: Message) => {
      if (msg.chatId !== id) return;
      setMessages((prev) => [...prev, msg]);
      socket.emit("mark_as_read", { chatId: id, userId: currentUserId });
    };
    socket.on("receive_message", handleReceiveMessage);
    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [id, currentUserId]);

  useEffect(() => {
    const handleMessagesRead = ({
      chatId,
      userId,
    }: {
      chatId: string;
      userId: string;
    }) => {
      if (chatId !== id) return;
      let readingUser =
        chat?.type === "group"
          ? groupInfo?.members.find((member) => member._id === userId)
          : user?._id === userId
            ? user
            : undefined;
      if (!readingUser) return;
      setMessages((prev) =>
        prev.map((msg) => {
          if (!msg.readBy?.some((u) => u._id === userId)) {
            return {
              ...msg,
              readBy: [...(msg.readBy || []), readingUser as User],
            };
          }
          return msg;
        }),
      );
    };
    socket.on("messages_read", handleMessagesRead);
    return () => {
      socket.off("messages_read", handleMessagesRead);
    };
  }, [id, chat, user, groupInfo]);

  const displayName =
    (currentUser as { displayName?: string })?.displayName ??
    currentUser?.username ??
    currentUser?.email?.split("@")[0] ??
    "Someone";

  function handleTyping() {
    if (!typing) {
      setTyping(true);
      socket.emit("typing", { chatId: id, user: displayName });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { chatId: id, userId: currentUserId });
      setTyping(false);
    }, 1000);
  }

  useEffect(() => {
    const onUserTyping = ({
      chatId,
      user,
    }: {
      chatId: string;
      user: string;
    }) => {
      if (chatId === id) setTypingUser(user);
    };
    const onUserStopTyping = ({ chatId }: { chatId: string }) => {
      if (chatId === id) setTypingUser(null);
    };
    socket.on("user_typing", onUserTyping);
    socket.on("user_stop_typing", onUserStopTyping);
    return () => {
      socket.off("user_typing", onUserTyping);
      socket.off("user_stop_typing", onUserStopTyping);
    };
  }, [id]);

  useEffect(() => {
    const handleMessageDeleted = ({
      messageId,
      chatId,
    }: {
      messageId: string;
      chatId: string;
    }) => {
      if (chatId === id) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId
              ? { ...msg, isDeleted: true, text: "Message deleted" }
              : msg,
          ),
        );
      }
    };
    socket.on("message_was_deleted", handleMessageDeleted);
    return () => {
      socket.off("message_was_deleted", handleMessageDeleted);
    };
  }, [id]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const isNewMessage = lastMessage?._id !== lastMessageIdRef.current;
    if (isNewMessage) {
      lastMessageIdRef.current = lastMessage?._id || null;
    }
    if (isLoadingOlderMessagesRef.current) return;
    const scrollToBottom = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "instant", block: "end" });
      }
    };
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [messages, typingUser]);

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("send_message", {
      chatId: id,
      text: message,
      senderId: currentUserId,
      timestamp: new Date().toISOString(),
      replyToMessageId: replyingTo?._id || null, // NEW: Send reply ID
    });

    setMessage("");
    setReplyingTo(null); // NEW: Clear reply state
  };

  const formatTime = (time: string) =>
    new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const copyToClipboard = (text: string) => {
    const textToCopy = text;
    navigator.clipboard.writeText(textToCopy);
  };

  const getReadStatus = (msg: Message) => {
    if (chat?.type === "group") {
      if (!groupInfo) return "";
      const otherMembers = groupInfo.members.filter(
        (m) => m._id !== currentUserId,
      );
      const readCount =
        msg.readBy?.filter((u) => otherMembers.some((m) => m._id === u._id))
          .length || 0;
      if (readCount === 0) return "Sent";
      return readCount === otherMembers.length
        ? "Seen by all"
        : `Seen by ${readCount}`;
    }
    return msg.readBy?.some((u) => u._id === user?._id) ? "Read" : "Sent";
  };

  const messagePin = async (messageId: string, action: string) => {
    try {
      await pinChat(id, messageId, action);
      socket.emit("update_pin", {
        chatId: id,
        messageId: messageId,
        action: action,
      });
    } catch (error) {
      console.error("Failed to pin/unpin message:", error);
    }
  };

  useEffect(() => {
    const handlePinUpdate = async ({ chatId }: { chatId: string }) => {
      if (chatId === id) {
        try {
          const updatedChat = await getPrivateChatById(id);
          setChat(updatedChat.chat);
        } catch (error) {
          console.error("Failed to update pinned messages:", error);
        }
      }
    };
    socket.on("pin_updated", handlePinUpdate);
    return () => {
      socket.off("pin_updated", handlePinUpdate);
    };
  }, [id]);

  useEffect(() => {
    const handleOnlineStatus = ({
      userId,
      status,
    }: {
      userId: string;
      status: string;
    }) => {
      if (user && userId === user._id) {
        const isOnline = status === "online";
        setUser((prevUser) => (prevUser ? { ...prevUser, isOnline } : null));
      }
    };
    socket.on("user_status_changed", handleOnlineStatus);
    return () => {
      socket.off("user_status_changed", handleOnlineStatus);
    };
  }, [user?._id]);

  const isLessThan10Minutes = (createdAt: string | Date) => {
    const diffInMinutes =
      (Date.now() - new Date(createdAt).getTime()) / (1000 * 60);
    return diffInMinutes < 10;
  };

  const handleDeleteMessage = async (messageId: string) => {
    await deleteMessage(messageId);
    socket.emit("message_delete", { messageId: messageId, chatId: id });
  };

  // NEW: Handle reply to message
  const handleReplyToMessage = (msg: Message) => {
    setReplyingTo(msg);
  };

  // NEW: Scroll to referenced message
  const scrollToMessage = (messageId: string) => {
    const element = messageRefs.current[messageId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      // Highlight animation
      element.classList.add("highlight-message");
      setTimeout(() => {
        element.classList.remove("highlight-message");
      }, 2000);
    }
  };

  // NEW: Render reply preview component
  const ReplyPreview = ({ reply }: { reply: ReplyToSnapshot }) => {
    const getReplyContent = () => {
      if (reply.type === "image") return "📷 Photo";
      if (reply.type === "video") return "🎬 Video";
      if (reply.type === "file") return `📎 ${reply.fileName}`;
      return reply.text;
    };

    return (
      <div
        className="border-l-4 border-blue-500 pl-3 py-2 mb-2 bg-blue-50/50 rounded cursor-pointer hover:bg-blue-100/50 transition-colors"
        onClick={() => scrollToMessage(reply._id)}
      >
        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-1">
          {reply.senderId.username}
        </div>
        <div className="text-xs text-gray-600 truncate">
          {getReplyContent()}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">
          Loading conversation...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* ---------- HEADER ---------- */}
      <header className="flex items-center justify-between px-10 p-4 border-b bg-white/95 backdrop-blur-md z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            {(chat?.type === "group" ? groupInfo?.name : user?.username)
              ?.charAt(0)
              .toUpperCase()}
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-lg leading-tight uppercase tracking-tight">
              {chat?.type === "group" ? groupInfo?.name : user?.username}
            </h1>
            <div
              className={`text-[10px] font-semibold flex items-center gap-1 uppercase tracking-widest ${user?.isOnline ? "text-green-600" : "text-red-500"}`}
            >
              {user?.isOnline ? (
                <>
                  <FiWifi size={12} /> Online
                </>
              ) : (
                <>
                  <FiWifiOff size={12} /> Disconnected
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <FiPhoneCall
            size={20}
            className="cursor-pointer text-blue-500 hover:text-blue-600 transition-colors"
            onClick={() => alert("Coming soon...")}
          />
          {chat && (
            <DropdownMenu>
              <DropdownMenuTrigger className="px-4 py-1.5 text-xs font-bold border rounded-full hover:bg-gray-50 transition-all uppercase tracking-tighter">
                <FiMoreVertical
                  size={20}
                  className="cursor-pointer text-gray-500 hover:text-blue-600 transition-colors"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setIsSearchOpen(true);
                    setMessageSearchQuery("");
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }}
                  className="gap-2"
                >
                  <FiSearch size={16} />
                  Search in chat
                </DropdownMenuItem>
                {chat?.type === "group" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Group Management</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {chat.groupAdmins.includes(currentUserId) && (
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <AddToGroup chatId={id} />
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <GroupInfoModal chatId={id} />
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* ---------- SEARCH BAR ---------- */}
      {isSearchOpen && (
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-slate-50">
          <FiSearch className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search messages..."
            value={messageSearchQuery}
            onChange={(e) => setMessageSearchQuery(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(false);
              setMessageSearchQuery("");
            }}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            aria-label="Close search"
          >
            <FiX size={18} />
          </button>
        </div>
      )}

      {/* ---------- PINNED MESSAGES ---------- */}
      {chat?.pinnedMessages && chat.pinnedMessages.length > 0 && (
        <div className="bg-yellow-50 border-l-4 p-4 mb-4">
          <div className="space-y-2">
            {chat.pinnedMessages.map((pinnedMsg: Message) => (
              <ContextMenu key={pinnedMsg._id}>
                <ContextMenuTrigger className="w-full">
                  <div className="relative group h-[60px] overflow-hidden">
                    <div className="absolute inset-0 backdrop-blur-md rounded-lg transition-all duration-300 group-hover:from-white/80 group-hover:to-white/60 group-hover:backdrop-blur-sm" />
                    <div className="relative h-full p-2 rounded-lg border border-white/40 cursor-pointer transition-all duration-300 group-hover:border-gray-300">
                      <div className="flex items-start h-full gap-2">
                        <div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          {pinnedMsg.type === "image" ? (
                            <FiImage size={14} />
                          ) : pinnedMsg.type === "video" ? (
                            <FiVideo size={14} />
                          ) : pinnedMsg.type === "file" ? (
                            <FiFile size={14} />
                          ) : (
                            <span>💬</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-semibold text-gray-800 truncate">
                              {pinnedMsg?.senderId?.username}
                            </span>
                            <span className="text-[10px] text-gray-600 shrink-0 ml-1">
                              {new Date(pinnedMsg.createdAt).toLocaleDateString(
                                [],
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-gray-900 truncate line-clamp-2 leading-tight">
                            {pinnedMsg.type === "text"
                              ? pinnedMsg.text
                              : pinnedMsg.type === "image"
                                ? "📷 Image"
                                : pinnedMsg.type === "video"
                                  ? "🎬 Video"
                                  : pinnedMsg.type === "file"
                                    ? `📎 ${pinnedMsg.fileName}`
                                    : "Attachment"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48 font-semibold backdrop-blur-lg bg-white/90 border-white/30 shadow-xl">
                  <ContextMenuItem
                    onClick={() => copyToClipboard(pinnedMsg.text)}
                    className="gap-2"
                  >
                    <FiCopy size={14} /> Copy Text
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => messagePin(pinnedMsg._id, "unpin")}
                    className="gap-2 text-orange-600"
                  >
                    <FiMapPin size={14} /> Unpin Message
                  </ContextMenuItem>
                  {pinnedMsg.fileUrl && (
                    <ContextMenuItem
                      onClick={() =>
                        window.open(`${API_URL}${pinnedMsg.fileUrl}`)
                      }
                      className="gap-2"
                    >
                      <FiMaximize2 size={14} /> View Original
                    </ContextMenuItem>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden bg-slate-50">
        <div ref={scrollContainerRef} className="h-full overflow-y-auto px-4">
          <div className="flex justify-center py-4">
            {hasMoreMessages && (
              <button
                onClick={handleGetMessages}
                className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-blue-500 transition-colors"
              >
                Load Older Messages
              </button>
            )}
          </div>

          <div className="pb-10 space-y-6">
            {Object.entries(groupedMessages).map(([dayKey, dayMessages]) => (
              <div key={dayKey} className="space-y-6">
                {/* DATE SEPARATOR */}
                <div className="flex justify-center my-8">
                  <span className="px-4 py-1 text-[10px] font-black uppercase tracking-widest ">
                    {formatDayLabel(dayKey)}
                  </span>
                </div>

                {dayMessages.map((msg) => {
                  const isMine = msg.senderId?._id === currentUserId;

                  return (
                    <div
                      key={msg._id}
                      ref={(el: any) => (messageRefs.current[msg._id] = el)}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <ContextMenu>
                        <ContextMenuTrigger className="max-w-[88%] sm:max-w-[70%] transition-all">
                          <div
                            className={`relative group rounded-2xl px-4 py-3 shadow-sm transition-all duration-200
    ${
      isMine
        ? "bg-blue-600 text-white rounded-tr-none shadow-blue-200/40 hover:shadow-md"
        : "bg-white border border-gray-200 rounded-tl-none text-gray-800 hover:shadow-md"
    }`}
                          >
                            {/* Sender Name */}
                            {!isMine && (
                              <div className="text-[10px] font-extrabold flex items-center gap-1 mb-1 text-blue-500 uppercase tracking-wide">
                                <FiUser size={10} />
                                {msg?.senderId?.username}
                              </div>
                            )}

                            {/* NEW: Reply Preview */}
                            {msg.replyToSnapshot && (
                              <ReplyPreview reply={msg.replyToSnapshot} />
                            )}

                            {/* Deleted Message */}
                            {msg.isDeleted ? (
                              <p className="text-[13px] italic text-gray-400 select-none">
                                Message deleted
                              </p>
                            ) : (
                              <>
                                {/* Forwarded Label */}
                                {msg.forwardedMessage && (
                                  <span className="text-[10px] italic opacity-70 block mb-1">
                                    • Forwarded
                                  </span>
                                )}

                                {/* IMAGE */}
                                {msg.type === "image" && (
                                  <div className="mb-2 overflow-hidden rounded-lg">
                                    <img
                                      src={`${API_URL}${msg.fileUrl}`}
                                      alt={msg.fileName}
                                      className="max-w-full max-h-80 object-cover cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                                      onClick={() =>
                                        window.open(`${API_URL}${msg.fileUrl}`)
                                      }
                                    />
                                  </div>
                                )}

                                {/* VIDEO */}
                                {msg.type === "video" && (
                                  <div className="mb-2 overflow-hidden rounded-lg shadow-inner">
                                    <video
                                      src={`${API_URL}${msg.fileUrl}`}
                                      className="max-w-full max-h-80 rounded-lg"
                                      controls
                                    />
                                  </div>
                                )}

                                {/* FILE */}
                                {msg.type === "file" && (
                                  <a
                                    href={`${API_URL}${msg.fileUrl}`}
                                    download
                                    className={`flex items-center gap-3 p-3 rounded-xl border mb-2 transition-all no-underline
            ${
              isMine
                ? "bg-blue-700/30 border-blue-400/30 text-white hover:bg-blue-700/40"
                : "bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100"
            }`}
                                  >
                                    <div
                                      className={`p-2 rounded-lg shrink-0
              ${isMine ? "bg-blue-500" : "bg-gray-200 text-gray-600"}`}
                                    >
                                      <FiFileText size={20} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold truncate">
                                        {msg.fileName}
                                      </p>
                                      <p className="text-[10px] uppercase font-bold opacity-60 tracking-wide">
                                        Download File
                                      </p>
                                    </div>

                                    <FiDownload className="opacity-50 shrink-0" />
                                  </a>
                                )}

                                {/* TEXT MESSAGE */}
                                {msg.text && (
                                  <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap font-medium">
                                    {msg.text}
                                  </p>
                                )}
                              </>
                            )}

                            {/* TIMESTAMP */}
                            <div className="text-[9px] mt-2 flex justify-end items-center gap-1.5 font-semibold uppercase tracking-wide opacity-60">
                              <span>{formatTime(msg.createdAt)}</span>
                              {isMine && <span>• {getReadStatus(msg)}</span>}
                            </div>
                          </div>
                        </ContextMenuTrigger>

                        {!msg.isDeleted && (
                          <ContextMenuContent className="w-48 font-semibold">
                            <ContextMenuItem
                              onClick={() => handleReplyToMessage(msg)}
                              className="gap-2"
                            >
                              <FiCornerUpLeft size={14} /> Reply
                            </ContextMenuItem>
                            <ContextMenuItem
                              onClick={() => copyToClipboard(msg?.text)}
                              className="gap-2"
                            >
                              <FiCopy size={14} /> Copy Text
                            </ContextMenuItem>
                            <ContextMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              <FiPhoneForwarded size={14} />
                              <ForwardeMessageModal messageToForward={msg} />
                            </ContextMenuItem>

                            {msg.fileUrl && (
                              <ContextMenuItem
                                onClick={() =>
                                  window.open(`${API_URL}${msg.fileUrl}`)
                                }
                                className="gap-2"
                              >
                                <FiMaximize2 size={14} /> View Original
                              </ContextMenuItem>
                            )}
                            <ContextMenuItem
                              onClick={() => {
                                const isPinned = chat?.pinnedMessages?.some(
                                  (pinned: Message) => pinned._id === msg._id,
                                );
                                messagePin(msg._id, isPinned ? "unpin" : "pin");
                              }}
                              className="gap-2"
                            >
                              <FiMapPin size={14} />
                              {chat?.pinnedMessages?.some(
                                (pinned: Message) => pinned._id === msg._id,
                              )
                                ? "Unpin Message"
                                : "Pin Message"}
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            {isMine && isLessThan10Minutes(msg.createdAt) && (
                              <ContextMenuItem
                                onClick={() => handleDeleteMessage(msg._id)}
                                className="gap-2 text-red-500 focus:text-red-500 cursor-pointer"
                              >
                                <FiTrash2 size={14} /> Delete Message
                              </ContextMenuItem>
                            )}
                          </ContextMenuContent>
                        )}
                      </ContextMenu>
                    </div>
                  );
                })}
              </div>
            ))}

            {typingUser && (
              <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                {typingUser} is typing
              </div>
            )}
            <div ref={scrollRef} className="h-4" />
          </div>
        </div>
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer className="p-4 border-t bg-white z-20">
        {/* NEW: Reply Banner */}
        {replyingTo && (
          <div className="max-w-5xl mx-auto mb-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-3 flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-blue-600 mb-1">
                Replying to {replyingTo?.senderId?.username}
              </div>
              <div className="text-sm text-gray-600 truncate">
                {replyingTo.type === "text"
                  ? replyingTo.text
                  : replyingTo.type === "image"
                    ? "📷 Photo"
                    : replyingTo.type === "video"
                      ? "🎬 Video"
                      : `📎 ${replyingTo.fileName}`}
              </div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="ml-2 p-1 hover:bg-blue-100 rounded-full transition-colors"
            >
              <FiX size={16} className="text-gray-500" />
            </button>
          </div>
        )}

        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <SettingDropdown />
          <div className="relative flex-1">
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              rows={1}
              className="w-full rounded-2xl px-5 py-3 bg-gray-100 border-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium placeholder:text-gray-400 resize-none overflow-hidden min-h-[48px] max-h-[120px]"
              placeholder="Write a message..."
              style={{
                height: "auto",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />

            {/* Mention Dropdown */}
            {isMentionOpen && filteredParticipants.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                <div className="p-2">
                  <p className="text-xs font-semibold text-gray-500 px-2 py-1">
                    Mention User
                  </p>
                  {filteredParticipants.map((part: any) => (
                    <button
                      key={part._id}
                      onClick={() => {
                        const lastAtIndex = message.lastIndexOf("@");
                        const beforeAt = message.slice(0, lastAtIndex);
                        setMessage(beforeAt + `@${part.username} `);
                        setIsMentionOpen(false);
                      }}
                      className="w-full text-left p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs shrink-0">
                        {part.username?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-sm truncate">
                        {part.username}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white p-3.5 rounded-full transition-all shadow-lg shadow-blue-500/20 active:scale-90 mb-0"
          >
            <FiSend size={18} />
          </button>
        </div>
      </footer>

      {/* NEW: Add CSS for highlight animation */}
      <style jsx global>{`
        @keyframes highlight {
          0%,
          100% {
            background-color: transparent;
          }
          50% {
            background-color: rgba(59, 130, 246, 0.2);
          }
        }

        .highlight-message {
          animation: highlight 2s ease-in-out;
        }
      `}</style>
    </div>
  );
}
