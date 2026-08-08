import { randomBytes } from "node:crypto";

// Excludes visually ambiguous characters (0/O, 1/I/L) since this is the
// identifier customers read back to themselves on a screen or in an email.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

/** e.g. "JC-7K3QXZ9F". Not guaranteed globally unique — callers must retry on a DB unique-constraint conflict. */
export function generateOrderNumber(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `JC-${code}`;
}
