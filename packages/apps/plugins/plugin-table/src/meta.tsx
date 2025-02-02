//
// Copyright 2023 DXOS.org
//

import { Table, type IconProps } from '@phosphor-icons/react';
import React from 'react';

import { pluginMeta } from '@dxos/app-framework';

export const TABLE_PLUGIN = 'dxos.org/plugin/table';

export default pluginMeta({
  id: TABLE_PLUGIN,
  name: 'Tables',
  description: 'Create and manage tables.',
  tags: ['experimental'],
  iconComponent: (props: IconProps) => <Table {...props} />,
  iconSymbol: 'ph--table--regular',
});
