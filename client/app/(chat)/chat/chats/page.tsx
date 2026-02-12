"use client";
import { useEffect, useState } from "react";
import { socket } from "../../../../lib/socket";
import { FiSend, FiWifi, FiWifiOff, FiClock, FiUser } from "react-icons/fi";
import { useSocketStore } from "../../../../store/useSocketStore";
import { useAuthStore } from "@/lib/store";
interface Message {
  text: string;
  senderId: string;
  chatId?: string;
  timestamp?: string;
}

function Chat() {
  const { user: currentUser } = useAuthStore();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const isConnected = useSocketStore((state) => state.isConnected);
  const [currentUserId, setCurrentUserId] = useState<string>(
    currentUser?._id || "temp"
  );

  useEffect(() => {
    if (currentUser?._id) {
      setCurrentUserId(currentUser._id);
    }
  }, [currentUser]);

  useEffect(() => {
    // Only listen for messages, connection is handled globally
    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  const sendMessage = () => {
    // if (message.trim() && isConnected) {
    //   socket.emit("send_message", { text: message, senderId: currentUserId });
    //   setMessage("");
    // }
    alert("This is still under review")
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="text-2xl">💬</div>
          <div>
            <h1 className="font-bold text-gray-800">Global Chat Room</h1>
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1 text-sm ${isConnected ? "text-green-600" : "text-red-600"
                  }`}
              >
                {isConnected ? (
                  <FiWifi className="text-sm" />
                ) : (
                  <FiWifiOff className="text-sm" />
                )}
                <span>{isConnected ? "Connected" : "Disconnected"}</span>
              </div>
              {isConnected && (
                <span className="text-xs text-gray-500">
                  ID: {socket.id?.substring(0, 8)}...
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {messages.length} message{messages.length !== 1 ? "s" : ""}
          <span className="ml-2 text-xs text-gray-400">
            • Use sidebar to start private chats
          </span>
        </div>
      </div>

      {/* Messages Area - Takes available space */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-gray-50">
        {messages.length === 0 ? (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg">No messages yet</p>
            <p className="text-sm mt-2">Start a conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => {
              const isCurrentUser = msg.senderId === socket.id;
              return (
                <div
                  key={i}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"
                    }`}
                >
                  <div
                    className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${isCurrentUser
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                      }`}
                  >
                    {/* Sender info */}
                    <div
                      className={`flex items-center gap-2 mb-1 ${isCurrentUser ? "text-blue-100" : "text-gray-500"
                        }`}
                    >
                      <FiUser className="text-sm" />
                      <span className="text-xs font-medium">
                        {isCurrentUser
                          ? "You"
                          : `User ${msg.senderId?.substring(0, 6)}`}
                      </span>
                    </div>

                    {/* Message text */}
                    <p className="mb-2">{msg.text}</p>

                    {/* Timestamp */}
                    <div
                      className={`flex items-center gap-1 text-xs ${isCurrentUser ? "text-blue-200" : "text-gray-400"
                        }`}
                    >
                      <FiClock className="text-xs" />
                      <span>{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              className="w-full px-5 py-3 pl-5 pr-12 bg-gray-50 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all"
              placeholder="Type your message here..."
              type="text"
              disabled={!isConnected}
            />
            {!isConnected && (
              <div className="absolute inset-0 rounded-full bg-gray-100/80 flex items-center justify-center">
                <span className="text-sm text-gray-500">Reconnecting...</span>
              </div>
            )}
          </div>
          <button
            onClick={sendMessage}
            // disabled={!isConnected || !message.trim()}
            disabled={true}
            className={`px-6 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${!isConnected || !message.trim()
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
              }`}
          >
            <FiSend className="text-lg" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Press Enter to send
        </p>
      </div>
    </div>
  );
}

export default Chat;
