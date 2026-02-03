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
import { CreateGroupChatModal } from "@/components/settingModals";
import { Button } from "@/components/ui/button";
import { createOrGetPrivateChat, getAllusers, getUserChats } from "@/app/api";
import { useAuthStore } from "@/lib/store";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { socket } from "@/lib/socket";
import { useModuleStore } from "../lib/moduleStore"
interface Chat {
  _id: string;
  type: "private" | "group";
  participants: any[];
  groupName?: string;
  privateLastChat?: { text: string; senderId: string; readBy: string[]; timestamp: string };
  groupLastMessage?: { text: string; senderId: string; timestamp: string; readBy?: string[] };
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
  const [showUsers, setShowUsers] = useState(false);
  const [Search, setSearch] = useState<string>("");
  const setModule = useModuleStore((set) => set.setModule)

  // --- API Calls ---
  const fetchUserChats = useCallback(async () => {
    try {
      const res = await getUserChats(Search);
      setChats(res.chats);
    } catch (err) {
      console.error("Sidebar refresh error:", err);
    } finally {
      setChatsLoading(false);
    }
  }, [Search]);

  const fetchUsers = async () => {
    try {
      const res = await getAllusers();
      setUsersData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Real-time Updates ---
  useEffect(() => {
    fetchUserChats();
    fetchUsers();
  }, [fetchUserChats]);

  useEffect(() => {
    const handleRefresh = () => fetchUserChats();

    socket.on("chat_list_update", handleRefresh);
    socket.on("messages_read", handleRefresh);
    socket.on("receive_message", handleRefresh);

    return () => {
      socket.off("chat_list_update", handleRefresh);
      socket.off("messages_read", handleRefresh);
      socket.off("receive_message", handleRefresh);
    };
  }, [fetchUserChats]);

  // --- Unread Logic ---
  function hasUnreadMessages(chat: Chat) {
    if (!user) return false;
    const lastMsg = chat.type === "private" ? chat.privateLastChat : chat.groupLastMessage;
    if (!lastMsg) return false;
    if (lastMsg.senderId === user._id) return false;

    const readByList = lastMsg.readBy || [];
    return !readByList.some((id: any) => (id._id || id).toString() === user?._id?.toString());
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
    {
      label: "New Group Chat",
      icon: <Users className="h-4 w-4" />,
      button: <CreateGroupChatModal />,
      onClick: () => { },
    },
    {
      label: "Switch Module",
      button: "",
      href: "/",
      onClick: () => { setModule("") },
    }
  ];

  return (
    <aside className="w-72 h-screen bg-white border-r flex flex-col">
      {/* User Header */}
      <div className="p-5 border-b">
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase">Navigation</p>
          <Link href="/chat/chats" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-100">
            <MessageCircle className="h-4 w-4 text-blue-500" />
            Global Chat
          </Link>
        </div>

        <div>
          <input
            type="text"
            placeholder="Search chats..."
            value={Search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Recent Chats */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase">Recent Chats</p>
            <button onClick={() => setShowUsers(!showUsers)} className="text-xs text-blue-500 hover:text-blue-600">
              {showUsers ? "Hide" : "Show"} Users
            </button>
          </div>

          <div className="space-y-1">
            {!chatsLoading && chats.map((chat) => {
              const unread = hasUnreadMessages(chat);
              const isActive = activeChatId === chat._id;
              const lastMsg = chat.type === "private" ? chat.privateLastChat : chat.groupLastMessage;

              return (
                <Link
                  key={chat._id}
                  href={`/chat/chats/${chat._id}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${isActive ? "bg-blue-600 text-white shadow-sm" :
                    unread ? "bg-blue-50 font-bold" : "hover:bg-gray-100"
                    }`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium ${isActive ? "bg-white/20 text-white" : "bg-blue-500 text-white"
                      }`}>
                      {(chat.type === "group" ? chat.groupName : chat.participants.find(p => p._id !== user?._id)?.username)?.charAt(0).toUpperCase()}
                    </div>
                    {unread && !isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-600 border-2 border-white rounded-full"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`truncate uppercase ${isActive ? "text-white" : "text-gray-900"}`}>
                      {chat.type === "group" ? chat.groupName : chat.participants.find(p => p._id !== user?._id)?.username}
                    </p>
                    <p className={`text-xs truncate ${isActive ? "text-blue-100" : unread ? "text-blue-600" : "text-gray-500"}`}>
                      {lastMsg?.text || "No messages"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Users Section */}
        {showUsers && (
          <div className="pt-4 border-t">
            <p className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase">All Users</p>
            <div className="space-y-1">
              {usersData?.users?.map((u: any) => (
                <button
                  key={u._id}
                  onClick={() => handleChat(u._id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-100 text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-gray-500 text-white flex items-center justify-center text-[10px]">
                    {u.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{u.username}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer & Drawer */}
      <div className="border-t p-3 space-y-2">
        <Drawer direction="left">
          <DrawerTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-100">
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </DrawerTrigger>

          <DrawerContent className="h-full w-[300px]">
            <DrawerHeader>
              <p className="text-sm font-semibold">Settings</p>
            </DrawerHeader>

            <div className="px-4 space-y-4">
              {settings.map((item) => (
                <div key={item.label} className="w-full" onClick={item.onClick}>
                  {item.button ? (
                    item.button
                  ) : (
                    <Link href={item.href || "#"} className="flex items-center gap-3 py-2 text-sm hover:text-blue-600">
                      {item.icon} {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <button
          onClick={() => {
            useAuthStore.getState().logout();
            router.push("/");
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}