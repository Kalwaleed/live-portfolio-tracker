import React, { useEffect, useState } from 'react';

interface Props {
  command: string;
  onCommand: (s: string) => void;
  onSubmit: () => void;
}

const fmtClock = (tz: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());

const TopBar: React.FC<Props> = ({ command, onCommand, onSubmit }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const ruh = fmtClock('Asia/Riyadh');
  const nyc = fmtClock('America/New_York');
  const session = (() => {
    const h = new Date(now).getUTCHours();
    if (h >= 13 && h < 20) return { label: 'NYSE OPEN', color: 'text-green' };
    if (h >= 7 && h < 13) return { label: 'EU OPEN', color: 'text-amber' };
    return { label: 'AFTER HOURS', color: 'text-ink-3' };
  })();

  return (
    <div className="relative z-10 h-8 border-b border-line-2 flex items-center px-3 gap-3 bg-bg-0 select-none">
      <div className="flex items-center gap-2">
        <span className="text-amber font-semibold tracking-[0.18em] text-[11px]">▶ DESK</span>
        <span className="text-ink-3 text-[10px] tracking-[0.18em]">/ PORTFOLIO TERMINAL</span>
      </div>

      <div className="flex-1 flex items-center gap-1 mx-3 h-6 border border-line-2 px-2 bg-bg-1">
        <span className="text-amber text-[11px]">/&gt;</span>
        <input
          type="text"
          value={command}
          onChange={(e) => onCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit();
          }}
          placeholder="ask · search · run command"
          className="flex-1 bg-transparent outline-none text-ink text-[11px] placeholder:text-ink-4"
        />
        <span className="text-amber caret-blink">█</span>
      </div>

      <div className="flex items-center gap-3 text-[10px] tracking-[0.18em] text-ink-3">
        <span className={session.color}>● {session.label}</span>
        <span className="text-ink-2">RUH <span className="text-ink">{ruh}</span></span>
        <span className="text-ink-2">NYC <span className="text-ink">{nyc}</span></span>
      </div>
    </div>
  );
};

export default TopBar;
