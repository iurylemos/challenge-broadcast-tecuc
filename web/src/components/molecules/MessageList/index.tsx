import type { JSX } from "react";

import {
  MessageStatus,
  type Message,
} from "../../../interfaces/message.interface";
import { DateUtil } from "../../../utils/date.util";

type MessageListProps = {
  messages: Message[];
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
};

export default function MessageList({
  messages,
  onEdit,
  onDelete,
}: Readonly<MessageListProps>): JSX.Element {
  if (!messages.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 px-6 py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
          <span className="text-lg text-slate-500">∅</span>
        </div>

        <p className="mt-4 text-sm font-medium text-slate-300">
          Nenhuma mensagem encontrada.
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Suas mensagens enviadas e agendadas aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message: Message) => {
        const isSent = message.status === MessageStatus.SENT;
        const isScheduled = message.status === MessageStatus.SCHEDULED;

        return (
          <article
            key={message.id}
            className="rounded-2xl border border-white/10 bg-slate-900 p-5 transition-colors hover:border-violet-500/20"
          >
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    isSent
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  <span
                    className={`mr-2 h-1.5 w-1.5 rounded-full ${
                      isSent ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />

                  {isSent ? "Enviada" : "Agendada"}
                </span>

                <span className="text-xs text-slate-500">
                  {isSent ? "Enviada" : "Agendamento"}
                </span>
              </div>

              <div>
                <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-200">
                  {message.message}
                </p>

                {isScheduled && message.scheduledAt && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/5 bg-white/2 px-4 py-3">
                    <span className="text-xs font-medium text-slate-500">
                      Agendada para
                    </span>

                    <span className="text-sm font-medium text-slate-300">
                      {DateUtil.formatDate(message.scheduledAt)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
                {isScheduled && (
                  <button
                    type="button"
                    onClick={() => onEdit(message)}
                    className="cursor-pointer rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    Editar
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onDelete(message)}
                  className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Excluir
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
