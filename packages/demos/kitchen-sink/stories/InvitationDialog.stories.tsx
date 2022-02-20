//
// Copyright 2022 DXOS.org
//

import faker from 'faker';
import React from 'react';

import { ClientProvider, ProfileInitializer } from '@dxos/react-client';
import { FullScreen } from '@dxos/react-components';

import { InvitationDialog } from '../src';

export default {
  title: 'KitchenSink/InvitationDialog'
};

faker.seed(100);

const App = () => {
  return (
    <FullScreen>
      <InvitationDialog
        open
        title='Kitchen Sink'
        onCreate={() => {}}
        onJoin={(invitationCode: string) => {}}
      />
    </FullScreen>
  );
};

export const Primary = () => {
  return (
    <ClientProvider>
      <ProfileInitializer>
        <App />
      </ProfileInitializer>
    </ClientProvider>
  );
};
