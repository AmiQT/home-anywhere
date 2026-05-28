/**
 * Curated icon registry used by CMS-driven sections (How it works, Features).
 *
 * Admins pick a key from a fixed list in the admin editor; the public site
 * renders the matching Lucide component. Falls back to `Sparkles` if the key
 * is unknown (e.g. the registry shrinks but old content still references it).
 */

import {
  Search,
  CalendarCheck,
  ShieldCheck,
  Sparkles,
  Users,
  MapPin,
  Heart,
  Lock,
  CreditCard,
  House,
  Star,
  Clock,
  Award,
  Compass,
  Mail,
  Phone,
  Globe,
  Camera,
  type LucideIcon,
} from 'lucide-react'

export type IconKey =
  | 'search'
  | 'calendar'
  | 'shield'
  | 'sparkles'
  | 'users'
  | 'map-pin'
  | 'heart'
  | 'lock'
  | 'credit-card'
  | 'house'
  | 'star'
  | 'clock'
  | 'award'
  | 'compass'
  | 'mail'
  | 'phone'
  | 'globe'
  | 'camera'

export const ICON_MAP: Record<IconKey, LucideIcon> = {
  search: Search,
  calendar: CalendarCheck,
  shield: ShieldCheck,
  sparkles: Sparkles,
  users: Users,
  'map-pin': MapPin,
  heart: Heart,
  lock: Lock,
  'credit-card': CreditCard,
  house: House,
  star: Star,
  clock: Clock,
  award: Award,
  compass: Compass,
  mail: Mail,
  phone: Phone,
  globe: Globe,
  camera: Camera,
}

/** Human-readable labels for the admin icon picker. */
export const ICON_LABELS: Record<IconKey, string> = {
  search: 'Search',
  calendar: 'Calendar',
  shield: 'Shield',
  sparkles: 'Sparkles',
  users: 'Users',
  'map-pin': 'Map pin',
  heart: 'Heart',
  lock: 'Lock',
  'credit-card': 'Credit card',
  house: 'House',
  star: 'Star',
  clock: 'Clock',
  award: 'Award',
  compass: 'Compass',
  mail: 'Mail',
  phone: 'Phone',
  globe: 'Globe',
  camera: 'Camera',
}

export const ICON_KEYS = Object.keys(ICON_MAP) as IconKey[]

export function getIcon(key: string): LucideIcon {
  return ICON_MAP[key as IconKey] ?? Sparkles
}
