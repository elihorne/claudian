import type { WorkspaceLeaf } from 'obsidian';

import { createClaudianPublicAPI } from '@/composition/ClaudianPublicAPI';
import { CLAUDIAN_API_VERSION, type ClaudianChatHandle } from '@/features/chat/api/types';

describe('createClaudianPublicAPI', () => {
  const zenLeaf = { id: 'zen' } as unknown as WorkspaceLeaf;

  it('resolves the active chat through the input-focus view for the zen leaf', () => {
    const chatHandle = { tabId: 'tab-1' } as ClaudianChatHandle;
    const getInputFocusView = jest.fn().mockReturnValue({ getActiveTab: () => ({ chatHandle }) });

    const api = createClaudianPublicAPI({ getInputFocusView, getZenLeaf: () => zenLeaf });

    expect(api.version).toBe(CLAUDIAN_API_VERSION);
    expect(api.getActiveChat()).toBe(chatHandle);
    expect(getInputFocusView).toHaveBeenCalledWith(zenLeaf);
  });

  it('returns null when no chat view is mounted or the view has no active tab', () => {
    const noView = createClaudianPublicAPI({ getInputFocusView: () => null, getZenLeaf: () => null });
    const noTab = createClaudianPublicAPI({
      getInputFocusView: () => ({ getActiveTab: () => null }),
      getZenLeaf: () => null,
    });

    expect(noView.getActiveChat()).toBeNull();
    expect(noTab.getActiveChat()).toBeNull();
  });
});
