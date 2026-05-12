// ChatPanel — self-contained DOM chat panel with polling, collapse, and /rest support

import type { ChatMessage, ChatPanelConfig, StateUpdate } from './types.js';
import { AGENT_COLORS, DEFAULT_AGENT_COLOR, USER_COLOR } from './types.js';
import { parseSlashCommand, mergeMessages, isInputLocked } from './state.js';
import { sendMessage, pollState, endSession } from './api.js';

const PANEL_WIDTH = 360;
const STYLES = `
  .rta-chat-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: ${PANEL_WIDTH}px;
    height: 100%;
    background: #1a1a2e;
    border-left: 2px solid #333;
    display: flex;
    flex-direction: column;
    font-family: monospace;
    font-size: 13px;
    color: #e0e0e0;
    transition: transform 0.25s ease;
    z-index: 1000;
  }
  .rta-chat-panel.collapsed {
    transform: translateX(${PANEL_WIDTH}px);
  }
  .rta-chat-toggle {
    position: fixed;
    top: 50%;
    right: ${PANEL_WIDTH}px;
    transform: translateY(-50%);
    background: #1a1a2e;
    border: 2px solid #333;
    border-right: none;
    color: #e0e0e0;
    padding: 8px 4px;
    cursor: pointer;
    font-family: monospace;
    font-size: 14px;
    z-index: 1001;
    transition: right 0.25s ease;
    border-radius: 4px 0 0 4px;
  }
  .rta-chat-panel.collapsed + .rta-chat-toggle {
    right: 0;
  }
  .rta-chat-header {
    padding: 10px 12px;
    border-bottom: 1px solid #333;
    font-weight: bold;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .rta-chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .rta-chat-msg {
    max-width: 85%;
    padding: 6px 10px;
    border-radius: 8px;
    word-wrap: break-word;
    line-height: 1.4;
  }
  .rta-chat-msg.user {
    align-self: flex-end;
    background: #2a2a4a;
  }
  .rta-chat-msg.other {
    align-self: flex-start;
    background: #16213e;
  }
  .rta-chat-msg-name {
    font-weight: bold;
    font-size: 11px;
    margin-bottom: 2px;
    text-transform: capitalize;
  }
  .rta-chat-input-area {
    display: flex;
    padding: 8px;
    border-top: 1px solid #333;
    gap: 4px;
  }
  .rta-chat-input {
    flex: 1;
    background: #0f0f1a;
    border: 1px solid #444;
    color: #e0e0e0;
    padding: 6px 8px;
    font-family: monospace;
    font-size: 13px;
    border-radius: 4px;
    outline: none;
  }
  .rta-chat-input:disabled {
    opacity: 0.5;
  }
  .rta-chat-btn {
    background: #2a2a4a;
    border: 1px solid #444;
    color: #e0e0e0;
    padding: 6px 12px;
    cursor: pointer;
    font-family: monospace;
    font-size: 12px;
    border-radius: 4px;
  }
  .rta-chat-btn:hover {
    background: #3a3a5a;
  }
  .rta-chat-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .rta-chat-btn.stop {
    background: #8b0000;
    border-color: #a00;
  }
  .rta-chat-btn.stop:hover {
    background: #a00;
  }
  .rta-chat-status {
    padding: 8px 12px;
    text-align: center;
    font-size: 11px;
    color: #888;
    border-top: 1px solid #333;
  }
  .rta-chat-loading {
    padding: 6px 10px;
    font-style: italic;
    color: #9090c0;
    font-size: 12px;
    animation: rta-pulse 1.5s ease-in-out infinite;
  }
  @keyframes rta-pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
`;

export class ChatPanel {
  private config: ChatPanelConfig;
  private messages: ChatMessage[] = [];
  private sessionStatus = 'active';
  private waitingForResponse = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastMessageTime: string | null = null;
  private collapsed = false;

  // DOM refs
  private panel!: HTMLDivElement;
  private toggle!: HTMLButtonElement;
  private msgContainer!: HTMLDivElement;
  private input!: HTMLInputElement;
  private sendBtn!: HTMLButtonElement;
  private stopBtn!: HTMLButtonElement;
  private statusEl!: HTMLDivElement;
  private loadingEl!: HTMLDivElement;

  constructor(config: ChatPanelConfig) {
    this.config = config;
    this.injectStyles();
    this.buildDOM();
    this.startPolling();
  }

  /** Inject scoped styles once */
  private injectStyles(): void {
    if (document.getElementById('rta-chat-styles')) return;
    const style = document.createElement('style');
    style.id = 'rta-chat-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  /** Build the full panel DOM and append to body */
  private buildDOM(): void {
    // Panel container
    this.panel = document.createElement('div');
    this.panel.className = 'rta-chat-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'rta-chat-header';
    header.textContent = 'Rescue Team Chat';
    this.panel.appendChild(header);

    // Messages
    this.msgContainer = document.createElement('div');
    this.msgContainer.className = 'rta-chat-messages';
    this.panel.appendChild(this.msgContainer);

    // Loading indicator
    this.loadingEl = document.createElement('div');
    this.loadingEl.className = 'rta-chat-loading';
    this.loadingEl.textContent = 'Your team is working on it...';
    this.loadingEl.style.display = 'none';
    this.msgContainer.appendChild(this.loadingEl);

    // Status bar
    this.statusEl = document.createElement('div');
    this.statusEl.className = 'rta-chat-status';
    this.statusEl.textContent = 'Connected';
    this.panel.appendChild(this.statusEl);

    // Input area
    const inputArea = document.createElement('div');
    inputArea.className = 'rta-chat-input-area';

    this.input = document.createElement('input');
    this.input.className = 'rta-chat-input';
    this.input.placeholder = 'Type a message...';
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !this.input.disabled) this.handleSend();
    });

    this.sendBtn = document.createElement('button');
    this.sendBtn.className = 'rta-chat-btn';
    this.sendBtn.textContent = 'Send';
    this.sendBtn.addEventListener('click', () => this.handleSend());

    this.stopBtn = document.createElement('button');
    this.stopBtn.className = 'rta-chat-btn stop';
    this.stopBtn.textContent = 'Stop';
    this.stopBtn.style.display = 'none';
    this.stopBtn.addEventListener('click', () => this.handleStop());

    inputArea.appendChild(this.input);
    inputArea.appendChild(this.sendBtn);
    inputArea.appendChild(this.stopBtn);
    this.panel.appendChild(inputArea);

    // Toggle button
    this.toggle = document.createElement('button');
    this.toggle.className = 'rta-chat-toggle';
    this.toggle.textContent = '\u25C0';
    this.toggle.addEventListener('click', () => this.toggleCollapse());

    document.body.appendChild(this.panel);
    document.body.appendChild(this.toggle);
  }

  /** Toggle panel collapse state */
  private toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.panel.classList.toggle('collapsed', this.collapsed);
    this.toggle.textContent = this.collapsed ? '\u25B6' : '\u25C0';
    // Update toggle position via CSS adjacency
  }

  /** Handle send button / enter key */
  private async handleSend(): Promise<void> {
    const text = this.input.value.trim();
    if (!text) return;

    // Check for slash commands
    const cmd = parseSlashCommand(text);
    if (cmd === 'rest') {
      this.input.value = '';
      await this.handleRest();
      return;
    }

    this.input.value = '';
    this.setWaiting(true);

    try {
      await sendMessage(this.config.baseUrl, this.config.sessionId, text);
    } catch (err) {
      this.setStatus(`Error: ${err instanceof Error ? err.message : 'unknown'}`);
      this.setWaiting(false);
    }
  }

  /** Handle /rest command */
  private async handleRest(): Promise<void> {
    this.setWaiting(true);
    try {
      await endSession(this.config.baseUrl, this.config.sessionId);
      this.sessionStatus = 'completed';
      this.stopPolling();
      this.appendSystemMessage('Session ended. Rest well!');
      this.updateInputState();
      this.config.onSessionEnd?.();
    } catch (err) {
      this.setStatus(`Error ending session: ${err instanceof Error ? err.message : 'unknown'}`);
      this.setWaiting(false);
    }
  }

  /** Handle force-stop button */
  private async handleStop(): Promise<void> {
    try {
      await endSession(this.config.baseUrl, this.config.sessionId);
      this.sessionStatus = 'completed';
      this.stopPolling();
      this.appendSystemMessage('Session force-stopped.');
      this.updateInputState();
      this.config.onSessionEnd?.();
    } catch (err) {
      this.setStatus(`Error: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  /** Start the poll loop */
  private startPolling(): void {
    const interval = this.config.pollInterval ?? 2000;
    this.pollTimer = setInterval(() => this.poll(), interval);
    // Initial poll immediately
    this.poll();
  }

  /** Stop the poll loop */
  private stopPolling(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /** Single poll tick */
  private async poll(): Promise<void> {
    try {
      const data = await pollState(this.config.baseUrl, this.config.sessionId, this.lastMessageTime);

      // Update session status
      this.sessionStatus = data.session_status;

      // Merge messages
      const prev = this.messages;
      this.messages = mergeMessages(this.messages, data.messages);
      if (this.messages !== prev) {
        this.renderNewMessages(prev.length);
        // Track latest timestamp for next poll
        const last = this.messages[this.messages.length - 1];
        if (last) this.lastMessageTime = last.created_at;
      }

      // If we were waiting and got a non-user response, unlock input
      if (this.waitingForResponse && data.messages.some((m) => m.role !== 'user')) {
        this.setWaiting(false);
      }

      // Fire state callback
      const update: StateUpdate = {
        agents: data.agents,
        partnerTarget: data.partner_target,
      };
      this.config.onStateChange(update);

      // Handle completed session from server side
      if (data.session_status === 'completed') {
        this.stopPolling();
        this.updateInputState();
      }

      this.setStatus('Connected');
    } catch {
      this.setStatus('Poll error — retrying...');
    }
  }

  /** Render messages from startIndex onward */
  private renderNewMessages(startIndex: number): void {
    for (let i = startIndex; i < this.messages.length; i++) {
      const msg = this.messages[i];
      const el = document.createElement('div');
      const isUser = msg.role === 'user';
      el.className = `rta-chat-msg ${isUser ? 'user' : 'other'}`;

      if (!isUser) {
        const name = document.createElement('div');
        name.className = 'rta-chat-msg-name';
        const displayName = msg.agent ?? msg.role;
        name.textContent = displayName;
        const colorKey = (msg.agent ?? '').toLowerCase();
        name.style.color = AGENT_COLORS[colorKey] ?? DEFAULT_AGENT_COLOR;
        el.appendChild(name);
      }

      const content = document.createElement('div');
      content.textContent = msg.content;
      if (isUser) content.style.color = USER_COLOR;
      el.appendChild(content);

      this.msgContainer.appendChild(el);
    }
    // Auto-scroll to bottom
    this.msgContainer.scrollTop = this.msgContainer.scrollHeight;
  }

  /** Append a system message (not from the server) */
  private appendSystemMessage(text: string): void {
    const el = document.createElement('div');
    el.className = 'rta-chat-msg other';
    el.style.fontStyle = 'italic';
    el.style.color = '#888';
    el.textContent = text;
    this.msgContainer.appendChild(el);
    this.msgContainer.scrollTop = this.msgContainer.scrollHeight;
  }

  /** Update input/button disabled states */
  private updateInputState(): void {
    const locked = isInputLocked(this.sessionStatus, this.waitingForResponse);
    this.input.disabled = locked;
    this.sendBtn.disabled = locked;
    this.stopBtn.style.display = this.waitingForResponse ? 'block' : 'none';
  }

  /** Set waiting state */
  private setWaiting(waiting: boolean): void {
    this.waitingForResponse = waiting;
    this.loadingEl.style.display = waiting ? 'block' : 'none';
    if (waiting) {
      // Keep loading indicator at the bottom
      this.msgContainer.appendChild(this.loadingEl);
      this.msgContainer.scrollTop = this.msgContainer.scrollHeight;
    }
    this.updateInputState();
  }

  /** Set status bar text */
  private setStatus(text: string): void {
    this.statusEl.textContent = text;
  }

  /** Clean up — stop polling, remove DOM */
  public destroy(): void {
    this.stopPolling();
    this.panel.remove();
    this.toggle.remove();
  }
}
