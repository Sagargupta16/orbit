# orbit roadmap

Researched 2026-10-18 against Monica, Dex, Mesh (formerly Clay), folk, Covve, Mob, Recall and Persodex. Every source was fetched that day; links are at the bottom.

## Shipped in 0.2

The core loop every personal CRM shares:

- Contacts with full details: add, edit, delete one, delete many, remove sample data, filters, search, and a detail page.
- Interaction log per person. Logging one updates "last contacted".
- Keep-in-touch cadence per contact (`stay_in_touch_days`). Due contacts show on the dashboard and on Reminders [5][16].
- One-off reminders, optionally tied to a contact.
- Birthdays in the next 30 days on the dashboard [1][16].
- Circles view, and a dashboard that answers "who should I reach out to today?".

## Next, ranked by value to one person

| Rank | Feature | Effort | Change in orbit | Why |
|---|---|---|---|---|
| 1 | Snooze or mark done a due contact, and spread first due dates | S | `contacts.snoozed_until`; due = max(base, snoozed_until); `POST /api/contacts/{id}/reconnect-done` | Put a nudge off without breaking the cadence. Dex admits never-contacted people all come due the same day [5][16] |
| 2 | Tap to call, text or email, then a prompt to log it | S | Frontend only: `tel:` / `sms:` / `mailto:` links, then a prefilled interaction | Logging happens as you reach out; Covve asks for notes right after a call [17][20] |
| 3 | Daily email digest, later web push | M | `user_settings` (timezone, digest hour); Vercel cron calls `/api/cron/digest`. Needs an email provider; web push needs a new dependency, so ask first | Reminders only work if they reach you [6][24][18] |
| 4 | Recurring reminders and extra important dates | M | `reminders.repeat`; marking done creates the next one. A `contact_dates` table feeds the dashboard | Kids' birthdays, quarterly check-ins [6][16] |
| 5 | Search inside notes | S | `q` also matches contact and interaction notes | "Who do I know in VC?" [8][18] |
| 6 | Export, then import with a duplicate preview | S/M | `GET /api/export` (JSON, CSV). Parse vCard or CSV in the browser and send JSON to `POST /api/contacts/import?dry_run=true` | No lock-in, and a fast start from your existing contacts [1][25][23] |
| 7 | Tags, plus bulk cadence | M | `tags`, `contact_tags`, a `?tag=` filter | One person can be in several groups [8][5] |
| 8 | Relationships between contacts | M | `contact_relations` (contact, related contact, kind) | Spouse and kids, who introduced whom [2][21] |
| 9 | Installable app: offline queue, voice notes | M | Manifest and service worker; `interactions.client_id` so a replayed offline write is not saved twice; browser speech recognition, no new dependency | Five-second capture right after meeting someone [7][18] |
| 10 | MCP endpoint so an assistant can log and look things up | M | Thin layer over the existing routers with the same JWT; the `mcp` package is a new dependency, so ask first | Log things by talking to Claude [19][7][3] |

## Traps to avoid

- **Data entry that feels like work** [23][19][26]. Create a contact with just a name, log in one tap, and default everything.
- **Sync that loses or duplicates data** [11][8][15]. No silent two-way sync, a preview for every import, keep hard delete, ship export.
- **Guilt and piles of nags** [22][23][5]. Spread due dates, cap the daily list, and keep the copy neutral rather than piling up red counters.

## Sources

[1] https://www.monicahq.com/
[2] https://github.com/monicahq/monica
[3] https://getdex.com/
[5] https://getdex.com/docs/workflows/keep-in-touch
[6] https://getdex.com/docs/workflows/reminders
[7] https://getdex.com/docs/changelog/changelog
[8] https://apps.apple.com/us/app/dex-rolodex-and-personal-crm/id1472132715
[11] https://apps.apple.com/us/app/mesh-contacts-crm/id1463073824
[15] https://apps.apple.com/us/app/covve-personal-crm/id958935377
[16] https://help.covve.com/help/in-touch-stay-in-touch-with-your-most-important-contacts-and-keep-them-warm-for-when-you-need-them-most
[17] https://help.covve.com/help/comms-your-personal-crm
[18] https://mobcrm.au/
[19] https://news.ycombinator.com/item?id=49151030
[20] https://www.recall.life/
[21] https://www.persodex.com
[22] https://shikharsachdev.substack.com/p/i-hate-personal-crms-i-might-need
[23] https://news.ycombinator.com/item?id=40489623
[24] https://news.ycombinator.com/item?id=25270001
[25] https://news.ycombinator.com/item?id=46042182
[26] https://news.ycombinator.com/item?id=41518100
