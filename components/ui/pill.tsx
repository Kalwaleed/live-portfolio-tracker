import { cn } from "@/lib/utils";

export const Pill = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return (
    <div
      className={cn("bg-[#1A1614]/70 backdrop-blur-md font-mono text-base font-bold inline-flex items-center justify-center px-5 h-10 border-2 border-primary rounded-full shadow-[0_0_20px_rgba(255,140,0,0.4)]", className)}
    >
      <span className="inline-block size-3 rounded-full bg-primary mr-2.5 shadow-[0_0_12px_rgba(255,140,0,0.8)] animate-pulse" />

      {children}
    </div>
  );
};
