/** Branded ID helpers — prevent mixing entity ids at compile time */
export type Brand<T, B extends string> = T & { readonly __brand: B };

export type SiteId = Brand<string, 'SiteId'>;
export type UserId = Brand<string, 'UserId'>;
export type PostId = Brand<string, 'PostId'>;
export type PageId = Brand<string, 'PageId'>;
export type LanguageId = Brand<string, 'LanguageId'>;
export type MediaId = Brand<string, 'MediaId'>;
export type CategoryId = Brand<string, 'CategoryId'>;
export type TagId = Brand<string, 'TagId'>;

export function brandId<B extends string>(value: string): Brand<string, B> {
  return value as Brand<string, B>;
}

/** Result type for service boundaries */
export type Ok<T> = { ok: true; value: T };
export type Err<E = string> = { ok: false; error: E };
export type Result<T, E = string> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E = string>(error: E): Err<E> => ({ ok: false, error });

/** Cursor pagination */
export type PaginationInput = {
  cursor?: string;
  limit?: number;
};

export type Page<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

/** Locale / language helpers */
export type TextDirection = 'ltr' | 'rtl';

export type LocaleCode = string;

export type LanguageScript = 'Latn' | 'Arab' | 'Deva' | 'Guru' | 'Cyrl' | 'Hans' | 'Hant' | 'Jpan' | 'Kore' | string;
