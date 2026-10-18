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
  path: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

export const primaryNav: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: DashboardIcon },
  { id: 'contacts', label: 'Contacts', path: '/contacts', icon: UsersIcon },
  { id: 'interactions', label: 'Interactions', path: '/interactions', icon: ActivityIcon },
  { id: 'circles', label: 'Circles', path: '/circles', icon: CircleIcon },
  { id: 'reminders', label: 'Reminders', path: '/reminders', icon: BellIcon },
]
