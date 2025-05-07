
export interface UserData {
  id: string;
  role: string;
}

export interface Document {
  id: string;
  nom: string;
  user_id: string;
  categories?: { nom: string };
  url: string | null;
  is_shared?: boolean;
  content: string | null;
  category_id?: string | null;
}

export interface Category {
  id: string;
  nom: string | null;
}
