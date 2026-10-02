import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

const weights = ['500', '600', '700', '800'] as const;

const uni = (subset: 'cyrillic' | 'latin') =>
  subset === 'cyrillic'
    ? 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116'
    : 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+20BD, U+2122, U+2190-2199, U+2212, U+2215';

const montserrat = (['700', '800', '900'] as const).flatMap((weight) =>
  (['cyrillic', 'latin'] as const).map((subset) =>
    loadFont({family: 'Montserrat', url: staticFile(`fonts/montserrat-${subset}-${weight}-normal.woff2`), weight, unicodeRange: uni(subset)}),
  ),
);

export const fontsReady = Promise.all([
  ...montserrat,
  ...weights.flatMap((weight) =>
    (['cyrillic', 'latin'] as const).map((subset) =>
      loadFont({
        family: 'Manrope',
        url: staticFile(`fonts/manrope-${subset}-${weight}-normal.woff2`),
        weight,
        unicodeRange:
          subset === 'cyrillic'
            ? 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116'
            : 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+20BD, U+2122, U+2190-2199, U+2212, U+2215',
      }),
    ),
  ),
]);
