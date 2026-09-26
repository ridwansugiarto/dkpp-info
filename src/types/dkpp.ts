export type UserRole = 'GUEST' | 'CITIZEN' | 'EMPLOYEE' | 'ADMIN';

export type DocumentFolder = 
  | 'sensitif'
  | 'ketahanan-pangan'
  | 'pertanian'
  | 'perikanan'
  | 'peternakan'
  | 'program'
  | 'kepegawaian';

export type DocumentVisibility = 'PUBLIC' | 'INTERNAL' | 'RESTRICTED' | 'ADMIN';

export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'INDEXED' | 'FAILED';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  is_verified_employee: boolean;
  can_access_sensitive: boolean;
  nip?: string;
  department?: string;
  position?: string;
}

export interface EmployeeRecord {
  id: string;
  nip: string;
  full_name: string;
  email: string;
  department: string;
  position?: string;
  is_active: boolean;
  access_level: 'STANDARD' | 'SENSITIVE' | 'ADMIN';
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  is_archived?: boolean;
  is_pinned?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SourceCitation {
  type: 'LOCAL DATA' | 'KNOWLEDGE BASE' | 'WEB';
  title: string;
  detail?: string;
  url?: string;
  date?: string;
}

export interface ToolCall {
  name: string;
  status: string;
  args?: Record<string, unknown>;
  result?: unknown;
}

export interface MapAction {
  _id?: string;
  type: 'MAP_FIT_BOUNDS' | 'MAP_ZOOM' | 'MAP_HIGHLIGHT' | 'MAP_SET_LAYER' | 'MAP_CLEAR_LAYER' | 'CHOROPLETH' | 'FLY_TO' | string;
  layerName?: string;
  featureName?: string;
  target?: string;
  lat?: number;
  lng?: number;
  thematicMode?: string;
  layersToEnable?: string[];
  pin?: Record<string, unknown>;
  pins?: Array<Record<string, unknown>>;
  filteredWilayah?: string[];
  filterActive?: boolean;
  filterLabel?: string;
  bounds?: [[number, number], [number, number]];
  coordinates?: [number, number];
  zoom?: number;
  properties?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  type?: 'text' | 'poll_card' | 'poll_catalog' | 'poll_carousel' | 'forecast_table' | 'harga_sagon_panel' | 'ikp_pou_panel' | 'indikator_ketapang_panel' | 'ews_panel' | 'auth_prompt' | string;
  poll_card?: {
    poll: import('@/lib/polling/types').PollTheme;
    available_themes?: import('@/lib/polling/types').PollTheme[];
    default_show_results?: boolean;
  };
  poll_catalog?: {
    themes: import('@/lib/polling/types').PollTheme[];
  };
  poll_carousel?: {
    themes: import('@/lib/polling/types').PollTheme[];
    initialThemeCode?: string;
  };
  forecast_table?: import('@/lib/forecast/forecastService').ForecastTableData;
  harga_sagon_panel?: import('@/lib/harga/sagonService').SagonPanelData;
  ikp_pou_panel?: import('@/lib/ketapang/ikpPouService').IkpPouPanelData;
  indikator_ketapang_panel?: import('@/lib/ketapang/indikatorService').IndikatorKetapangPanelData;
  ews_panel?: import('@/lib/ketapang/ewsService').EwsPanelData;
  gkg_panel?: import('@/lib/ketapang/gkgService').GkgPanelData;
  auth_prompt?: 'LOGIN_REQUIRED' | 'NIP_REQUIRED';
  sources?: SourceCitation[];
  tool_calls?: ToolCall[];
  map_actions?: MapAction[];
  created_at: string;
}

export interface UserMemory {
  id: string;
  user_id: string;
  memory_key: string;
  memory_value: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentItem {
  id: string;
  filename: string;
  folder: DocumentFolder;
  category: string;
  is_sensitive: boolean;
  visibility: DocumentVisibility;
  uploaded_by?: string;
  uploaded_at: string;
  version: number;
  checksum?: string;
  mime_type?: string;
  file_size?: number;
  storage_path?: string;
  indexed_at?: string;
  status: DocumentStatus;
  metadata?: Record<string, unknown>;
}

export interface GISLayerMeta {
  id: string;
  name: string;
  category: 'ADMIN' | 'KETAPANG' | 'AGROKLIMAT' | 'PRODUKSI' | 'PASAR' | 'FSVA';
  visible: boolean;
  color?: string;
  dataCount?: number;
  lastUpdated?: string;
}
