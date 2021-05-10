//
// Copyright 2020 DXOS.org
//

import React, { ReactNode, useEffect } from 'react';

import { Client } from '../../../client';
import { ClientContext } from '../hooks/client/context';

export interface ClientProviderProps {
  client: Client
  children?: ReactNode
}

/**
 * Client provider container.
 */
const ClientProvider = ({ client, children }: ClientProviderProps) => {
  useEffect(() => {
    (window as any).__DXOS__ = client.getDevtoolsContext();
  }, []);

  return (
    <ClientContext.Provider value={client}>
      {children}
    </ClientContext.Provider>
  );
};

export default ClientProvider;
