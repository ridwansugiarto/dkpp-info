export interface Employee {
  id: string;
  nip?: string | null;
  full_name: string;
  position?: string | null;
  unit?: string | null;
  photo_url?: string | null;
  is_active: boolean;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
  match_tier?: number;
}

export interface PollTheme {
  id: string;
  code: string;
  title: string;
  short_label: string;
  icon?: string | null;
  description?: string | null;
  max_choices: number;
  allow_self_vote: boolean;
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at?: string;
  has_voted?: boolean;
}

export interface PollResultItem {
  poll_id: string;
  employee_id: string;
  nip?: string | null;
  full_name: string;
  position?: string | null;
  unit?: string | null;
  photo_url?: string | null;
  total_votes: number;
  percentage: number;
  rank: number;
}

export interface PollVotePayload {
  poll_id: string;
  employee_ids: string[];
}

export interface AuditLogItem {
  id: number;
  actor_user_id?: string | null;
  action: string;
  poll_id?: string | null;
  payload?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  actor_email?: string | null;
}

export interface VoterChoiceDetail {
  user_id: string;
  user_email: string;
  choices: Array<{
    employee_id: string;
    full_name: string;
    position?: string | null;
  }>;
  voted_at: string;
}

export interface PollIntentResult {
  intent: 'EMPLOYEE_POLL' | 'GENERAL_CHAT';
  category?: string | null;
  poll_title?: string | null;
  confidence: number;
}
