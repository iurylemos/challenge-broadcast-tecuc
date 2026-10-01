import type { JSX } from "react";

export default function Header(): JSX.Element {
  return (
    <header className="border-b border-white/10 bg-slate-950">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-600/30">
            <span className="text-base font-bold text-white">B</span>
          </div>

          <span className="text-lg font-bold tracking-tight text-white">
            Broadcast
          </span>
        </div>
      </div>
    </header>
  );
}
