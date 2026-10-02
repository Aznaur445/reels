import fs from 'node:fs';
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setAudioCodec('aac');
Config.setAudioBitrate('192k');
Config.setOverwriteOutput(true);
Config.setConcurrency(4);

// В облачной сессии Chromium уже установлен — используем его, чтобы Remotion не качал свой.
const preinstalled = [
  process.env.REMOTION_BROWSER,
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
].find((p) => p && fs.existsSync(p));
if (preinstalled) Config.setBrowserExecutable(preinstalled);
