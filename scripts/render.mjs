#!/usr/bin/env node
// Рендер ролика и обложки: npm run render -- <id>
// Результат: videos/<id>/out/<id>.mp4, videos/<id>/out/cover.png (+ копия mp4 в out/)
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const id = process.argv[2];
if (!id || !fs.existsSync(path.join('videos', id, 'storyboard.json'))) {
  console.log('Использование: npm run render -- <id>   (папка videos/<id> со storyboard.json)');
  process.exit(1);
}
const outDir = path.join('videos', id, 'out');
fs.mkdirSync(outDir, {recursive: true});
fs.mkdirSync('out', {recursive: true});
const run = (...a) => execFileSync('npx', ['remotion', ...a], {stdio: 'inherit'});
const mp4 = path.join(outDir, `${id}.mp4`);
run('render', 'src/index.ts', id, mp4);
run('still', 'src/index.ts', `${id}-cover`, path.join(outDir, 'cover.png'));
fs.copyFileSync(mp4, path.join('out', `${id}.mp4`));
const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=width,height,codec_name', '-of', 'compact', mp4]).toString();
console.log(`\nГотово: ${mp4}\n${probe}`);
