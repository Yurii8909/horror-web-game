import React, { useState } from 'react';
import { 
  X, 
  Code2, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  Terminal, 
  Sparkles, 
  FolderTree,
  ExternalLink
} from 'lucide-react';
import { ROBLOX_SCRIPTS, RobloxScriptFile } from '../data/robloxScripts';

interface RobloxDevKitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RobloxDevKitModal: React.FC<RobloxDevKitModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<RobloxScriptFile>(ROBLOX_SCRIPTS[0]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selectedFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-3xl p-5 md:p-7 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-zinc-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/10 border border-red-500/30 rounded-2xl text-red-400">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold tracking-wide text-zinc-100 font-mono">
                  Roblox Studio DevKit & Python Скрипты
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950 border border-red-800 text-red-300">
                  Lua & Python
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Готовые скрипты для переноса в Roblox Studio (для демонстрации однокурсникам и преподавателю)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Layout: Sidebar with files & Main Code Viewer */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4 flex-1 overflow-hidden">
          
          {/* Left Sidebar: File List & Hierarchy Guide */}
          <div className="md:col-span-4 flex flex-col gap-3 overflow-y-auto pr-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 px-1">
              <FolderTree className="w-3.5 h-3.5 text-red-400" />
              <span>Файлы Скриптов</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {ROBLOX_SCRIPTS.map((file) => {
                const isSelected = selectedFile.filename === file.filename;
                return (
                  <button
                    key={file.filename}
                    onClick={() => {
                      setSelectedFile(file);
                      setCopied(false);
                    }}
                    className={`text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-red-950/40 border-red-700/70 text-red-200 shadow-md'
                        : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold truncate">
                        {file.filename}
                      </span>
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                        file.language === 'python' ? 'bg-blue-950 text-blue-300' : 'bg-red-950 text-red-300'
                      }`}>
                        {file.language}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 truncate">
                      {file.location}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Guide Box */}
            <div className="mt-auto p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl text-xs text-zinc-400 leading-relaxed">
              <div className="font-bold text-zinc-200 mb-1 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                Инструкция для Roblox Studio:
              </div>
              1. Скопируйте нужный код кнопкой справа.<br />
              2. В окне Explorer создайте соответствующий Script в указанной папке.<br />
              3. Запустите Play (F5) — карта, монстр и крафт сгенерируются автоматически!
            </div>
          </div>

          {/* Right Main: Code Editor / Viewer */}
          <div className="md:col-span-8 flex flex-col bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
            
            {/* Code Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800 text-xs">
              <div className="flex flex-col">
                <span className="font-mono font-bold text-zinc-200">{selectedFile.filename}</span>
                <span className="text-[11px] text-amber-400 font-mono">{selectedFile.location}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-semibold transition-all active:scale-95 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Скопировано!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Копировать</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/60 hover:bg-red-800/80 text-red-200 rounded-xl font-semibold border border-red-700/60 transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Скачать</span>
                </button>
              </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 p-4 overflow-auto font-mono text-xs text-zinc-300 leading-relaxed bg-[#0b0c10]">
              <pre className="whitespace-pre">
                <code>{selectedFile.code}</code>
              </pre>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
