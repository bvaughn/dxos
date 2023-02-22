//
// Copyright 2023 DXOS.org
//

import { Square } from 'phosphor-react';
import React, { FC } from 'react';

import { Space } from '@dxos/client';
import { withReactor } from '@dxos/react-client';
import { Button, Dialog, getSize, Input, mx } from '@dxos/react-components';

import { icons, themes } from '../../hooks';

// TODO(burdon): Move props here, with ids.

export type SpaceSettingsDialog = {
  space: Space;
  open?: boolean;
  onClose?: () => void;
};

export const SpaceSettingsDialog: FC<SpaceSettingsDialog> = withReactor(({ space, open, onClose }) => {
  // TODO(burdon): Translation.
  return (
    <Dialog initiallyOpen={!!open} onClose={() => onClose?.()} title='Space Settings'>
      <div className='px-1'>
        <Input
          label=''
          variant='subdued'
          placeholder='Title'
          slots={{ input: { autoFocus: true, className: 'text-xl' } }}
          value={space.properties.name}
          onChange={(event) => {
            space.properties.name = event.target.value;
          }}
        />
      </div>

      <div className='mb-6'>
        <Themes
          selected={space.properties.theme}
          onSelect={(theme) => {
            space.properties.theme = theme;
          }}
        />
      </div>

      <div className='mb-8'>
        <Icons
          selected={space.properties.icon}
          onSelect={(icon) => {
            space.properties.icon = icon;
          }}
        />
      </div>

      {/* TODO(burdon): Use Dialog.Primitive. */}
      <div>
        <Button variant='primary' onClick={onClose}>
          OK
        </Button>
      </div>
    </Dialog>
  );
});

const Icons: FC<{ selected: string; onSelect: (selected: string) => void }> = ({ selected, onSelect }) => {
  return (
    <div className='flex'>
      <div className='grid grid-cols-4'>
        {icons.map(({ id, Icon }) => (
          <Button key={id} variant='ghost' onClick={() => onSelect(id)}>
            <div className={mx('p-1', selected === id && 'ring-2 ring-black')}>
              <Icon className={getSize(6)} />
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

const Themes: FC<{ selected: string; onSelect: (selected: string) => void }> = ({ selected, onSelect }) => {
  return (
    <div className='flex'>
      <div className='grid grid-cols-4'>
        {themes.map(({ id, classes }) => (
          <Button key={id} variant='ghost' onClick={() => onSelect(id)}>
            <div className={mx('m-1', selected === id && 'ring-2 ring-black')}>
              <Square className={mx(getSize(6), classes.header, 'text-transparent')} />
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};
