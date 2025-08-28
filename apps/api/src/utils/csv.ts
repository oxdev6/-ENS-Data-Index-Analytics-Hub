export function toCsv<T extends Record<string, unknown>>(rows: T[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown): string => {
    if (val == null) return '';
    const str = String(val);
    const needsQuote = /[",\n]/.test(str);
    const escaped = str.replace(/"/g, '""');
    return needsQuote ? `"${escaped}"` : escaped;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape((row as any)[h])).join(','));
  }
  return lines.join('\n');
}

export function* toCsvStream<T extends Record<string, unknown>>(rows: Iterable<T>): Generator<string> {
  let first = true;
  let headers: string[] = [];
  for (const row of rows) {
    if (first) {
      headers = Object.keys(row);
      yield headers.join(',') + '\n';
      first = false;
    }
    const line = headers
      .map((h) => {
        const val = (row as any)[h];
        if (val == null) return '';
        const str = String(val).replace(/"/g, '""');
        return /[",\n]/.test(str) ? `"${str}"` : str;
      })
      .join(',');
    yield line + '\n';
  }
}


