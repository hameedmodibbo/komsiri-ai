import React, { useState } from 'react';
import { 
  MessageSquare, Plus, Trash2, Edit2, Check, X, 
  Settings, Sparkles, SlidersHorizontal, Download
} from 'lucide-react';

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  isOpen,         // mobile open status
  onClose,        // mobile close handler
  onOpenSettings,
  deferredInstallPrompt, // PWA install prompt event ref
  onInstallApp          // trigger callback
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const startRename = (chat, e) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const saveRename = (chatId, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameChat(chatId, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleKeyPress = (e, chatId) => {
    if (e.key === 'Enter') {
      saveRename(chatId, e);
    } else if (e.key === 'Escape') {
      cancelRename(e);
    }
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden animate-fade-in"
          id="sidebar-overlay"
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-slate-800 bg-slate-950/80 backdrop-blur-xl transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-[0]' : '-translate-x-full'
        } shrink-0 md:static md:w-[260px] lg:w-[280px]`}
        id="komsiri-sidebar"
      >
        {/* Brand Banner */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-slate-800/60">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-blue-600 p-[2px] shadow-lg shadow-red-500/10">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-900">
              <Sparkles className="h-4.5 w-4.5 text-red-500 fill-red-500/10 animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1">
              Komsiri <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent font-extrabold text-[12px] uppercase tracking-widest">AI</span>
            </h1>
            <span className="text-[10px] font-mono text-slate-500">Premium Portal v1.2</span>
          </div>
        </div>

        {/* Action Button: New Chat */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewChat();
              if (onClose) onClose(); // close sidebar drawer on mobile
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 font-medium hover:from-red-500 hover:to-red-600 text-sm text-white px-4 py-3 shadow-[0_4px_12px_rgba(239,68,68,0.25)] hover:shadow-[0_4px_20px_rgba(239,68,68,0.4)] active:scale-[0.98] transition-all cursor-pointer"
            id="new-chat-btn"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Navigation / Chat List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-thin select-none" id="sidebar-scroller">
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <MessageSquare className="w-8 h-8 text-slate-700 stroke-[1.5] mb-2" />
              <p className="text-xs text-slate-500 font-medium">No conversation history</p>
              <p className="text-[10px] text-slate-600 mt-1">Your local state is completely clean.</p>
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = chat.id === activeChatId;

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat.id);
                    if (onClose) onClose(); // close sidebar drawer on mobile
                  }}
                  className={`group relative flex items-center justify-between rounded-xl px-3.5 py-3 text-sm transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 border border-slate-800 text-white font-medium shadow-inner'
                      : 'text-slate-400 border border-transparent hover:bg-slate-900/40 hover:text-slate-200'
                  }`}
                  id={`chat-item-${chat.id}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 w-full pr-14">
                    <MessageSquare className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-red-500' : 'text-slate-500'}`} />
                    
                    {editingId === chat.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, chat.id)}
                        onClick={(e) => e.stopPropagation()} // block click from switching
                        className="w-full bg-slate-950 border border-red-500/80 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                        autoFocus
                        id={`rename-input-${chat.id}`}
                      />
                    ) : (
                      <span className="truncate text-xs font-medium tracking-wide">
                        {chat.title}
                      </span>
                    )}
                  </div>

                  {/* Operational buttons */}
                  <div className="absolute right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 md:group-hover:flex transition-opacity select-none">
                    {editingId === chat.id ? (
                      <>
                        <button
                          onClick={(e) => saveRename(chat.id, e)}
                          className="p-1 rounded text-green-400 hover:bg-slate-800"
                          title="Save Chat Name"
                          id={`save-rename-btn-${chat.id}`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => cancelRename(e)}
                          className="p-1 rounded text-red-400 hover:bg-slate-800"
                          title="Cancel"
                          id={`cancel-rename-btn-${chat.id}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => startRename(chat, e)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-indigo-600/20 transition-all"
                          title="Rename Chat"
                          id={`rename-btn-${chat.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete the chat "${chat.title}"?`)) {
                              onDeleteChat(chat.id);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Delete Chat"
                          id={`delete-btn-${chat.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Configuration */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/40 select-none">
          {/* PWA Install Trigger button if available */}
          {deferredInstallPrompt && (
            <button
              onClick={onInstallApp}
              className="mb-3 flex w-full items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-[11.5px] text-white px-3 py-2 px-3 py-2.5 font-semibold shadow-lg shadow-blue-500/10 transition-all cursor-pointer animate-pulse"
              id="pwa-install-banner-btn"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Install Komsiri AI App</span>
            </button>
          )}

          {/* User Settings button */}
          <button
            onClick={onOpenSettings}
            className="flex w-full items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5 text-xs text-slate-300 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
            id="settings-trigger-btn"
          >
            <Settings className="w-4 h-4 shrink-0 text-slate-400" />
            <span className="font-semibold text-xs text-left flex-1 text-slate-300">Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
