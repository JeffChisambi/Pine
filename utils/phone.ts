/**
 * Malawi mobile number helpers.
 *
 * National numbers are 9 digits (e.g. 991 234 567). We display them grouped
 * in 3-3-3 as the user types, keep only the raw digits internally, and build
 * the E.164 form (+265XXXXXXXXX) for submission.
 */

/** Strip any input down to the 9 national digits (drops +265 / leading 0 / spaces). */
export function malawiNationalDigits(input: string): string {
  let d = (input ?? '').replace(/\D/g, '');
  if (d.startsWith('265')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 9);
}

/** Group national digits as "991 234 567" (partial while typing). */
export function formatMalawiNational(input: string): string {
  const d = malawiNationalDigits(input);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean).join(' ');
}

/** True when exactly 9 national digits have been entered. */
export function isValidMalawiNational(input: string): boolean {
  return malawiNationalDigits(input).length === 9;
}

/** Full E.164 number for the API (+265XXXXXXXXX). */
export function malawiE164(input: string): string {
  return '+265' + malawiNationalDigits(input);
}
