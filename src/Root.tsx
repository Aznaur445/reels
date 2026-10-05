import React from 'react';
import {Composition, Still, continueRender, delayRender} from 'remotion';
import {Cover, CoverDark} from './Cover';
import {Reel} from './Reel';
import {ReelDark} from './dark/ReelDark';
import {ReelGlass} from './glass/ReelGlass';
import {SHOWCASE_FRAMES, Showcase} from './Showcase';
import {GALLERY3D_FRAMES, Gallery3D} from './three/Gallery';
import {REALGALLERY_FRAMES, RealGallery} from './three/RealGallery';
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
          component={sb.style === 'glass' ? ReelGlass : sb.style === 'dark' ? ReelDark : Reel}
          durationInFrames={Math.ceil(sb.duration * FPS)}
          fps={FPS}
          width={W}
          height={H}
          defaultProps={{sb}}
        />
        <Still id={`${sb.id}-cover`} component={sb.style === 'dark' || sb.style === 'glass' ? CoverDark : Cover} width={W} height={H} defaultProps={{sb}} />
      </React.Fragment>
    ))}
    <Composition id="realgallery" component={RealGallery} durationInFrames={REALGALLERY_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="gallery3d" component={Gallery3D} durationInFrames={GALLERY3D_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="showcase" component={Showcase} durationInFrames={SHOWCASE_FRAMES} fps={FPS} width={W} height={H} />
  </>
);
