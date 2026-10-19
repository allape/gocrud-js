export type Promisable<T> = T | Promise<T>;

export function stringify(err: Error | unknown): string {
  if (!err) return `${err}`;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return `${err.message || err.m || err.msg || err}`;
}

export function isFetchAbortError(e: Error | unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}
