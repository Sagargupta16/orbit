import { Button } from '@/components/ui/Button'
import { SparklesIcon, TrashIcon } from '@/components/icons'

/** Shown while any sample contact is in the list; the only way out is removing the samples. */
export function ContactListSampleNotice({ onRemove }: { onRemove: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-brand-500/30 bg-surface p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <SparklesIcon width={18} height={18} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">You are looking at sample contacts</p>
          <p className="mt-0.5 text-sm text-text-secondary">
            Rows tagged Sample are demo data. Remove them in one go, along with their sample interactions
            and reminders. Contacts you added yourself stay.
          </p>
        </div>
      </div>
      <Button
        variant="secondary"
        icon={<TrashIcon width={16} height={16} />}
        onClick={onRemove}
        className="w-full sm:w-auto"
      >
        Remove sample data
      </Button>
    </div>
  )
}
