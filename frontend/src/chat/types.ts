// Chat module type definitions

/** A single chat message from the poll response */
export interface ChatMessage {
  id: number;
  role: 'user' | 'orchestrator' | 'agent';
  content: string;
  agent: string | null;
  created_at: string;
}

/** Agent status from the poll response */
export interface AgentState {
  pokemon: string;
  role: string;
  shop: string;
  status: string;
  dex_id: number;
}

/** Full poll response shape from GET /api/session/<id>/state/ */
export interface PollResponse {
  session_status: string;
  agents: AgentState[];
  messages: ChatMessage[];
  partner_target: string | null;
}

/** Bundled state change payload passed to the callback */
export interface StateUpdate {
  agents: AgentState[];
  partnerTarget: string | null;
}

/** ChatPanel constructor options */
export interface ChatPanelConfig {
  baseUrl: string;
  sessionId: number;
  onStateChange: (update: StateUpdate) => void;
  /** Called when /rest ends the session */
  onSessionEnd?: () => void;
  /** Poll interval in ms (default 2000) */
  pollInterval?: number;
  /** LLM provider name sent as X-LLM-Provider header */
  llmProvider?: string;
  /** LLM API key sent as X-LLM-Key header */
  llmKey?: string;
}

/** Hardcoded agent name colors */
export const AGENT_COLORS: Record<string, string> = {
  wigglytuff: '#ff8fa3',
  kecleon: '#77dd77',
  kangaskhan: '#c4a35a',
  duskull: '#9a8eb5',
  electivire: '#ffd966',
  marowak: '#c08552',
  chansey: '#ffb3c6',
  xatu: '#7ec8e3',
};

/** Default color for orchestrator / unknown agents */
export const DEFAULT_AGENT_COLOR = '#a8d8ea';

/** User message color */
export const USER_COLOR = '#ffffff';
