"""Build web derivatives from Git originals; never overwrite archival media.

Run with a Python containing Pillow/WebP. FFmpeg is used only for the five muted
ambient loops. Existing, source-matched assets/optimized images are reused.
"""
import hashlib
import io
import json
import re
import subprocess
from pathlib import Path
from PIL import Image, ImageOps

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
DEST = HERE / 'assets/mobile'
DEST.mkdir(parents=True, exist_ok=True)

def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])

files = git('ls-tree', '-r', '--name-only', 'HEAD').decode().splitlines()
pages = [git('show', 'HEAD:' + name).decode() for name in ['index.html', 'story.html', 'press.html']]
images = set()
for html in pages:
    for tag in re.findall(r'<(?:img|video)\b[^>]*>', html):
        retained = re.findall(r'\sdata-(?:media|poster)-source="(assets/[^"?]+)"', tag)
        for path in retained or re.findall(r'\s(?:src|poster)="(assets/[^"?]+)"', tag):
            if path.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                images.add(path)

small_art = {
    'cast-many-eyed-santa': [240, 360, 480], 'cast-stick-bike': [160, 240, 320],
    'cast-watercolor-rider': [160, 240, 320], 'cast-dinosaur-santa': [240, 360, 640],
    'cast-crayon-wave': [240, 360, 640], 'cast-longhair-santa': [320, 480, 800],
}
manifest = {'images': {}, 'videos': {}}
for source in sorted(images):
    raw = git('show', 'HEAD:' + source)
    original = ImageOps.exif_transpose(Image.open(io.BytesIO(raw)))
    width, height = original.size
    stem = Path(source).stem
    candidates = [p for p in files if re.fullmatch('assets/optimized/' + re.escape(stem) + r'-\d+\.webp', p)]
    variants = []
    for candidate in candidates:
        encoded = git('show', 'HEAD:' + candidate)
        with Image.open(io.BytesIO(encoded)) as existing:
            w, h = existing.size
        if len(encoded) < len(raw) and w <= width and abs(w / h - width / height) < .015:
            variants.append({'src': candidate, 'width': w, 'bytes': len(encoded)})
    if not variants:
        widths = small_art.get(stem, [320, 640, 960] if '/monster/' in source else [480, 960, 1440])
        if stem == 'hero-monster-user':
            widths = [480, 800, 1122]
        if stem == 'chocolate-clean':
            widths = [480, 800, 1200]
        if 'poster' in stem:
            widths = [min(640, width)]
        widths = sorted(set(min(w, width) for w in widths))
        digest = hashlib.sha256(raw).hexdigest()[:8]
        name = str(Path(source).with_suffix('')).removeprefix('assets/').replace('/', '-')
        for w in widths:
            resized = original.copy()
            resized.thumbnail((w, round(height * w / width)), Image.Resampling.LANCZOS)
            if resized.mode not in ('RGB', 'RGBA'):
                resized = resized.convert('RGBA' if 'transparency' in resized.info else 'RGB')
            target = DEST / (name + '-' + str(resized.width) + '-' + digest + '.webp')
            if not target.exists():
                resized.save(target, 'WEBP', quality=82 if '/monster/' in source else 80, method=6)
            variants.append({'src': 'assets/mobile/' + target.name, 'width': resized.width, 'bytes': target.stat().st_size})
    manifest['images'][source] = {'width': width, 'height': height, 'originalBytes': len(raw), 'variants': sorted(variants, key=lambda v: v['width'])}

content = json.loads((HERE / 'event-data.json').read_text())
for media in content['media'].values():
    source = media['src'].removeprefix('../../')
    digest = git('rev-parse', 'HEAD:' + source).decode().strip()[:8]
    # Feed an exact Git original into a scratch input, not a user-owned file.
    scratch = DEST / (Path(source).stem + '.input.mp4')
    scratch.write_bytes(git('show', 'HEAD:' + source))
    info = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size', '-of', 'json', str(scratch)]))['format']
    outputs = {}
    for label, bound, quality in [('mobile', 960, 27), ('desktop', 1280, 26)]:
        profile = ''
        if source == 'assets/rampage-loop.mp4' and label == 'mobile':
            bound, quality, profile = 720, 29, '-720-q29'
        name = Path(source).stem + '-' + label + profile + '-' + digest + '.mp4'
        target = DEST / name
        if not target.exists():
            subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-n', '-i', str(scratch),
                            '-vf', "scale=w='min(iw," + str(bound) + ")':h='min(ih," + str(bound) + ")':force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1,fps=24",
                            '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', str(quality), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(target)], check=True)
        outputs[label] = {'src': 'assets/mobile/' + name, 'bytes': target.stat().st_size}
    manifest['videos'][source] = {'duration': float(info['duration']), 'originalBytes': int(info['size']), **outputs}
    scratch.unlink()  # This exact task-created scratch input only.

(HERE / 'media-performance.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'images': len(manifest['images']), 'loops': len(manifest['videos']), 'newFiles': len(list(DEST.iterdir()))}))
