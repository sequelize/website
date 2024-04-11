function getPadding(lines: string[]) {
  const line = lines[0] === '' ? lines[1] : lines[0];

  return line.match(/^\s*/)![0].length;
}

export function trim(_strings: TemplateStringsArray | string) {
  const strings: string[] = (Array.isArray(_strings) ? _strings : [_strings]) as string[];
  const lines = strings.flatMap(s => s.split('\n'));
  const padding = getPadding(lines);

  return lines
    .map(s => s.slice(Math.max(0, padding)))
    .join('\n')
    .trim();
}
