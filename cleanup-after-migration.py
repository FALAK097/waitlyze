"""Clean up orphaned commas/parens left after forwardRef removal."""
import re, os

UI_DIR = "src/components/ui"

for fname in sorted(os.listdir(UI_DIR)):
    fpath = os.path.join(UI_DIR, fname)
    if not (os.path.isfile(fpath) and fname.endswith('.jsx')):
        continue
    with open(fpath) as f:
        content = f.read()

    changes = False

    # Fix 1: `}),` at end of line before component displayName → `}`
    # Pattern: end of arrow function body followed by orphaned comma
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        # Remove trailing `),` or `),` that's from forwardRef closure
        stripped = line.rstrip()
        if stripped.endswith('),') and not stripped.startswith('import'):
            line = stripped[:-1].rstrip() + '\n'
            changes = True
        # Remove orphaned `),;`
        if stripped.endswith('),;'):
            line = stripped[:-3].rstrip() + '\n'
            changes = True
        # Remove trailing `,` on component-definition-closing lines (not JSX lines)
        if stripped.endswith('),') and '=>' not in stripped:
            # Check if this is part of a forwardRef close (orphaned )
            line = stripped[:-1].rstrip() + '\n'
            changes = True
        new_lines.append(line.rstrip())
    content = '\n'.join(new_lines) + '\n'

    # Fix 2: Remove orphaned `)` on its own line right before displayName
    content = re.sub(r'\)\s*\n(\s*displayName)', r'\1', content)
    # Fix 3: Remove orphaned `,` on its own line
    content = re.sub(r',\s*\n(\s*displayName)', r'\1', content)
    # Fix 4: Remove orphaned `);` pairs
    content = re.sub(r'\);\s*(\n\s*displayName)', r'\1', content)
    # Fix 5: Remove `,` before `;`  
    content = re.sub(r',\s*;', ';', content)
    # Fix 6: Remove trailing `)` after function body ending with `)` 
    # e.g., `  ),` where `)` is from implicit return
    content = re.sub(r'(\s*\))\s*,\s*(\n\s*(?:displayName|export))', r'\1\2', content)

    if changes or content != open(fpath).read():
        # Re-read to compare
        with open(fpath) as f:
            old = f.read()
        if content != old:
            with open(fpath, 'w') as f:
                f.write(content)
            print(f"  Cleaned: {fname}")
