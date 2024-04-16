// TODO(burdon): Factor out to spaces.
//
// Copyright 2023 DXOS.org
//

import { type Space } from '@dxos/client-protocol';
import { getDatabaseFromObject, type OpaqueEchoObject } from '@dxos/echo-schema';

import { SpaceProxy } from './space-proxy';

export const getSpace = (object: OpaqueEchoObject): Space | undefined => {
  const db = getDatabaseFromObject(object);
  const key = db?.spaceKey;
  if (key) {
    const owner = db.graph._getOwningObject(key);
    if (owner instanceof SpaceProxy) {
      return owner;
    }
  }

  return undefined;
};

export const isSpace = (object: unknown): object is Space => object instanceof SpaceProxy;
