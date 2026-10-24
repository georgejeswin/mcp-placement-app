import { Transform } from 'class-transformer';

/** Accepts `?skills=React,Node.js` or repeated `?skills=React&skills=Node.js`. */
export const CommaSeparated = () =>
  Transform(({ value }) =>
    (Array.isArray(value) ? value : String(value).split(','))
      .map((v: string) => v.trim())
      .filter(Boolean),
  );
