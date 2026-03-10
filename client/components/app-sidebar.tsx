"use client";

import { MessageCircle, Users, Settings, LogOut, Hash } from "lucide-react";
import Link from "next/link";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateGroupChatModal } from "@/components/settingModals";
import { Button } from "@/components/ui/button";
import { createOrGetPrivateChat, getAllusers, getUserChats } from "@/app/api";
import { useAuthStore } from "@/lib/store";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { socket } from "@/lib/socket";
import { useModuleStore } from "../lib/moduleStore";

interface Chat {
  _id: string;
  type: "private" | "group";
  participants: any[];
  groupName?: string;
  privateLastChat?: {
    text: string;
    senderId: string;
    readBy: string[];
    timestamp: string;
    isDeleted: Boolean;
  };
  groupLastMessage?: {
    text: string;
    senderId: string;
    timestamp: string;
    readBy?: string[];
    isDeleted: Boolean;
  };
  groupMembers?: any[];
  updatedAt: string;
}

export function AppSidebar() {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const activeChatId = params?.id;

  const [usersData, setUsersData] = useState<any>();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [chatSearch, setChatSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const setModule = useModuleStore((set) => set.setModule);

  const originalTitleRef = useRef<string>("Chat App");
  const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<HTMLAudioElement | null>(null);

  // --- API Calls ---
  const fetchUserChats = useCallback(async () => {
    try {
      const res = await getUserChats(chatSearch);
      setChats(res.chats);
    } catch (err) {
      console.error("Sidebar refresh error:", err);
    } finally {
      setChatsLoading(false);
    }
  }, [chatSearch]);

  const fetchUsers = useCallback(async (search?: string) => {
    try {
      const res = await getAllusers(search);
      setUsersData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Title Blink ---
  const startTitleBlink = useCallback(() => {
    if (blinkIntervalRef.current) return;
    let isOriginal = true;
    blinkIntervalRef.current = setInterval(() => {
      document.title = isOriginal
        ? "🔔 New Message!"
        : originalTitleRef.current;
      isOriginal = !isOriginal;
    }, 1000);
  }, []);

  const stopTitleBlink = useCallback(() => {
    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
      blinkIntervalRef.current = null;
      document.title = originalTitleRef.current;
    }
  }, []);

  // --- Effects ---
  useEffect(() => {
    fetchUserChats();
    fetchUsers();
  }, [fetchUserChats, fetchUsers]);

  useEffect(() => {
    originalTitleRef.current = document.title;
    return () => stopTitleBlink();
  }, [stopTitleBlink]);

  useEffect(() => {
    const handleFocus = () => stopTitleBlink();
    const handleVisibility = () => {
      if (!document.hidden) stopTitleBlink();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [stopTitleBlink]);

  useEffect(() => {
    if (!soundRef.current) {
      soundRef.current = new Audio("/sounds/message.wav");
    }

    const handleChatUpdate = (data: any) => {
      fetchUserChats();
      if (data?.senderId && data.senderId !== user?._id) {
        soundRef.current!.currentTime = 0;
        soundRef.current!.play().catch(() => {});
        if (document.hidden || !document.hasFocus()) startTitleBlink();
      }
    };

    const handleMessagesRead = () => fetchUserChats();

    socket.on("chat_list_update", handleChatUpdate);
    socket.on("messages_read", handleMessagesRead);
    socket.on("receive_message", handleChatUpdate);
    socket.on("message_was_deleted", handleChatUpdate);

    return () => {
      socket.off("chat_list_update", handleChatUpdate);
      socket.off("messages_read", handleMessagesRead);
      socket.off("receive_message", handleChatUpdate);
      socket.off("message_was_deleted", handleChatUpdate);
    };
  }, [fetchUserChats, user, startTitleBlink]);

  // --- Helpers ---
  function hasUnreadMessages(chat: Chat) {
    if (!user) return false;
    const lastMsg =
      chat.type === "private" ? chat.privateLastChat : chat.groupLastMessage;
    if (!lastMsg || lastMsg.senderId === user._id) return false;
    return !(lastMsg.readBy || []).some(
      (id: any) => (id._id || id).toString() === user._id?.toString(),
    );
  }

  async function handleChat(userId: string) {
    try {
      const res = await createOrGetPrivateChat(userId);
      router.push(`/chat/chats/${res.chat._id}`);
    } catch (err) {
      console.error(err);
    }
  }

  const settings = [
    {
      label: "My Profile",
      icon: <Hash className="h-4 w-4" />,
      href: "/profile",
    },
    { label: "New Group Chat", button: <CreateGroupChatModal /> },
    { label: "Switch Module", href: "/", onClick: () => setModule("") },
  ];

  return (
    <aside className="h-full w-full bg-white border-r flex flex-col">
      {/* User Header */}
      <div className="p-4 border-b">
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm shrink-0">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-3 pt-3 pb-1 space-y-0.5">
        <Link
          href="/chat/chats"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-gray-100"
        >
          <MessageCircle className="h-4 w-4 text-blue-500" /> Global Chat
        </Link>
        {user?.role === "admin" && (
          <Link
            href="/chat/tickets"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-gray-100"
          >
            <Hash className="h-4 w-4 text-blue-500" /> Tickets
          </Link>
        )}
      </div>

      {/* Tabs: Chats / Users */}
      <div className="flex-1 overflow-hidden flex flex-col px-3 pt-2">
        <Tabs
          defaultValue="chats"
          className="flex flex-col flex-1 overflow-hidden"
        >
          <TabsList className="w-full mb-2">
            <TabsTrigger value="chats" className="flex-1">
              Chats
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1">
              Users
            </TabsTrigger>
          </TabsList>

          {/* Chats Tab */}
          <TabsContent
            value="chats"
            className="flex-1 overflow-y-auto space-y-2 mt-0"
          >
            <input
              type="text"
              placeholder="Search chats..."
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />

            <div className="space-y-1">
              {!chatsLoading &&
                chats.map((chat) => {
                  const unread = hasUnreadMessages(chat);
                  const isActive = activeChatId === chat._id;
                  const lastMsg =
                    chat.type === "private"
                      ? chat.privateLastChat
                      : chat.groupLastMessage;
                  const chatName =
                    chat.type === "group"
                      ? chat.groupName
                      : chat.participants.find((p) => p._id !== user?._id)
                          ?.username;

                  return (
                    <Link
                      key={chat._id}
                      href={`/chat/chats/${chat._id}`}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : unread
                            ? "bg-blue-50 font-semibold"
                            : "hover:bg-gray-100"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-blue-500 text-white"
                          }`}
                        >
                          {chatName?.charAt(0).toUpperCase()}
                        </div>
                        {unread && !isActive && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-600 border-2 border-white rounded-full" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`truncate uppercase text-xs font-medium ${isActive ? "text-white" : "text-gray-900"}`}
                        >
                          {chatName}
                        </p>
                        <p
                          className={`text-xs truncate ${isActive ? "text-blue-100" : unread ? "text-blue-600" : "text-gray-400"}`}
                        >
                          {lastMsg?.isDeleted
                            ? "message deleted"
                            : lastMsg?.text || "No messages"}
                        </p>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent
            value="users"
            className="flex-1 overflow-y-auto space-y-2 mt-0"
          >
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                fetchUsers(e.target.value.trim() || undefined);
              }}
              className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />

            <div className="space-y-1">
              {usersData?.users?.map((u: any) => (
                <button
                  key={u._id}
                  onClick={() => handleChat(u._id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-100 text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs shrink-0">
                    {u.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-sm">{u.username}</span>
                    {u.email && (
                      <span className="truncate text-xs text-gray-400">
                        {u.email}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="border-t p-3 space-y-1">
        <Drawer direction="left">
          <DrawerTrigger asChild>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-gray-100">
              <Settings className="h-4 w-4" /> Settings
            </button>
          </DrawerTrigger>

          <DrawerContent className="h-full w-[300px]">
            <DrawerHeader>
              <p className="text-sm font-semibold">Settings</p>
            </DrawerHeader>

            <div className="px-4 space-y-4">
              {settings.map((item) => (
                <div key={item.label} onClick={item.onClick}>
                  {item.button ? (
                    item.button
                  ) : (
                    <Link
                      href={item.href || "#"}
                      className="flex items-center gap-3 py-2 text-sm hover:text-blue-600"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Close
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <button
          onClick={() => {
            useAuthStore.getState().logout();
            router.push("/");
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </aside>
  );
}
