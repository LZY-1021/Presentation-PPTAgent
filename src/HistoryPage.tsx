import React, { useState, useEffect } from "react";
import "./index.css";

interface Message {
  sender: "user" | "ai";
  text: string;
  fileUrl?: string;
  fileType?: string;
}

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
}

interface HistoryPageProps {
  onSelectConversation: (messages: Message[]) => void;
  onBack: () => void;
}

export function HistoryPage({ onSelectConversation, onBack }: HistoryPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const storedConversations = JSON.parse(localStorage.getItem("conversations") || "[]");
    setConversations(storedConversations);
  }, []);

  const handleSelectConversation = (conversation: Conversation) => {
    onSelectConversation(conversation.messages);
  };

  const handleDeleteConversation = (id: string) => {
    const updatedConversations = conversations.filter((conv) => conv.id !== id);
    setConversations(updatedConversations);
    localStorage.setItem("conversations", JSON.stringify(updatedConversations));
  };

  return (
    <div className="history-page">
      <div className="history-header">
        <button className="back-button" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> 返回
        </button>
        <h2>历史会话</h2>
      </div>
      <div className="history-list">
        {conversations.length === 0 ? (
          <p>暂无历史会话</p>
        ) : (
          conversations.map((conversation) => (
            <div key={conversation.id} className="history-item">
              <div
                className="history-item-content"
                onClick={() => handleSelectConversation(conversation)}
              >
                <h3>{conversation.title}</h3>
                <p>{new Date(conversation.timestamp).toLocaleString()}</p>
              </div>
              <button
                className="delete-button"
                onClick={() => handleDeleteConversation(conversation.id)}
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}