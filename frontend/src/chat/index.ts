// Chat module — public API

export type {
  ChatMessage,
  AgentState,
  PollResponse,
  StateUpdate,
  ChatPanelConfig,
} from './types.js';
export { AGENT_COLORS, DEFAULT_AGENT_COLOR, USER_COLOR } from './types.js';
export { parseSlashCommand, mergeMessages, isInputLocked } from './state.js';
export { sendMessage, pollState, endSession } from './api.js';
export { ChatPanel } from './panel.js';
