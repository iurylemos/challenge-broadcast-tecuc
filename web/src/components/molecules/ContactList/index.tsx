import type { JSX } from "react";
import type { Contact } from "../../../interfaces/contact.interface";

type ContactListProps = {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  openMessages: (contact: Contact) => void;
  onSelect?: (contact: Contact) => void;
  selectedIds?: string[];
};

export default function ContactList({
  contacts,
  onEdit,
  onDelete,
  openMessages,
}: Readonly<ContactListProps>): JSX.Element {
  if (!contacts.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 px-6 py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
          <span className="text-lg text-slate-500">∅</span>
        </div>

        <p className="mt-4 text-sm font-medium text-slate-300">
          Nenhum contato cadastrado.
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Adicione um contato para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {contacts.map((contact) => (
        <article
          key={contact.id}
          className="group rounded-2xl border border-white/10 bg-slate-900 p-5 transition-all hover:border-violet-500/30 hover:bg-slate-900/80"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
              <span className="text-base font-bold text-violet-400">
                {contact.name.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold text-white">
                {contact.name}
              </h2>

              <p className="mt-1 truncate text-sm text-slate-400">
                {contact.phone}
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openMessages(contact)}
                className="cursor-pointer flex-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
              >
                Mensagens
              </button>

              <button
                type="button"
                onClick={() => onEdit(contact)}
                className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={() => onDelete(contact)}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
              >
                Excluir
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
