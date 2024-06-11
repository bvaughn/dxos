//
// Copyright 2024 DXOS.org
//

import { type Brand } from 'effect';

import { type EchoReactiveObject } from '@dxos/echo-schema';
import type { GenericSignal } from '@dxos/echo-signals/runtime';
import type { ComplexMap } from '@dxos/util';

import { type EchoArray } from './echo-array';
import { type EchoReactiveHandler } from './echo-handler';
import type { AutomergeObjectCore } from '../automerge';
import type { KeyPath } from '../automerge/key-path';
import { type EchoDatabase } from '../database';

export const symbolPath = Symbol('path');
export const symbolNamespace = Symbol('namespace');
export const symbolHandler = Symbol('handler');
export const symbolInternals = Symbol('internals');

/**
 * For tracking proxy targets in the `targetsMap`.
 */
type TargetKey = {
  path: KeyPath;
  namespace: string;
  type: 'record' | 'array';
} & Brand.Brand<'TargetKey'>;

export const TargetKey = {
  /**
   * Constructor function forces the order of the fields.
   */
  new: (path: KeyPath, namespace: string, type: 'record' | 'array'): TargetKey =>
    ({
      path,
      namespace,
      type,
    }) as TargetKey,
  hash: (key: TargetKey): string => JSON.stringify(key),
};

export type ObjectInternals = {
  core: AutomergeObjectCore;

  /**
   * Caching targets based on key path.
   * Only used for records and arrays.
   */
  targetsMap: ComplexMap<TargetKey, ProxyTarget>;

  signal: GenericSignal;

  /**
   * Until object is persisted in the database, the linked object references are stored in this cache.
   * Set only when the object is not bound to a database.
   */
  linkCache: Map<string, EchoReactiveObject<any>> | undefined;

  /**
   * Database.
   * Is set on object adding to database.
   */
  database: EchoDatabase | undefined;
};

/**
 * Generic proxy target type for ECHO handler.
 * Targets can either be objects or arrays (instances of `EchoArrayTwoPointO`).
 * Every targets holds a set of hidden properties on symbols.
 */
export type ProxyTarget = {
  [symbolInternals]: ObjectInternals;
  /**
   * `data` or `meta` namespace.
   */
  [symbolNamespace]: string;

  /**
   * Path within the namespace.
   *
   * Root objects have an empty path: `[]`.
   */
  [symbolPath]: KeyPath;

  /**
   * Reference to the handler.
   */
  // TODO(dmaretskyi): Can be removed.
  [symbolHandler]?: EchoReactiveHandler;
} & ({ [key: keyof any]: any } | EchoArray<any>);
