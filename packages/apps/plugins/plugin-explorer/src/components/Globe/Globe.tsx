//
// Copyright 2023 DXOS.org
//

import type { DotOptions } from '@observablehq/plot';
import * as Plot from '@observablehq/plot';
import React, { useEffect } from 'react';
import { useResizeDetector } from 'react-resize-detector';
import * as topojson from 'topojson-client';

// @ts-ignore
import world from '../../../public/countries-110m.json?json';

const defaultOptions: DotOptions = {
  r: 4,
  fill: '#003300',
};

// TODO(burdon): Factor out definition.
export type GeoLocation = { lat: number; lng: number };

export type GlobeProps = {
  items?: any[];
  accessor?: (object: any) => GeoLocation;
  options?: DotOptions;
};

export const Globe = ({ items = [], accessor, options = defaultOptions }: GlobeProps) => {
  const { ref: containerRef, width = 0, height = 0 } = useResizeDetector({ refreshRate: 200 });
  const land = topojson.feature(world, world.objects.land);

  useEffect(() => {
    if (!width || !height) {
      return;
    }

    // https://observablehq.com/plot/marks/geo
    // https://observablehq.com/@observablehq/plot-earthquake-globe?intent=fork
    const plot = Plot.plot({
      // https://observablehq.com/plot/features/projections
      projection: { type: 'orthographic', rotate: [30, -20] },
      // projection: { type: 'equirectangular', rotate: [-140, -30] },
      width,
      height,
      style: {
        background: 'transparent',
      },
      // TODO(burdon): Create simple wrapper for Plot with good defaults.
      marks: [
        Plot.sphere({ fill: 'lightblue', fillOpacity: 0.5 }),
        Plot.geo(land, { fill: 'darkgreen', fillOpacity: 0.5 }),
        Plot.graticule(),
        Plot.dot(items, {
          x: accessor
            ? {
                transform: (values) => values.map((value) => accessor(value).lat),
              }
            : 'lat',
          y: accessor
            ? {
                transform: (values) => values.map((value) => accessor(value).lng),
              }
            : 'lng',
          ...options,
        }),
      ],
    });

    containerRef.current!.append(plot);
    return () => plot?.remove();
  }, [items, width, height]);

  return <div ref={containerRef} className='grow p-4' />;
};
