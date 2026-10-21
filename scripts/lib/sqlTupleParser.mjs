/**
 * Pure SQL Tuple Parser
 * Splits a SQL tuple string into field values, unescaping quotes and newlines.
 */

export function parseSqlTuple(tupleStr) {
  const fields = [];
  let current = '';
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < tupleStr.length; i++) {
    const char = tupleStr[i];

    if (isEscaped) {
      if (char === 'n') current += '\n';
      else if (char === 'r') current += '\r';
      else if (char === 't') current += '\t';
      else if (char === '\\') current += '\\';
      else if (char === "'") current += "'";
      else if (char === '"') current += '"';
      else current += char;
      isEscaped = false;
      continue;
    }

    if (char === '\\') {
      isEscaped = true;
      continue;
    }

    if (char === "'") {
      inString = !inString;
      continue;
    }

    if (char === ',' && !inString) {
      const trimmed = current.trim();
      if (trimmed === 'NULL') {
        fields.push(null);
      } else {
        fields.push(trimmed);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const trimmed = current.trim();
  if (trimmed === 'NULL') fields.push(null);
  else fields.push(trimmed);

  return fields;
}
