import React from 'react';
import { RefreshCcw, Terminal as TerminalIcon } from 'lucide-react';
import { LogEntry } from '../types';
import Modal from './ui/Modal';

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  executingId: string | null;
}

const Terminal: React.FC<TerminalProps> = ({ isOpen, onClose, logs, executingId }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={executingId === 'bulk' ? "Batch Execution Runtime" : "System Console"}
      maxWidth="max-w-3xl"
    >
      <div className="bg-[#050505] border border-white/10 rounded-sm p-1 text-[11px] shadow-inner">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/[0.02] text-white/40 mb-1">
          <TerminalIcon size={12} />
          <span>/bin/automation_runner --verbose</span>
        </div>
        <div
          ref={scrollRef}
          className="h-80 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-1.5 leading-relaxed"
        >
          {logs.length === 0 && (
            <div className="text-white/20 italic">Ready for input...</div>
          )}
          {logs.map((log, i) => (
            <div key={i} className={`break-words ${log.type === 'success' ? 'text-emerald-500' :
                log.type === 'error' ? 'text-red-500' :
                  log.type === 'info' ? 'text-blue-400 font-bold' : 'text-white/30'
              }`}>
              <span className="opacity-30 mr-2">$</span>
              {log.msg}
            </div>
          ))}
          {executingId && (
            <div className="flex items-center gap-2 text-white/40 pt-2 border-t border-white/5 mt-2 animate-pulse">
              <RefreshCcw size={12} className="animate-spin" />
              <span className="tracking-widest uppercase text-[9px]">Processing Stream...</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default Terminal;