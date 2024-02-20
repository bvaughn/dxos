//
// Copyright 2023 DXOS.org
//

import { X } from '@phosphor-icons/react';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { Message as MessageType } from '@braneframe/types';
import { TextObject, getTextContent, useMembers } from '@dxos/react-client/echo';
import { useIdentity } from '@dxos/react-client/halo';
import { Button, Tooltip, useTranslation } from '@dxos/react-ui';
import { useTextModel } from '@dxos/react-ui-editor';
import { hoverableControlItem, hoverableControls, hoverableFocusedWithinControls, mx } from '@dxos/react-ui-theme';
import { MessageTextbox, type MessageTextboxProps, Thread, ThreadFooter, ThreadHeading } from '@dxos/react-ui-thread';

import { MessageContainer } from './MessageContainer';
import { command } from './command-extension';
import { type ThreadContainerProps } from './types';
import { useStatus, useMessageMetadata } from '../hooks';
import { THREAD_PLUGIN } from '../meta';

export const CommentContainer = ({
  space,
  thread,
  detached,
  context,
  current,
  autoFocus,
  onAttend,
  onDelete,
}: ThreadContainerProps) => {
  const identity = useIdentity()!;
  const members = useMembers(space.key);
  const activity = useStatus(space, thread.id);
  const { t } = useTranslation(THREAD_PLUGIN);
  const extensions = useMemo(() => [command], []);
  const threadScrollRef = useRef<HTMLDivElement | null>(null);

  const [nextMessage, setNextMessage] = useState({ text: new TextObject() });
  const nextMessageModel = useTextModel({ text: nextMessage.text, identity, space });
  const autoFocusRef = useRef<boolean>(false);
  autoFocusRef.current = !!autoFocus;

  // TODO(thure): Factor out.
  const scrollToEnd = (behavior: ScrollBehavior) =>
    setTimeout(() => threadScrollRef.current?.scrollIntoView({ behavior, block: 'end' }), 10);

  const handleCreate: MessageTextboxProps['onSend'] = useCallback(() => {
    const content = nextMessage.text;
    if (!getTextContent(content)) {
      return false;
    }

    const block = {
      timestamp: new Date().toISOString(),
      content,
    };

    thread.messages.push(
      new MessageType({
        from: { identityKey: identity.identityKey.toHex() },
        context,
        blocks: [block],
      }),
    );

    setNextMessage(() => {
      autoFocusRef.current = true;
      return { text: new TextObject() };
    });

    scrollToEnd('instant');

    // TODO(burdon): Scroll to bottom.
    return true;
  }, [nextMessage, thread, identity]);

  const handleDelete = (id: string, index: number) => {
    const messageIndex = thread.messages.findIndex((message) => message.id === id);
    if (messageIndex !== -1) {
      const message = thread.messages[messageIndex];
      message.blocks.splice(index, 1);
      if (message.blocks.length === 0) {
        thread.messages.splice(messageIndex, 1);
      }
      if (thread.messages.length === 0) {
        onDelete?.();
      }
    }
  };

  const textboxMetadata = useMessageMetadata(thread.id, identity);

  return (
    <Thread onClickCapture={onAttend} onFocusCapture={onAttend} current={current} id={thread.id}>
      <div
        role='none'
        className={mx(
          'col-span-2 grid grid-cols-[var(--rail-size)_1fr_min-content]',
          hoverableControls,
          hoverableFocusedWithinControls,
        )}
      >
        {detached ? (
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <ThreadHeading detached>{thread.title ?? t('thread title placeholder')}</ThreadHeading>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content classNames='z-[11]' side='top'>
                {t('detached thread label')}
                <Tooltip.Arrow />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ) : (
          <ThreadHeading>{thread.title ?? t('thread title placeholder')}</ThreadHeading>
        )}
        {onDelete && (
          <Button
            variant='ghost'
            data-testid='thread.delete'
            onClick={onDelete}
            classNames={['min-bs-0 p-1 mie-1', hoverableControlItem]}
          >
            <X />
          </Button>
        )}
      </div>
      {thread.messages.map((message) => (
        <MessageContainer key={message.id} message={message} members={members} onDelete={handleDelete} />
      ))}
      {nextMessageModel && (
        <>
          <MessageTextbox
            onSend={handleCreate}
            autoFocusRef={autoFocusRef}
            placeholder={t('message placeholder')}
            {...textboxMetadata}
            model={nextMessageModel}
            extensions={extensions}
          />
          <ThreadFooter activity={activity}>{t('activity message')}</ThreadFooter>
          {/* NOTE(thure): This can’t also be the `overflow-anchor` because `ScrollArea` injects an interceding node that contains this necessary ref’d element. */}
          <div role='none' className='bs-px -mbs-px' ref={threadScrollRef} />
        </>
      )}
    </Thread>
  );
};
