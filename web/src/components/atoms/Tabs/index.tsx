import type { JSX } from "react";
import type { MessageFilter } from "../../../interfaces/message.interface";

type TabsProps = {
  currentFilter: MessageFilter;
  setFilter: (filter: MessageFilter) => void;
};

export default function Tabs({
  currentFilter,
  setFilter,
}: Readonly<TabsProps>): JSX.Element {
  return (
    <div className="border-b border-white/10">
      <div className="border-b border-white/10">
        <div className="flex flex-col sm:flex-row">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`cursor-pointer border-b-2 px-4 py-3 text-left text-sm font-medium transition-colors sm:px-0 sm:pb-3 sm:mr-6 ${
              currentFilter === "all"
                ? "border-violet-500 text-violet-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Todas
          </button>

          <button
            type="button"
            onClick={() => setFilter("sent")}
            className={`cursor-pointer border-b-2 px-4 py-3 text-left text-sm font-medium transition-colors sm:px-0 sm:pb-3 sm:mr-6 ${
              currentFilter === "sent"
                ? "border-violet-500 text-violet-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Enviadas
          </button>

          <button
            type="button"
            onClick={() => setFilter("scheduled")}
            className={`cursor-pointer border-b-2 px-4 py-3 text-left text-sm font-medium transition-colors ${
              currentFilter === "scheduled"
                ? "border-violet-500 text-violet-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Agendadas
          </button>
        </div>
      </div>
    </div>
  );
}
