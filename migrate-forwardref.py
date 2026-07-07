"""Migrate React.forwardRef((params, ref) => BODY) to ({ ref, params }) => BODY for React 19."""
import re, os

UI_DIR = "src/components/ui"

def find_matching_paren(text, start):
    depth = 1
    for i in range(start + 1, len(text)):
        if text[i] == '(':
            depth += 1
        elif text[i] == ')':
            depth -= 1
            if depth == 0:
                return i
    return -1

def process_file(filepath):
    with open(filepath) as f:
        content = f.read()
    if 'React.forwardRef' not in content:
        return False

    parts = []
    remaining = content
    while 'React.forwardRef' in remaining:
        idx = remaining.index('React.forwardRef')
        parts.append(remaining[:idx])
        rest = remaining[idx:]

        paren = rest.index('(')
        close = find_matching_paren(rest, paren)
        if close == -1:
            parts.append(rest)
            break

        inner = rest[paren + 1:close].strip()
        remaining = rest[close + 1:]

        # Strip trailing comma from inner (it's part of forwardRef syntax, not the function)
        if inner.endswith(','):
            inner = inner[:-1].rstrip()

        # Parse: ({ ARGS }, ref) => BODY
        m = re.match(r'\(\s*\{([^}]*)\}\s*,\s*ref\s*,?\s*\)\s*=>\s*', inner, re.DOTALL)
        if not m:
            parts.append(f'React.forwardRef({inner})')
            continue

        args = m.group(1).strip()
        body_start = m.end()
        body = inner[body_start:]

        new_sig = f"{{ ref, {args} }}" if args else "{ ref }"
        parts.append(f"({new_sig}) => {body}")

    parts.append(remaining)
    result = ''.join(parts)

    if result != content:
        with open(filepath, 'w') as f:
            f.write(result)
        return True
    return False

changed = []
for fname in sorted(os.listdir(UI_DIR)):
    fpath = os.path.join(UI_DIR, fname)
    if os.path.isfile(fpath) and fname.endswith('.jsx'):
        if process_file(fpath):
            changed.append(fname)
print(f"Transformed {len(changed)} files.")
