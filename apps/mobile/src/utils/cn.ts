/**
 * Utility function to combine class names
 * Similar to clsx/classnames but simplified for React Native
 */

type ClassValue = string | number | boolean | undefined | null;

export function cn(...classes: ClassValue[]): string {
  return classes
    .filter(Boolean)
    .join(' ')
    .trim();
}
