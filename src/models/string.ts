function getPadding(lines: String[]) {
  const line = lines[0] === "" ? lines[1] : lines[0];
  return line.match(/^\s*/)![0].length;
}

export function trim(_strings: TemplateStringsArray | String) {
  const strings = Array.isArray(_strings) ? _strings : [_strings];
  const lines = strings.flatMap((s: string) => s.split("\n"));
  const padding = getPadding(lines);

  return lines
    .map((s) => s.substring(padding))
    .join("\n")
    .trim();
}
