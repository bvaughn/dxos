//
// Copyright 2024 DXOS.org
//

import { type GridSelection, type LexicalNode, type NodeSelection, type RangeSelection } from 'lexical';

export type Callback<Item> = (query: string, items: Item[], selectedIndex: number) => void;

export type ContextShape<Item> = {
  dismiss: () => void;
  selectItem: (item: Item) => void;
  selectNext: () => void;
  selectPrevious: () => void;
  subscribe: (callback: Callback<Item>) => () => void;
  update: (_: string, __: Item[]) => void;
};

export type HookShape<Item> = {
  dismiss: () => void;
  query: string;
  selectedIndex: number;
  selectedItem: Item | null;
  items: Item[];
  selectItem: (item: Item) => void;
  selectNext: () => void;
  selectPrevious: () => void;
  stateRef: {
    current: HookState<Item>;
  };
  update: (_: string, __: Item[]) => void;
};

export type HookState<Item> = {
  query: string;
  selectedIndex: number;
  items: Item[];
};
export type TextRange = {
  beginOffset: number;
  beginTextNode: LexicalNode;
  endOffset: number;
  endTextNode: LexicalNode;
};

export type QueryData = {
  query: string;
  textRange: TextRange;
};

export type TypeAheadSelection = RangeSelection | NodeSelection | GridSelection;
