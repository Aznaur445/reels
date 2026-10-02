import React from 'react';
import {Composition, Still, continueRender, delayRender} from 'remotion';
import {Cover, CoverDark} from './Cover';
import {Reel} from './Reel';
import {ReelDark} from './dark/ReelDark';
import {SHOWCASE_FRAMES, Showcase} from './Showcase';
import {fontsReady} from './fonts';
import {FPS, H, W} from './theme';
import type {Storyboard} from './types';

const wait = delayRender('Шрифты');
fontsReady.then(() => continueRender(wait));

// Каждый ролик — папка videos/<id>/ со storyboard.json. Подхватываются автоматически.
const ctx = require.context('../videos', true, /^\.\/[^/]+\/storyboard\.json$/);
const reels: Storyboard[] = ctx.keys().map((k) => ctx(k) as Storyboard);

export const Root: React.FC = () => (
  <>
    {reels.map((sb) => (
      <React.Fragment key={sb.id}>
        <Composition
          id={sb.id}
          component={sb.style === 'dark' ? ReelDark : Reel}
          durationInFrames={Math.ceil(sb.duration * FPS)}
          fps={FPS}
          width={W}
          height={H}
          defaultProps={{sb}}
        />
        <Still id={`${sb.id}-cover`} component={sb.style === 'dark' ? CoverDark : Cover} width={W} height={H} defaultProps={{sb}} />
      </React.Fragment>
    ))}
    <Composition id="showcase" component={Showcase} durationInFrames={SHOWCASE_FRAMES} fps={FPS} width={W} height={H} />
  </>
);
