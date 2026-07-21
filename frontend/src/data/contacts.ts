export type Circle = 'Family' | 'Friends' | 'Work' | 'Network'
export type ContactStatus = 'active' | 'paused' | 'pending'
export type Channel = 'email' | 'call' | 'message'

export interface Contact {
  id: string
  name: string
  email: string
  circle: Circle
  status: ContactStatus
  channel: Channel
  addedDate: string
  lastInteraction: string
}

// Placeholder data so the dashboard renders live before the API exists.
export const demoContacts: Contact[] = [
  {
    id: 'c1',
    name: 'Sebastian Gray',
    email: 'sebastian.gray@gmail.com',
    circle: 'Work',
    status: 'active',
    channel: 'call',
    addedDate: '2026-01-31',
    lastInteraction: '5 min ago',
  },
  {
    id: 'c2',
    name: 'Hunter Brooks',
    email: 'hunter.brooks@outlook.com',
    circle: 'Friends',
    status: 'paused',
    channel: 'message',
    addedDate: '2026-01-30',
    lastInteraction: 'Yesterday',
  },
  {
    id: 'c3',
    name: 'Lucas Anderson',
    email: 'lucas.a@company.io',
    circle: 'Network',
    status: 'active',
    channel: 'email',
    addedDate: '2026-01-28',
    lastInteraction: '15 min ago',
  },
  {
    id: 'c4',
    name: 'Nathan Phillips',
    email: 'nathan.phillips@company.io',
    circle: 'Network',
    status: 'paused',
    channel: 'email',
    addedDate: '2026-01-27',
    lastInteraction: 'Last week',
  },
  {
    id: 'c5',
    name: 'Aaron Butler',
    email: 'aaron.butler@gmail.com',
    circle: 'Friends',
    status: 'paused',
    channel: 'call',
    addedDate: '2026-01-26',
    lastInteraction: 'Yesterday',
  },
  {
    id: 'c6',
    name: 'Benjamin Scott',
    email: 'ben.scott@work.com',
    circle: 'Work',
    status: 'active',
    channel: 'call',
    addedDate: '2026-01-25',
    lastInteraction: '32 min ago',
  },
  {
    id: 'c7',
    name: 'Elijah Harris',
    email: 'elijah.harris@gmail.com',
    circle: 'Friends',
    status: 'active',
    channel: 'message',
    addedDate: '2026-01-22',
    lastInteraction: '3 hours ago',
  },
  {
    id: 'c8',
    name: 'Joshua Murphy',
    email: 'joshua.murphy@company.io',
    circle: 'Network',
    status: 'active',
    channel: 'call',
    addedDate: '2026-01-20',
    lastInteraction: '1 hour ago',
  },
  {
    id: 'c9',
    name: 'William Young',
    email: 'will.young@work.com',
    circle: 'Work',
    status: 'active',
    channel: 'call',
    addedDate: '2026-01-18',
    lastInteraction: '2 days ago',
  },
  {
    id: 'c10',
    name: 'Caleb Reed',
    email: 'caleb.reed@gmail.com',
    circle: 'Friends',
    status: 'paused',
    channel: 'message',
    addedDate: '2026-01-16',
    lastInteraction: '2 days ago',
  },
  {
    id: 'c11',
    name: 'Mason Thompson',
    email: 'mason.t@gmail.com',
    circle: 'Family',
    status: 'active',
    channel: 'call',
    addedDate: '2026-01-14',
    lastInteraction: 'Today 9:00 AM',
  },
  {
    id: 'c12',
    name: 'Aiden Parker',
    email: 'aiden.parker@company.io',
    circle: 'Network',
    status: 'pending',
    channel: 'email',
    addedDate: '2025-12-30',
    lastInteraction: 'Dec 30, 2025',
  },
  {
    id: 'c13',
    name: 'Isaac Wood',
    email: 'isaac.wood@work.com',
    circle: 'Work',
    status: 'active',
    channel: 'call',
    addedDate: '2025-12-19',
    lastInteraction: '6 hours ago',
  },
  {
    id: 'c14',
    name: 'Jackson Brooks',
    email: 'jackson.brooks@gmail.com',
    circle: 'Family',
    status: 'paused',
    channel: 'message',
    addedDate: '2025-12-09',
    lastInteraction: 'Never',
  },
]
