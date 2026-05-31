#!/usr/bin/env python3
"""
Splits the giant translations object in useLanguage.ts into category files.
Uses brace-depth counting to handle nested {{ }} template params correctly.
Run from: /home/nikhil/Documents/Remo2/Removation_3
"""
import re, os

SRC = "hooks/useLanguage.ts"
OUT_DIR = "hooks/i18n"

PREFIX_MAP = [
    ("nav_",      "nav"),
    ("auth_",     "auth"),
    ("dash_",     "dashboard"),
    ("dir_",      "marketplace"),
    ("book_",     "booking"),
    ("myb_",      "booking"),
    ("desb_",     "booking"),
    ("rev_",      "booking"),
    ("rc_",       "ai_tools"),
    ("ai_tool",   "ai_tools"),
    ("vastu_",    "vastu"),
    ("cost_",     "cost"),
    ("chat_",     "common"),
    ("alert_",    "common"),
    ("style_",    "common"),
    ("room_",     "common"),
    ("val_",      "common"),
    ("price_",    "common"),
    ("misc_",     "common"),
]
DEFAULT_CATEGORY = "common"

def categorize(key: str) -> str:
    for prefix, cat in PREFIX_MAP:
        if key.startswith(prefix):
            return cat
    return DEFAULT_CATEGORY

# ── Read raw source ───────────────────────────────────────────────────────────
with open(SRC, encoding="utf-8") as f:
    src = f.read()

# Find start of translations object
m = re.search(r"const translations[^=]*=\s*\{", src)
if not m:
    raise ValueError("Cannot find translations object")
obj_start = m.end() - 1  # opening {

# Scan to find the matching closing } using depth counter,
# but only count single braces (ignore {{ }})
depth = 0
i = obj_start
length = len(src)
while i < length:
    ch = src[i]
    # skip {{ and }} (template placeholders)
    if src[i:i+2] == '{{' or src[i:i+2] == '}}':
        i += 2
        continue
    if ch == '{':
        depth += 1
    elif ch == '}':
        depth -= 1
        if depth == 0:
            obj_end = i + 1
            break
    i += 1

trans_block = src[obj_start:obj_end]

# ── Extract individual entries using a smarter approach ───────────────────────
# Strategy: scan for pattern  'key': {  and then use depth counting for the value
entries: list[tuple[str, str]] = []  # (key, raw_value_ts)

pos = 0
tb = trans_block

key_pattern = re.compile(r"'([^']+)'\s*:\s*")

while pos < len(tb):
    km = key_pattern.search(tb, pos)
    if not km:
        break
    key = km.group(1)
    after_colon = km.end()

    # Find the opening brace of the value object
    brace_idx = tb.index('{', after_colon)
    
    # Depth-count the value object, respecting {{ }}
    vdepth = 0
    vi = brace_idx
    while vi < len(tb):
        ch = tb[vi]
        if tb[vi:vi+2] == '{{' or tb[vi:vi+2] == '}}':
            vi += 2
            continue
        if ch == '{':
            vdepth += 1
        elif ch == '}':
            vdepth -= 1
            if vdepth == 0:
                val_end = vi + 1
                break
        vi += 1

    raw_val = tb[brace_idx:val_end]  # e.g. { en: '...', hi: '...' }
    entries.append((key, raw_val))
    pos = val_end

print(f"Extracted {len(entries)} translation keys")

# ── Bucket by category ────────────────────────────────────────────────────────
entries_by_cat: dict[str, list[str]] = {}
for key, raw_val in entries:
    cat = categorize(key)
    entries_by_cat.setdefault(cat, [])
    entries_by_cat[cat].append(f"  '{key}': {raw_val},")

# ── Write category files ──────────────────────────────────────────────────────
os.makedirs(OUT_DIR, exist_ok=True)
cat_names = sorted(entries_by_cat.keys())

for cat in cat_names:
    lines = entries_by_cat[cat]
    var_name = f"{cat}Translations"
    content = "// AUTO-GENERATED — do not edit manually.\n"
    content += f"// Source: hooks/useLanguage.ts  →  hooks/i18n/{cat}.ts\n"
    content += "import type { Language } from '../useLanguage';\n\n"
    content += f"export const {var_name}: Record<string, Record<Language, string>> = {{\n"
    content += "\n".join(lines) + "\n"
    content += "};\n"
    path = os.path.join(OUT_DIR, f"{cat}.ts")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  {path}  ({len(lines)} keys)")

# ── Write index.ts ────────────────────────────────────────────────────────────
imports = "\n".join(
    f"import {{ {cat}Translations }} from './{cat}';"
    for cat in cat_names
)
spreads = "\n  ".join(
    f"...{cat}Translations,"
    for cat in cat_names
)
index_content = "// AUTO-GENERATED — merges all translation category files.\n"
index_content += imports + "\n\n"
index_content += "export const allTranslations: Record<string, Record<string, string>> = {\n"
index_content += f"  {spreads}\n"
index_content += "};\n"

with open(os.path.join(OUT_DIR, "index.ts"), "w", encoding="utf-8") as f:
    f.write(index_content)
print(f"  hooks/i18n/index.ts  ({len(cat_names)} categories)")
print("Done.")
