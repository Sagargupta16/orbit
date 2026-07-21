import type { ComponentType, SVGProps } from 'react'
import {
  ActivityIcon,
  BellIcon,
  CircleIcon,
  DashboardIcon,
  UsersIcon,
} from '@/components/icons'

export interface NavItem {
  id: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

export const primaryNav: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: 'contacts', label: 'Contacts', icon: UsersIcon },
  { id: 'interactions', label: 'Interactions', icon: ActivityIcon },
  { id: 'circles', label: 'Circles', icon: CircleIcon },
  { id: 'reminders', label: 'Reminders', icon: BellIcon },
]
