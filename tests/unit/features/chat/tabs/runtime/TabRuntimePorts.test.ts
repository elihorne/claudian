import { holdResponse } from '@test/helpers/ConversationPorts';

import { ChatState } from '@/features/chat/state/ChatState';
import { createTabChatHandle } from '@/features/chat/tabs/runtime/TabRuntimePorts';
import { TurnCoordinator } from '@/features/chat/turns/TurnCoordinator';

describe('createTabChatHandle', () => {
  function createHarness() {
    const turns = new TurnCoordinator();
    const state = new ChatState({}, undefined, turns);
    const runtime = { id: 'tab-1', conversationId: null as string | null, providerId: 'claude' as const, state };
    const composer = { appendText: jest.fn((text: string) => text.length > 0) };
    const input = { sendMessage: jest.fn().mockResolvedValue(undefined), cancelStreaming: jest.fn() };
    const handle = createTabChatHandle(() => runtime, composer, input);
    return { turns, state, runtime, composer, input, handle };
  }

  it('reads identity through the live runtime', () => {
    const { runtime, handle } = createHarness();

    expect(handle.tabId).toBe('tab-1');
    expect(handle.conversationId).toBeNull();
    runtime.conversationId = 'conv-1';
    expect(handle.conversationId).toBe('conv-1');
    expect(handle.providerId).toBe('claude');
  });

  it('submits explicit content to the main destination without consuming the draft', async () => {
    const { input, handle } = createHarness();

    await handle.submit('read me the summary');

    expect(input.sendMessage).toHaveBeenCalledWith({ destination: 'main', content: 'read me the summary' });
  });

  it('submits the composer draft when no content is given', async () => {
    const { composer, input, handle } = createHarness();

    expect(handle.appendText('dictated text')).toBe(true);
    await handle.submit();

    expect(composer.appendText).toHaveBeenCalledWith('dictated text');
    expect(input.sendMessage).toHaveBeenCalledWith({ destination: 'main' });
  });

  it('routes stop to the user cancellation recipe', () => {
    const { input, handle } = createHarness();

    handle.stop();

    expect(input.cancelStreaming).toHaveBeenCalledTimes(1);
  });

  it('notifies subscribers for recorded text and for streaming changes', async () => {
    const { turns, state, handle } = createHarness();
    const seen: Array<{ streaming: boolean; text: string | null }> = [];
    const unsubscribe = handle.subscribe(() => {
      seen.push({
        streaming: handle.isStreaming,
        text: handle.activity?.kind === 'text' ? handle.activity.text : null,
      });
    });

    const release = holdResponse(turns);
    state.recordActivity({ kind: 'text', text: 'Hello' });
    state.recordActivity({ kind: 'text', text: 'Hello world.' });
    await release();

    const indexOf = (entry: { streaming: boolean; text: string | null }) =>
      seen.findIndex(candidate => candidate.streaming === entry.streaming && candidate.text === entry.text);
    const started = indexOf({ streaming: true, text: null });
    const partial = indexOf({ streaming: true, text: 'Hello' });
    const complete = indexOf({ streaming: true, text: 'Hello world.' });
    expect(started).toBeGreaterThanOrEqual(0);
    expect(partial).toBeGreaterThan(started);
    expect(complete).toBeGreaterThan(partial);
    expect(seen.at(-1)).toEqual({ streaming: false, text: 'Hello world.' });

    const count = seen.length;
    unsubscribe();
    state.recordActivity({ kind: 'text', text: 'ignored' });
    expect(seen).toHaveLength(count);
  });

  it('exposes the transcript as a read-only view of state messages', () => {
    const { state, handle } = createHarness();

    expect(handle.messages).toHaveLength(0);
    state.addMessage({ id: 'm1', role: 'user', content: 'hi', timestamp: 1 });
    expect(handle.messages.map(message => message.content)).toEqual(['hi']);
  });
});
