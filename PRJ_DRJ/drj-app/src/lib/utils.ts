import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hasDuplicate<T>(
  items: T[],
  currentLocalId: string,
  getLocalId: (item: T) => string,
  predicate: (item: T) => boolean,
): boolean {
  return items.some(
    item =>
      getLocalId(item) !== currentLocalId &&
      predicate(item)
  );
}
