import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, Send, Sparkles, SlidersHorizontal, Trash2, 
  RotateCw, Cpu, Moon, Sun, Plus,
  Copy, Check, StopCircle, RefreshCw, X, MessageSquare, AlertCircle
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import Markdown from './components/Markdown';
import { streamGeminiResponse } from './services/gemini';

// Initial Suggested Prompts
const SUGGESTED_PROMPTS = [
  {
    icon: "🚀",
    title: "Write high-converting headline",
    subtitle: "For a modern premium SaaS company using active style",
    prompt: "Write 5 high-converting landing page headlines and subheadlines for a premium AI SaaS application called Komsiri AI."
  },
  {
    icon: "💡",
    title: "Explain quantum analogy",
    subtitle: "Explain simply using household objects as examples",
    prompt: "Can you explain quantum physics in a simple, descriptive analogy suitable for a 10-year old? Use everyday kitchen objects as examples."
  },
  {
    icon: "⚡",
    title: "Design premium red/blue page",
    subtitle: "Tailwind suggestions with animations and layouts",
    prompt: "I want to design a premium dark-themed web interface highlighting red and blue glowing glassmorphic elements. Give me some Tailwind CSS layout ideas and code structures."
  },
  {
    icon: "🎨",
    title: "Optimize JavaScript algorithm",
    subtitle: "Analyze time complexity and clean up array functions",
    prompt: "Optimize this standard JavaScript function for performance and explain the changes: \n\n```js\nfunction findDuplicates(arr) {\n  let dups = [];\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = i + 1; j < arr.length; j++) {\n      if (arr[i] === arr[j] && !dups.includes(arr[i])) {\n        dups.push(arr[i]);\n      }\n    }\n  }\n  return dups;\n}\n```"
  }
];

export default function App() {
  // --- Persistent User Values ---
  const [model, setModel] = useState(() => localStorage.getItem('komsiri_model') || 'Gemini 2.5 Flash');
  const [theme, setTheme] = useState(() => localStorage.getItem('komsiri_theme') || 'dark');
  
  // --- Chat & Stream States ---
  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem('komsiri_chats');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [activeChatId, setActiveChatId] = useState(() => localStorage.getItem('komsiri_active_chat_id') || null);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // --- UI Aux States ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [streamError, setStreamError] = useState(null);

  // --- Refs ---
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const inputRef = useRef(null);

  // --- LocalStorage Synchronization Effect ---
  useEffect(() => {
    localStorage.setItem('komsiri_model', model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem('komsiri_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem('komsiri_active_chat_id', activeChatId);
    } else {
      localStorage.removeItem('komsiri_active_chat_id');
    }
  }, [activeChatId]);

  // --- Dynamic Theme Effect ---
  useEffect(() => {
    localStorage.setItem('komsiri_theme', theme);
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    } else {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    }
  }, [theme]);

  // --- PWA Installation Listener ---
  useEffect(() => {
    const handleInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  const triggerPWAInstall = () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') {
          console.log('Komsiri AI PWA installed.');
        }
        setDeferredInstallPrompt(null);
      });
    }
  };

  // --- Auto scrolling behavior ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, isGenerating]);

  // Handle focus on active input
  useEffect(() => {
    if (!isGenerating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeChatId, isGenerating]);

  // --- Chat Triggers / Operations ---
  
  const handleNewChat = () => {
    setInputText('');
    setStreamError(null);
    const newId = Date.now().toString();
    const newChatObj = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      model: model,
      createdAt: new Date().toISOString()
    };
    setChats(prev => [newChatObj, ...prev]);
    setActiveChatId(newId);
    // Autofocus input
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleDeleteChat = (chatId) => {
    const remainingChats = chats.filter(c => c.id !== chatId);
    setChats(remainingChats);
    if (activeChatId === chatId) {
      if (remainingChats.length > 0) {
        setActiveChatId(remainingChats[0].id);
      } else {
        setActiveChatId(null);
      }
    }
    setStreamError(null);
  };

  const handleRenameChat = (chatId, newTitle) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
  };

  const handleCopyMessage = (messageId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // --- Streaming Engine ---
  const sendMessage = async (overridePrompt = null) => {
    const messageContent = (overridePrompt || inputText).trim();
    if (!messageContent || isGenerating) return;

    setStreamError(null);
    setInputText('');

    // Locate or instantiate active chat
    let targetChatId = activeChatId;
    let currentChat = chats.find(c => c.id === targetChatId);

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    let updatedChatsList = [...chats];

    if (!currentChat || currentChat.messages.length === 0) {
      // First message dynamically renames the chat
      const chatTitle = messageContent.length > 30 
        ? messageContent.substring(0, 30) + '...' 
        : messageContent;

      if (!currentChat) {
        // Create full fresh chat object
        targetChatId = Date.now().toString();
        currentChat = {
          id: targetChatId,
          title: chatTitle,
          messages: [userMessage],
          model: model,
          createdAt: new Date().toISOString()
        };
        updatedChatsList = [currentChat, ...updatedChatsList];
      } else {
        // Append message and update title of placeholder chat
        currentChat = {
          ...currentChat,
          title: chatTitle,
          messages: [userMessage],
          model: model
        };
        updatedChatsList = updatedChatsList.map(c => c.id === currentChat.id ? currentChat : c);
      }
      setChats(updatedChatsList);
      setActiveChatId(targetChatId);
    } else {
      currentChat = {
        ...currentChat,
        messages: [...currentChat.messages, userMessage]
      };
      setChats(prev => prev.map(c => c.id === currentChat.id ? currentChat : c));
    }

    // Set streaming placeholders
    const aiMessageId = 'ai-stream-' + Date.now();
    const initialAiMessage = {
      id: aiMessageId,
      role: 'model',
      content: '',
      isStreaming: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Pre-insert the loading AI message
    setChats(prev => prev.map(c => {
      if (c.id === targetChatId) {
        return {
          ...c,
          messages: [...c.messages, initialAiMessage]
        };
      }
      return c;
    }));

    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Fetch full dialog history formatted for model
      const dialogHistory = currentChat.messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const responseGenerator = streamGeminiResponse({
        model,
        messages: dialogHistory,
        signal: controller.signal
      });

      let accumulatedResponse = '';

      for await (const chunk of responseGenerator) {
        accumulatedResponse += chunk;
        setChats(prev => prev.map(c => {
          if (c.id === targetChatId) {
            return {
              ...c,
              messages: c.messages.map(m => m.id === aiMessageId ? { ...m, content: accumulatedResponse } : m)
            };
          }
          return c;
        }));
      }

      // Finalize and remove streaming flag
      setChats(prev => prev.map(c => {
        if (c.id === targetChatId) {
          return {
            ...c,
            messages: c.messages.map(m => m.id === aiMessageId ? { ...m, isStreaming: false } : m)
          };
        }
        return c;
      }));

    } catch (err) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        console.log('Stream stopped by user.');
        // Finalize state gracefully
        setChats(prev => prev.map(c => {
          if (c.id === targetChatId) {
            return {
              ...c,
              messages: c.messages.map(m => m.id === aiMessageId ? { ...m, isStreaming: false, aborted: true } : m)
            };
          }
          return c;
        }));
      } else {
        console.error('Core streaming failed:', err);
        const errText = err.message || "An unexpected error occurred. Please check your API key / internet connection and try again.";
        setStreamError(errText);
        
        // Render detailed error in bubble
        setChats(prev => prev.map(c => {
          if (c.id === targetChatId) {
            return {
              ...c,
              messages: c.messages.map(m => m.id === aiMessageId ? { 
                ...m, 
                content: `❌ **Komsiri Stream Error**\n\n${errText}`, 
                isStreaming: false,
                isError: true
              } : m)
            };
          }
          return c;
        }));
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // --- Regenerate Latest Response ---
  const handleRegenerate = async () => {
    if (isGenerating || !activeChatId) return;
    const currentChat = chats.find(c => c.id === activeChatId);
    if (!currentChat || currentChat.messages.length < 2) return;

    // Filter out the last AI response (or any error notices)
    const messagesCopy = [...currentChat.messages];
    const lastMsg = messagesCopy[messagesCopy.length - 1];
    
    let rePromptContent = "";
    if (lastMsg.role === 'model') {
      messagesCopy.pop(); // pop model response
    }
    
    const lastUserMsg = messagesCopy[messagesCopy.length - 1];
    if (lastUserMsg && lastUserMsg.role === 'user') {
      rePromptContent = lastUserMsg.content;
      messagesCopy.pop(); // pop user message as well because sendMessage will inject it again
    } else {
      return; // Cannot find a historical user request to regenerate
    }

    // Set back pruned message block to active chat
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: messagesCopy } : c));
    
    // Trigger sending this same prompt sequence
    sendMessage(rePromptContent);
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`} id="app-root-container">
      {/* Sidebar navigation */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        deferredInstallPrompt={deferredInstallPrompt}
        onInstallApp={triggerPWAInstall}
      />

      {/* Main chat center */}
      <main className="relative flex flex-1 flex-col h-full overflow-hidden" id="chat-center-stage">
        {/* Navigation / Header */}
        <header className={`flex h-16 items-center justify-between px-4 border-b shrink-0 z-30 ${
          theme === 'dark' ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-200 bg-white/70'
        } backdrop-blur-md`}>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className={`rounded-xl p-2 md:hidden transition-all cursor-pointer ${
                theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
              }`}
              title="Open Navigation"
              id="mobile-drawer-btn"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight uppercase tracking-widest text-red-500">
                AI Agent Console
              </span>
              <span className={`text-[11.5px] font-mono leading-none flex items-center gap-1 ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                <Cpu className="w-3.5 h-3.5" />
                <span>{model}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick settings button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`rounded-xl p-2.5 transition-all cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title="Configure Settings"
              id="header-settings-btn"
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </header>

        {/* Messaging Container */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 scrollbar-thin scroll-smooth" id="message-list-viewport">
          {!activeChat || activeChat.messages.length === 0 ? (
            /* EMPTY / WELCOME SCREEN */
            <div className="mx-auto max-w-2xl py-8 md:py-16 space-y-8 animate-fade-in" id="welcome-pane">
              <div className="text-center space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-blue-600 p-[2.5px] shadow-xl shadow-red-500/10">
                  <div className={`flex h-full w-full items-center justify-center rounded-[14px] ${
                    theme === 'dark' ? 'bg-slate-900' : 'bg-white'
                  }`}>
                    <Sparkles className="h-7 w-7 text-red-500 fill-red-500/15 animate-pulse" />
                  </div>
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl bg-gradient-to-r from-red-500 via-rose-500 to-blue-500 bg-clip-text text-transparent">
                  Komsiri AI Portal
                </h2>
                <p className={`text-xs md:text-sm max-w-md mx-auto leading-relaxed ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  A zero-barrier intelligent companion. No logins, no passwords. Instantly connected to Gemini intelligence via secure browser local storage.
                </p>
              </div>

              {/* Suggestions Stage */}
              <div className="space-y-3">
                <h3 className={`text-xs font-bold uppercase tracking-wider text-center ${
                  theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Suggested Prompts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="suggestions-grid">
                  {SUGGESTED_PROMPTS.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(item.prompt)}
                      className={`flex flex-col items-left text-left p-4 rounded-2xl border text-slate-300 transition-all cursor-pointer active:scale-[0.985] group ${
                        theme === 'dark' 
                          ? 'border-slate-800 bg-slate-900/40 hover:bg-slate-850/60 hover:border-red-500/40' 
                          : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-red-500/30 shadow-sm'
                      }`}
                      id={`suggest-btn-${index}`}
                    >
                      <span className="text-xl mb-1.5 select-none">{item.icon}</span>
                      <strong className={`text-xs font-bold select-none truncate ${
                        theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                      }`}>
                        {item.title}
                      </strong>
                      <span className="text-[10px] mt-0.5 select-none leading-normal text-slate-500 line-clamp-2">
                        {item.subtitle}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* CONVERSATION TIMELINE */
            <div className="mx-auto max-w-3xl space-y-6" id="message-timeline">
              {activeChat.messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <div
                    key={message.id}
                    className={`flex gap-4 p-4 rounded-2xl animate-fade-in ${
                      isUser
                        ? isUser && theme === 'dark' 
                          ? 'bg-slate-800/30 border border-slate-800/45 ml-auto max-w-[85%]'
                          : 'bg-red-50/50 border border-red-100 ml-auto max-w-[85%]'
                        : 'bg-transparent mr-auto w-full'
                    }`}
                    id={`msg-bubble-${message.id}`}
                  >
                    {/* Role Icon */}
                    <div className="shrink-0 select-none">
                      {isUser ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800/80 text-xs font-bold text-slate-200">
                          U
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-blue-600 p-[1.5px]">
                          <div className={`flex h-full w-full items-center justify-center rounded-[9px] ${
                            theme === 'dark' ? 'bg-slate-950' : 'bg-white'
                          }`}>
                            <Sparkles className="h-4.5 w-4.5 text-red-500 fill-red-500/10 animate-pulse" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2 select-none">
                        <span className={`text-[10.5px] font-bold uppercase tracking-wider ${
                          isUser ? 'text-red-500' : 'text-blue-500'
                        }`}>
                          {isUser ? 'You' : 'Komsiri AI'}
                        </span>
                        <span className={`text-[9.5px] font-mono ${
                          theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {message.timestamp}
                        </span>
                      </div>

                      <div className={`text-[14.5px] text-justify tracking-wide leading-relaxed break-words ${
                        isUser 
                          ? theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                          : theme === 'dark' ? 'text-slate-300' : 'text-slate-800'
                      }`}>
                        {isUser ? (
                          <p className="whitespace-pre-line">{message.content}</p>
                        ) : (
                          <Markdown content={message.content} />
                        )}

                        {/* Loading / Streaming Cursor indicator */}
                        {message.isStreaming && !message.content && (
                          <div className="flex items-center gap-1.5 py-1">
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="h-2 w-2 rounded-full bg-blue-505 bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="h-2 w-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                            <span className="text-xs text-slate-500 italic ml-1 select-none">Typing streaming buffer...</span>
                          </div>
                        )}
                      </div>

                      {/* Floating operations menu */}
                      <div className="flex items-center gap-2 pt-2.5 opacity-80 select-none">
                        <button
                          onClick={() => handleCopyMessage(message.id, message.content)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] border transition-all cursor-pointer ${
                            theme === 'dark'
                              ? 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800'
                              : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                          }`}
                          title="Copy message content"
                          id={`msg-copy-btn-${message.id}`}
                        >
                          {copiedMessageId === message.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                              <span className="text-green-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 shrink-0" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        {/* Regenerate visible on last message list item only */}
                        {!isUser && !isGenerating && activeChat.messages[activeChat.messages.length - 1].id === message.id && (
                          <button
                            onClick={handleRegenerate}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] border transition-all cursor-pointer ${
                              theme === 'dark'
                                ? 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800'
                                : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                            }`}
                            title="Regenerate core response"
                            id={`msg-regenerate-btn-${message.id}`}
                          >
                            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                            <span>Regenerate</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Global Error Notice floating above inputs */}
        {streamError && (
          <div className="mx-auto max-w-xl px-4 animate-scale-up select-none">
            <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-500" />
                <p className="text-xs font-semibold">{streamError}</p>
              </div>
              <button 
                onClick={() => setStreamError(null)}
                className="rounded-lg p-0.5 hover:bg-red-500/20 text-red-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Messaging input area */}
        <footer className={`p-4 border-t ${
          theme === 'dark' ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-white/70'
        } backdrop-blur-md shrink-0`} id="input-chat-dock">
          <div className="mx-auto max-w-3xl space-y-2">
            <div className="flex items-stretch gap-2">
              
              {/* Main chat bar form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex-1 flex items-center relative"
                id="message-core-form"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  disabled={isGenerating}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message or paste a prompt..."
                  className={`w-full h-12 pl-4 pr-12 rounded-2xl border transition-all text-[14.5px] focus:outline-none focus:ring-1 select-text ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-red-500/70 focus:ring-red-500/70'
                      : 'bg-slate-100 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-red-500/50 focus:ring-red-500/50'
                  }`}
                  id="chat-main-input"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || isGenerating}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-red-600 text-white shadow-md hover:bg-red-500 transition-all select-none cursor-pointer disabled:opacity-30 disabled:pointer-events-none disabled:shadow-none`}
                  title="Send message"
                  id="chat-submit-btn"
                >
                  <Send className="w-4 h-4 shrink-0" />
                </button>
              </form>

              {/* Generating Actions (Stop Option) */}
              {isGenerating ? (
                <button
                  onClick={handleStopGenerating}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer"
                  title="Stop Generating response"
                  id="stream-stop-btn"
                >
                  <StopCircle className="w-5.5 h-5.5 shrink-0" />
                </button>
              ) : (
                /* Clear context option if chats present */
                activeChat && activeChat.messages.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Reset conversation timeline completely? This keeps the history thread, but archives current UI stage.")) {
                        handleNewChat();
                      }
                    }}
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400'
                        : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-500'
                    }`}
                    title="Start fresh context"
                    id="fresh-context-btn"
                  >
                    <Plus className="w-5 h-5 shrink-0" />
                  </button>
                )
              )}
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <span className={`text-[10px] font-mono select-none ${
                theme === 'dark' ? 'text-slate-600' : 'text-slate-400'
              }`}>
                © 2026 Komsiri AI. Offline privacy guaranteed. Runs entirely in browser sandbox safely.
              </span>
            </div>
          </div>
        </footer>
      </main>

      {/* Global minimal Settings modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        model={model}
        setModel={setModel}
        theme={theme}
        setTheme={setTheme}
      />
    </div>
  );
}
