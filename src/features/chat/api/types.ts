import type { ProviderId } from '@/core/providers/types';
import type { ChatMessage } from '@/core/types';
import type { ChatActivity } from '@/features/chat/state/types';

/** Incremented when the public chat API changes incompatibly. */
export const CLAUDIAN_API_VERSION = 1 as const;

/**
 * A companion plugin's handle on one chat tab: the composer and turn controls a user has,
 * plus the same activity reads Zen mode renders. It observes and drives presentation only;
 * it never owns session, conversation, or provider state.
 */
export interface ClaudianChatHandle {
  readonly tabId: string;
  /** Null until the tab's first turn creates its conversation. */
  readonly conversationId: string | null;
  readonly providerId: ProviderId | null;

  /** Appends text to the composer without sending, as if typed at the end; false when nothing was added. */
  appendText(text: string): boolean;
  /**
   * Submits `content` as the next main turn, or the current composer draft when omitted.
   * Resolves once the submission is admitted, queued, or rejected; it does not await the reply.
   */
  submit(content?: string): Promise<void>;
  /** The user's Stop: cancels the in-flight response or withdraws queued input. */
  stop(): void;

  /** A response is admitted and not yet settled. */
  readonly isStreaming: boolean;
  /** Latest runtime activity; `text` carries the cumulative text of the current block. */
  readonly activity: ChatActivity | null;
  readonly messages: readonly ChatMessage[];
  /** Fires on every recorded activity and whenever `isStreaming` changes. Listeners must stay cheap. */
  subscribe(listener: () => void): () => void;
}

/** Public surface exposed as `app.plugins.plugins.realclaudian.api`. */
export interface ClaudianAPI {
  readonly version: typeof CLAUDIAN_API_VERSION;
  /** The active tab of the chat view that would receive input focus, or null when none is mounted. */
  getActiveChat(): ClaudianChatHandle | null;
}
