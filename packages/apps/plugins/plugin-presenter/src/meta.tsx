//
// Copyright 2023 DXOS.org
//

import { Presentation, type IconProps } from '@phosphor-icons/react';
import React from 'react';

import { pluginMeta } from '@dxos/app-framework';

export const PRESENTER_PLUGIN = 'dxos.org/plugin/presenter';

export default pluginMeta({
  id: PRESENTER_PLUGIN,
  name: 'Presenter',
  description: 'Present stacks as slideshows.',
  iconComponent: (props: IconProps) => <Presentation {...props} />,
  iconSymbol: 'ph--presentation--regular',
});
