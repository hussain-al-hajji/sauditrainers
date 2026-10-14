#!/usr/bin/env bash
# ينسخ الملفات المنشورة فقط (public-paths.txt) من المستودع الخاص إلى نسخة المستودع العام، ويزيل منها أي شيء آخر عدا .git.
# الاستعمال:  bash tools/publish/sync.sh <مصدر> <وجهة>
set -euo pipefail
SRC="$(cd "${1:?المصدر}" && pwd)"; DEST="${2:?الوجهة}"
LIST="$SRC/tools/publish/public-paths.txt"
mkdir -p "$DEST"; DEST="$(cd "$DEST" && pwd)"
keep=()
while IFS= read -r p; do
  p="${p%%#*}"; p="$(echo "$p" | xargs)"; [ -z "$p" ] && continue
  keep+=("${p%%/*}")
  if [ -d "$SRC/$p" ]; then rm -rf "$DEST/$p"; mkdir -p "$(dirname "$DEST/$p")"; cp -a "$SRC/$p" "$DEST/$p"
  elif [ -f "$SRC/$p" ]; then mkdir -p "$(dirname "$DEST/$p")"; cp -a "$SRC/$p" "$DEST/$p"
  else echo "تحذير: المسار غير موجود في المصدر: $p" >&2; fi
done < "$LIST"
# إزالة أي مسار علوي في الوجهة ليس في القائمة (حتى لا يبقى فيها ملف داخلي قديم)
shopt -s dotglob nullglob
for f in "$DEST"/*; do
  b="$(basename "$f")"; [ "$b" = ".git" ] && continue
  ok=0; for k in "${keep[@]}"; do [ "$k" = "$b" ] && ok=1; done
  [ $ok -eq 0 ] && { echo "حذف من العام: $b"; rm -rf "$f"; }
done
echo "تمت المزامنة: ${#keep[@]} مسار منشور"
