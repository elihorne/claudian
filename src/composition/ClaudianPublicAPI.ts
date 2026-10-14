import type { WorkspaceLeaf } from 'obsidian';

import { CLAUDIAN_API_VERSION, type ClaudianAPI, type ClaudianChatHandle } from '@/features/chat/api/types';

export interface ClaudianPublicAPIDeps {
  /** The chat view whose composer would receive input focus; same resolution as the focus command. */
  getInputFocusView(zenLeaf: WorkspaceLeaf | null): { getActiveTab(): { chatHandle: ClaudianChatHandle } | null } | null;
  getZenLeaf(): WorkspaceLeaf | null;
}

/** Assembles the surface companion plugins reach through the plugin instance. */
export function createClaudianPublicAPI(deps: ClaudianPublicAPIDeps): ClaudianAPI {
  return {
    version: CLAUDIAN_API_VERSION,
    getActiveChat: () => deps.getInputFocusView(deps.getZenLeaf())?.getActiveTab()?.chatHandle ?? null,
  };
}
