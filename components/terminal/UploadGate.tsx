import React, { useRef, useState } from 'react';

interface Props {
  onLoad: (csv: string) => void;
  error?: string | null;
}

const UploadGate: React.FC<Props> = ({ onLoad, error }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => onLoad(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  return (
    <div className="h-full w-full flex items-center justify-center px-6 bg-bg-0">
      <div className="max-w-[640px] w-full">
        <div className="text-[10px] tracking-[0.32em] text-amber mb-4">▸ DESK / PORTFOLIO TERMINAL · v0.1</div>
        <div className="text-[40px] leading-[1.05] tracking-[-0.01em] mb-3 text-ink">
          Load the book.
        </div>
        <div className="text-[12px] text-ink-2 mb-8 max-w-[480px] leading-relaxed">
          Upload a CSV of your positions to populate the terminal. Required columns: <span className="text-amber">Symbol</span>, <span className="text-amber">Quantity</span>, <span className="text-amber">CurrentPrice</span>, <span className="text-amber">PurchasePrice</span>. Optional: HighLimit, LowLimit, Sector. Saudi tickers (e.g. <span className="text-amber">4280</span>) are auto-converted from SAR.
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`border border-dashed cursor-pointer px-6 py-12 text-center transition-colors ${
            dragOver ? 'border-amber bg-amber/5 text-amber' : 'border-line-2 text-ink-2 hover:border-amber/60 hover:text-ink'
          }`}
        >
          <div className="text-[14px] tracking-[0.18em] mb-2">⬆ DROP CSV · OR CLICK TO BROWSE</div>
          <div className="text-[10px] text-ink-4 tracking-[0.18em]">FORMAT · UTF-8 · COMMA-SEPARATED · HEADER ROW REQUIRED</div>
        </div>

        {error && (
          <div className="mt-4 text-[11px] text-red border border-red/40 px-3 py-2 bg-red/5">
            ▸ {error}
          </div>
        )}

        <div className="mt-8 text-[9px] tracking-[0.22em] text-ink-4">
          █ KEYBOARD · <span className="text-ink-3">⌘O</span> open file · <span className="text-ink-3">/</span> command
        </div>
      </div>
    </div>
  );
};

export default UploadGate;
