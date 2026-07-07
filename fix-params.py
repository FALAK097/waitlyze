"""Fix: `= {ref, ...} =>` → `= ({ref, ...}) =>`"""
import re, os

UI_DIR = "src/components/ui"

for fname in sorted(os.listdir(UI_DIR)):
    fpath = os.path.join(UI_DIR, fname)
    if not (os.path.isfile(fpath) and fname.endswith('.jsx')):
        continue
    with open(fpath) as f:
        content = f.read()
    
    # Single-line: const X = { ref, ... } => BODY
    content = re.sub(
        r'(const\s+\w+\s*=\s*)\{([^}]+)\}\s*=>',
        r'\1({ \2}) =>',
        content
    )
    
    # Multi-line: handle in chart.jsx
    # const ChartTooltipContent = { ref, active, ...\n}) => {
    # Find = { patterns that span multiple lines with =>
    if 'ChartTooltipContent' in fname or True:
        # Multi-line destructuring: = { line \n line \n } =>
        lines = content.split('\n')
        result = []
        i = 0
        while i < len(lines):
            line = lines[i]
            m = re.match(r'(const\s+\w+\s*=\s*)\{', line)
            if m and '=>' not in line and ')' not in line:
                # Start of multi-line destructuring
                prefix = m.group(1)
                # Find the closing } => 
                merged = [prefix + '(']
                # Rest of current line after { 
                merged.append('  ' + line[m.end():])
                i += 1
                while i < len(lines):
                    if '=>' in lines[i]:
                        # Close the destructuring
                        merged.append(lines[i].replace('} =>', '}) =>'))
                        break
                    merged.append(lines[i])
                    i += 1
                result.extend(merged)
                i += 1
                continue
            result.append(line)
            i += 1
        content = '\n'.join(result)
    
    with open(fpath, 'w') as f:
        f.write(content)

print(f"Fixed files in {UI_DIR}")
