import { PackIcon } from './pack'

export interface Identity {
  uid: string
  displayName: string | null
}

export interface CachedProfile {
  displayName: string
  icon: PackIcon | null
}

const IDENTITY_KEY = 'pp.auth'
const PROFILE_KEY = 'pp.profile'

// A paint hint only — Firebase Auth's own session lives in IndexedDB and is the
// source of truth. sessionStorage (not localStorage): survives same-tab
// navigation, so every page load after the first is thrash-free, while keeping
// the stale window no older than the current session. Every access is guarded —
// private windows throw on access.
const read = <T>(key: string): T | null => {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

const write = (key: string, value: unknown): void => {
  try {
    if (value == null) sessionStorage.removeItem(key)
    else sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable — skip; the cache is only an optimization
  }
}

export const readIdentityCache = (): Identity | null => read<Identity>(IDENTITY_KEY)
export const writeIdentityCache = (identity: Identity | null): void => write(IDENTITY_KEY, identity)

// Keyed to a uid so a stale entry from a previous account never paints under a
// different user.
export const readProfileCache = (uid: string): CachedProfile | null => {
  const entry = read<CachedProfile & { uid: string }>(PROFILE_KEY)
  return entry && entry.uid === uid ? { displayName: entry.displayName, icon: entry.icon } : null
}

export const writeProfileCache = (uid: string, profile: CachedProfile): void =>
  write(PROFILE_KEY, { uid, ...profile })
