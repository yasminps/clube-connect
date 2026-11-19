export type AuthState = { error?: string; success?: string };
export const passwordMinimum = 12;
export const tokenHashPattern = /^[A-Za-z0-9_-]{20,256}$/;