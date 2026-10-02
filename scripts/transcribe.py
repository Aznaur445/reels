"""Расшифровка речи с таймингом каждого слова.
1) локально: faster-whisper (large-v3 / medium), язык ru;
2) запасной вариант: OpenAI API (whisper-1), если в .env есть OPENAI_API_KEY.
Запуск: python3 scripts/transcribe.py <audio.wav> <out.json> [--model large-v3] [--api]
Код выхода 3 — ни один способ недоступен (тогда расшифровку делает GitHub Actions).
"""
import json, os, sys, time, uuid, urllib.request

PROMPT = ('Стройконтроль, ГИП, ГИПы, АР, КР, ОВиК, ВК, ЭОМ, циклограмма, субподрядчик, субподрядчики, '
          'этап, график, Telegram, Excel. Э-э, ну, как бы, вот.')

def load_env():
    if os.path.exists('.env'):
        for line in open('.env', encoding='utf-8'):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

def local(path, model_name):
    from faster_whisper import WhisperModel
    model = WhisperModel(model_name, device='cpu', compute_type='int8')
    segments, info = model.transcribe(path, language='ru', word_timestamps=True, initial_prompt=PROMPT,
                                      beam_size=5, vad_filter=False, condition_on_previous_text=False)
    words = []
    for seg in segments:
        for w in seg.words or []:
            words.append({'text': w.word.strip(), 'start': round(w.start, 3), 'end': round(w.end, 3),
                          'prob': round(w.probability, 3)})
    return {'engine': f'faster-whisper {model_name}', 'language': info.language, 'duration': info.duration, 'words': words}

def api(path):
    key = os.environ.get('OPENAI_API_KEY')
    if not key:
        raise RuntimeError('нет OPENAI_API_KEY в .env')
    boundary = uuid.uuid4().hex
    fields = [('model', 'whisper-1'), ('language', 'ru'), ('response_format', 'verbose_json'),
              ('timestamp_granularities[]', 'word'), ('timestamp_granularities[]', 'segment'), ('prompt', PROMPT)]
    body = b''
    for k, v in fields:
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    body += (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{os.path.basename(path)}"\r\n'
             'Content-Type: application/octet-stream\r\n\r\n').encode() + open(path, 'rb').read() + f'\r\n--{boundary}--\r\n'.encode()
    req = urllib.request.Request('https://api.openai.com/v1/audio/transcriptions', data=body,
                                 headers={'Authorization': f'Bearer {key}', 'Content-Type': f'multipart/form-data; boundary={boundary}'})
    data = json.load(urllib.request.urlopen(req, timeout=600))
    words = [{'text': w['word'].strip(), 'start': round(w['start'], 3), 'end': round(w['end'], 3), 'prob': 1.0} for w in data.get('words', [])]
    # API отдаёт слова без пунктуации — возьмём её из текста сегментов
    text_tokens = ' '.join(s['text'] for s in data.get('segments', [])).split()
    norm = lambda s: ''.join(ch for ch in s.lower() if ch.isalnum())
    j = 0
    for w in words:
        while j < len(text_tokens) and norm(text_tokens[j]) != norm(w['text']):
            j += 1
        if j < len(text_tokens):
            w['text'] = text_tokens[j]
            j += 1
    return {'engine': 'openai whisper-1', 'language': 'ru', 'duration': data.get('duration'), 'words': words}

def main():
    load_env()
    args = sys.argv[1:]
    path, out = args[0], args[1]
    model = os.environ.get('WHISPER_MODEL', 'large-v3')
    if '--model' in args:
        model = args[args.index('--model') + 1]
    errors = []
    t0 = time.time()
    attempts = [('api', lambda: api(path))] if '--api' in args else [('local', lambda: local(path, model)), ('api', lambda: api(path))]
    for name, fn in attempts:
        try:
            res = fn()
            res['seconds'] = round(time.time() - t0, 1)
            json.dump(res, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
            print(f'Расшифровка готова ({res["engine"]}, {len(res["words"])} слов): {out}')
            return
        except Exception as e:  # noqa: BLE001
            errors.append(f'{name}: {str(e).splitlines()[0][:200]}')
    print('Расшифровка не получилась:\n  ' + '\n  '.join(errors), file=sys.stderr)
    sys.exit(3)

if __name__ == '__main__':
    main()
