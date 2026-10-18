import type { ComponentType, SVGProps } from 'react'
import { MailIcon, MeetingIcon, MessageIcon, NoteIcon, PhoneIcon } from '@/components/icons'
import type { InteractionKind } from '@/lib/api/types'

/** Label and line icon for each interaction kind, shared by every page that shows interactions. */
export const KIND_META: Record<
  InteractionKind,
  { label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }
> = {
  call: { label: 'Call', icon: PhoneIcon },
  email: { label: 'Email', icon: MailIcon },
  message: { label: 'Message', icon: MessageIcon },
  meeting: { label: 'Meeting', icon: MeetingIcon },
  other: { label: 'Other', icon: NoteIcon },
}
