import type { ContactInput } from '@/lib/contacts'

// Sample contacts a new user can one-click seed to populate their dashboard.
export const seedContacts: ContactInput[] = [
  { name: 'Sebastian Gray', email: 'sebastian.gray@gmail.com', circle: 'Work', status: 'active', channel: 'call', last_interaction: '5 min ago' },
  { name: 'Hunter Brooks', email: 'hunter.brooks@outlook.com', circle: 'Friends', status: 'paused', channel: 'message', last_interaction: 'Yesterday' },
  { name: 'Lucas Anderson', email: 'lucas.a@company.io', circle: 'Network', status: 'active', channel: 'email', last_interaction: '15 min ago' },
  { name: 'Nathan Phillips', email: 'nathan.phillips@company.io', circle: 'Network', status: 'paused', channel: 'email', last_interaction: 'Last week' },
  { name: 'Aaron Butler', email: 'aaron.butler@gmail.com', circle: 'Friends', status: 'paused', channel: 'call', last_interaction: 'Yesterday' },
  { name: 'Benjamin Scott', email: 'ben.scott@work.com', circle: 'Work', status: 'active', channel: 'call', last_interaction: '32 min ago' },
  { name: 'Elijah Harris', email: 'elijah.harris@gmail.com', circle: 'Friends', status: 'active', channel: 'message', last_interaction: '3 hours ago' },
  { name: 'Joshua Murphy', email: 'joshua.murphy@company.io', circle: 'Network', status: 'active', channel: 'call', last_interaction: '1 hour ago' },
  { name: 'William Young', email: 'will.young@work.com', circle: 'Work', status: 'active', channel: 'call', last_interaction: '2 days ago' },
  { name: 'Mason Thompson', email: 'mason.t@gmail.com', circle: 'Family', status: 'active', channel: 'call', last_interaction: 'Today 9:00 AM' },
  { name: 'Aiden Parker', email: 'aiden.parker@company.io', circle: 'Network', status: 'pending', channel: 'email', last_interaction: 'Dec 30, 2025' },
  { name: 'Jackson Brooks', email: 'jackson.brooks@gmail.com', circle: 'Family', status: 'paused', channel: 'message', last_interaction: 'Never' },
]
