//
// Copyright 2024 DXOS.org
//

import React, { type FC } from 'react';

import { Main } from '@dxos/react-ui';
import {
  baseSurface,
  fixedInsetFlexLayout,
  topbarBlockPaddingStart,
  bottombarBlockPaddingEnd,
} from '@dxos/react-ui-theme';

import SketchComponent, { type SketchComponentProps } from './Sketch';

const SketchMain: FC<SketchComponentProps> = (props) => {
  return (
    <Main.Content classNames={[baseSurface, fixedInsetFlexLayout, topbarBlockPaddingStart, bottombarBlockPaddingEnd]}>
      <SketchComponent {...props} />
    </Main.Content>
  );
};

export default SketchMain;
