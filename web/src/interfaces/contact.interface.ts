export interface Contact {
  id: string;
  connectionId: string;
  name: string;
  phone: string;
}

export type ContactFormData = {
  name: string;
  phone: string;
};
