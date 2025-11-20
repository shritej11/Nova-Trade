import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { Card, Button, Input } from './UI';
import { DBService } from '../services/db';
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  UserCircleIcon
} from '@heroicons/react/24/solid';

interface CommunityChatProps {
  user: User | null;
}

// Simulated "Bots" to make the chat feel alive
const MOCK_USERS = [
  "BullRun99", "CryptoKing", "NiftyTrader", "SafeHands", "AlgoBot", 
  "MarketGuru", "RakeshJ", "StonksOnlyGoUp"
];

const MOCK_MESSAGES = [
  "TCS looking strong at this support level.",
  "Anyone holding Reliance over the weekend?",
  "Market is very volatile today, stay safe guys.",
  "Just bought the dip on INFY!",
  "Shorting Adani for quick scalps.",
  "What's your target for HDFC Bank?",
  "Charts showing a breakout pattern on Auto sector.",
  "Volume is low today...",
  "Anyone checking the AI prediction for Tata Motors?"
];

export const CommunityChat: React.FC<CommunityChatProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load initial history
  useEffect(() => {
    if (user) {
      DBService.getChatHistory().then(history => {
        setMessages(history);
        scrollToBottom();
      });
    }
  }, [user, isOpen]);

  // Scroll to bottom on new message
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Simulate "Community" Activity
  useEffect(() => {
    if (!isOpen || !user) return;

    const interval = setInterval(() => {
      // 20% chance to receive a message every 5 seconds
      if (Math.random() > 0.8) {
        const randomUser = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
        const randomMsg = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)];
        
        const botMsg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random()}`,
          sender: randomUser,
          role: 'USER',
          text: randomMsg,
          timestamp: new Date().toISOString(),
          isUser: false
        };

        setMessages(prev => [...prev, botMsg]);
        scrollToBottom();
        // We don't necessarily need to save bot messages to DB to save space, 
        // but saving them makes history consistent. Let's save them.
        DBService.saveChatMessage(botMsg);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: user.username,
      role: user.role,
      text: inputValue.trim(),
      timestamp: new Date().toISOString(),
      isUser: true
    };

    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    scrollToBottom();
    await DBService.saveChatMessage(newMsg);
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 h-[500px] flex flex-col animate-fade-in origin-bottom-right shadow-2xl shadow-slate-500/20 dark:shadow-slate-900/50 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="bg-white dark:bg-slate-900/95 backdrop-blur-md flex-1 flex flex-col">
            
            {/* Header */}
            <div className="p-4 bg-accent text-white flex justify-between items-center shadow-md z-10">
              <div className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                <div>
                  <h3 className="font-bold text-sm">Traders Community</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-blue-100">{Math.floor(Math.random() * 50) + 120} Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900/50" ref={chatContainerRef}>
              <div className="text-center py-4 text-xs text-slate-400">
                <p>Welcome to the global chat room.</p>
                <p>Be respectful and helpful to other traders.</p>
              </div>
              
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1 mb-1 px-1">
                    {!msg.isUser && (
                       <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-slate-300 to-slate-500 dark:from-slate-400 dark:to-slate-600 flex items-center justify-center text-[8px] text-white font-bold">
                          {msg.sender[0]}
                       </div>
                    )}
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {msg.sender} {msg.role === 'ADMIN' && <span className="text-purple-500 text-[9px] border border-purple-500/30 px-1 rounded bg-purple-500/10">MOD</span>}
                    </span>
                    <span className="text-[9px] text-slate-400 ml-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div 
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                      msg.isUser 
                        ? 'bg-accent text-white rounded-tr-none' 
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <Input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Share your thoughts..."
                className="text-sm h-10 rounded-full"
              />
              <Button type="submit" className="rounded-full px-3 h-10 bg-accent hover:bg-blue-600 flex items-center justify-center">
                <PaperAirplaneIcon className="h-4 w-4 text-white" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${isOpen ? 'bg-slate-700 rotate-90' : 'bg-gradient-to-r from-blue-500 to-purple-600'}`}
      >
        {isOpen ? (
           <XMarkIcon className="h-6 w-6 text-white" />
        ) : (
           <div className="relative">
             <ChatBubbleLeftRightIcon className="h-7 w-7 text-white" />
             <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-slate-900 rounded-full"></span>
           </div>
        )}
      </button>
    </div>
  );
};