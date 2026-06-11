import React, { useEffect, useRef } from 'react';
import { X, Cpu, Moon, Sun } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  model,
  setModel,
  theme,
  setTheme
}) {
  const modalRef = useRef(null);

  // Close modal when keyboard Esc is pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle overlay click to close
  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      id="settings-overlay"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl animate-scale-up"
        id="settings-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
              Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            id="settings-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Model selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
              <Cpu className="w-4 h-4 text-blue-500 shrink-0" />
              <span>AI Model</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModel('Gemini 2.5 Flash')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  model === 'Gemini 2.5 Flash'
                    ? 'border-red-500 bg-red-500/10 text-white font-medium'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-850/20'
                }`}
                id="model-flash-btn"
              >
                <span className="text-xs">Gemini 2.5 Flash</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Fast, optimized</span>
              </button>
              <button
                type="button"
                onClick={() => setModel('Gemini 2.5 Pro')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  model === 'Gemini 2.5 Pro'
                    ? 'border-blue-500 bg-blue-500/10 text-white font-medium'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-850/20'
                }`}
                id="model-pro-btn"
              >
                <span className="text-xs">Gemini 2.5 Pro</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Complex reasoning</span>
              </button>
            </div>
          </div>

          {/* Theme customizer */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-violet-500 shrink-0" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span>Theme Appearance</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-medium'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-850/20'
                }`}
                id="theme-light-btn"
              >
                <Sun className="w-4 h-4 shrink-0" />
                <span className="text-xs">Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-violet-500 bg-violet-500/10 text-violet-300 font-medium'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-850/20'
                }`}
                id="theme-dark-btn"
              >
                <Moon className="w-4 h-4 shrink-0" />
                <span className="text-xs">Dark</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-800/80 px-6 py-4 bg-slate-950/25">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-705% hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
            id="settings-save-btn"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
