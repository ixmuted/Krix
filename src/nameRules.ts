/** Shared display-name rules for API keys and OAuth authorizations. */
export const NAME_MIN_LENGTH = 4;
export const NAME_MAX_LENGTH = 16;

/** Trims and validates a user-supplied name. Throws a user-facing error when invalid. */
export function validateDisplayName(
  raw: unknown,
  noun: string = "Name",
): string {
  const name = typeof raw === "string" ? raw.trim() : "";
  if (name.length < NAME_MIN_LENGTH) {
    throw new Error(
      `${noun} must be at least ${NAME_MIN_LENGTH} characters long.`,
    );
  }
  if (name.length > NAME_MAX_LENGTH) {
    throw new Error(`${noun} must be at most ${NAME_MAX_LENGTH} characters long.`);
  }
  return name;
}

/**
 * Returns `base` if unused, otherwise `base 2`, `base 3`, ... Always stays within
 * NAME_MAX_LENGTH by shortening the base to make room for the counter.
 */
export function withCounter(
  base: string,
  isTaken: (candidate: string) => boolean,
): string {
  const clean = base.trim().slice(0, NAME_MAX_LENGTH).trim();
  if (!isTaken(clean)) return clean;
  for (let n = 2; n < 1000; n++) {
    const suffix = ` ${n}`;
    const candidate =
      clean.slice(0, NAME_MAX_LENGTH - suffix.length).trim() + suffix;
    if (!isTaken(candidate)) return candidate;
  }
  return clean;
}
