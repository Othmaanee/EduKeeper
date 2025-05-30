
export interface HistoryItem {
  id: string;
  user_id: string;
  created_at: string;
  action_type: string;
  document_name: string;
  xp_gained: number;
}

export interface SkinType {
  id: string;
  name: string;
  colorClass: string;
  requiredLevel: number;
}
