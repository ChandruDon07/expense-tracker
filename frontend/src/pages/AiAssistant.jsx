import React, { useEffect, useState, useRef } from 'react';
import api from '../api/api';
import { motion } from 'framer-motion';
import { Send, Sparkles, AlertCircle, Bot, User, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Simple markdown parser helper for *bold* and list points
const renderMessageText = (text) => {
  if (!text) return '';
  return text.split('\n').map((line, idx) => {
    let content = line;
    // Check if line is a list point
    const isBullet = content.trim().startsWith('- ') || content.trim().startsWith('* ');
    if (isBullet) {
      content = content.trim().substring(2);
    }

    // Bold text parsing (**text** or *text*)
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = boldRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} className="font-extrabold text-foreground dark:text-white">{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    if (isBullet) {
      return (
        <li key={idx} className="ml-4 list-disc text-sm mt-1 text-muted-foreground">
          {parts.length > 0 ? parts : content}
        </li>
      );
    }

    // Header checks
    if (content.startsWith('### ')) {
      return <h4 key={idx} className="text-sm font-bold text-foreground mt-3 mb-1.5">{content.substring(4)}</h4>;
    }

    return (
      <p key={idx} className="text-sm leading-relaxed mt-1 text-muted-foreground">
        {parts.length > 0 ? parts : content}
      </p>
    );
  });
};

const AiAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `Hello ${user?.firstName || 'User'}! I am your AI Financial Advisor. Ask me anything about your accounts, transaction trends, or savings progress.`,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [insights, setInsights] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await api.get('/api/ai/insights');
      setInsights(res.data.insights);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = {
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoadingChat(true);
    setError(null);

    try {
      const res = await api.post('/api/ai/chat', { message: userMessage.text });
      const assistantMessage = {
        sender: 'assistant',
        text: res.data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError('Connection failed. Could not reach Gemini Assistant.');
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: 'I apologize, but I encountered an error retrieving that answer. Please verify your internet connection or check your GEMINI_API_KEY configuration.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gemini AI Assistant</h1>
        <p className="text-sm text-muted-foreground mt-1">Converse with Gemini to extract metrics or analyze cash flow insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat window */}
        <div className="lg:col-span-2 glass rounded-3xl border border-border/40 flex flex-col h-[550px] overflow-hidden">
          {/* Top header */}
          <div className="px-6 py-4 border-b border-border/40 bg-secondary/15 flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-sm">Financial Chatbot</h2>
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Active Sandbox Context</span>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, index) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div
                  key={index}
                  className={`flex gap-3 max-w-[85%] ${isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 uppercase text-xs font-bold ${
                    isAssistant ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-secondary border-border/60 text-foreground'
                  }`}>
                    {isAssistant ? <Bot size={15} /> : <User size={15} />}
                  </div>
                  <div className={`p-4 rounded-3xl ${
                    isAssistant ? 'glass border border-border/30 rounded-tl-none' : 'bg-primary text-primary-foreground rounded-tr-none shadow-md shadow-primary/15'
                  }`}>
                    {isAssistant ? (
                      <div className="space-y-1">{renderMessageText(msg.text)}</div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap font-medium">{msg.text}</p>
                    )}
                  </div>
                </div>
              );
            })}
            
            {loadingChat && (
              <div className="flex gap-3 max-w-[80%] mr-auto">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Bot size={15} />
                </div>
                <div className="glass border border-border/30 rounded-3xl rounded-tl-none p-4 flex gap-1 items-center">
                  <span className="w-2.5 h-2.5 bg-muted-foreground/50 rounded-full animate-bounce"></span>
                  <span className="w-2.5 h-2.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2.5 h-2.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Form input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-border/40 bg-secondary/10 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question (e.g. 'What is my current checking balance?')"
              className="flex-1 bg-background/50 border border-border/60 rounded-2xl px-5 py-3 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/60"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/10 hover:bg-primary/95 transition-colors flex items-center justify-center shrink-0"
            >
              <Send size={16} />
            </motion.button>
          </form>
        </div>

        {/* Insights Panel */}
        <div className="glass rounded-3xl border border-border/40 p-6 flex flex-col justify-between h-[550px]">
          <div className="space-y-4 overflow-y-auto">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles size={18} />
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wide">Automated Insights</h2>
            </div>
            
            {loadingInsights ? (
              <div className="space-y-3">
                <div className="h-4 bg-muted/40 animate-pulse rounded-lg w-full"></div>
                <div className="h-4 bg-muted/40 animate-pulse rounded-lg w-5/6"></div>
                <div className="h-4 bg-muted/40 animate-pulse rounded-lg w-4/5"></div>
              </div>
            ) : (
              <div className="space-y-1">{renderMessageText(insights)}</div>
            )}
          </div>

          <div className="border-t border-border/30 pt-4 mt-4">
            <p className="text-[11px] text-muted-foreground leading-normal">
              Insights are calculated based on your recorded transactions and account balances. Re-run or log new expenses to refresh your profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
