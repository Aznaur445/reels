#!/usr/bin/env python3
"""Удаление фона с видео: Robust Video Matting (ONNX, CPU).
python3 scripts/matte.py <вход> <выход.webm> [--start S --dur D]
На выходе — VP9 с альфа-каналом (yuva420p): человек без фона, для <OffthreadVideo transparent>.
Модель: rvm_mobilenetv3_fp32.onnx (PeterL1n/RobustVideoMatting, GPL-3.0) — скачивается в scripts/models/."""
import os, subprocess, sys, json, time, urllib.request
import numpy as np, onnxruntime as ort

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(HERE, 'models', 'rvm_mobilenetv3_fp32.onnx')
URL = 'https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3_fp32.onnx'

def main():
    a = sys.argv[1:]
    src, out = a[0], a[1]
    extra = []
    if '--start' in a: extra += ['-ss', a[a.index('--start') + 1]]
    if '--dur' in a: extra += ['-t', a[a.index('--dur') + 1]]
    if not os.path.exists(MODEL):
        urllib.request.urlretrieve(URL, MODEL)
    info = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate', '-of', 'json', src]))['streams'][0]
    w, h = info['width'], info['height']
    fps = info['r_frame_rate']
    so = ort.SessionOptions(); so.intra_op_num_threads = os.cpu_count()
    sess = ort.InferenceSession(MODEL, so, providers=['CPUExecutionProvider'])
    dec = subprocess.Popen(['ffmpeg', '-v', 'error', *extra, '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{w}x{h}', '-r', fps, '-i', '-',
                            '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '24', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4', '-an', out], stdin=subprocess.PIPE)
    rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
    ratio = np.array([min(1.0, 512 / max(w, h))], np.float32)
    n, t0, size = 0, time.time(), w * h * 3
    while True:
        buf = dec.stdout.read(size)
        if len(buf) < size: break
        img = np.frombuffer(buf, np.uint8).reshape(h, w, 3)
        x = (img.astype(np.float32) / 255).transpose(2, 0, 1)[None]
        fgr, pha, *rec = sess.run(None, {'src': x, 'r1i': rec[0], 'r2i': rec[1], 'r3i': rec[2], 'r4i': rec[3], 'downsample_ratio': ratio})
        a_ = pha[0, 0]
        a_ = np.clip((a_ - 0.04) / 0.92, 0, 1)  # убираем полупрозрачный «туман» по краям
        # внутри силуэта — исходные цвета, на краях — очищенный от фона fgr
        col = np.where(a_[..., None] > 0.97, img.astype(np.float32) / 255, fgr[0].transpose(1, 2, 0))
        rgba = np.dstack([np.clip(col * 255, 0, 255), a_ * 255]).astype(np.uint8)
        enc.stdin.write(rgba.tobytes())
        n += 1
        if n % 150 == 0: print(f'  {n} кадров, {n / (time.time() - t0):.1f} к/с', flush=True)
    enc.stdin.close(); enc.wait(); dec.wait()
    print(f'готово: {n} кадров за {time.time() - t0:.0f} с → {out}')

if __name__ == '__main__':
    main()
