import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useStore } from '../store/useStore'
import { buildDigest } from '../lib/digest'
import { CHECK } from '../lib/digest'
import { Avatar } from '../components/ui/Avatar'

const TABS = ['Users', 'Digest Preview', 'Integrations', 'Danger Zone'] as const

export function Settings() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Users')
  const users = useStore((s) => s.users)
  const candidates = useStore((s) => s.candidates)
  const trackers = useStore((s) => s.newHireTrackers)
  const resetDemoData = useStore((s) => s.resetDemoData)
  const hm = users.find((u) => u.role === 'hiring_manager')!
  const digest = buildDigest(hm.id, hm.name, candidates, trackers)

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-heading font-semibold text-text-primary">Settings</h1>
        <p className="text-meta text-text-secondary">Org config, users, templates, and integrations.</p>
      </div>
      <div className="flex gap-1 border-b border-border px-6 pt-3">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-button px-3 py-2 text-meta font-medium transition-colors duration-micro ${
              tab === t ? 'border-b-2 border-accent text-accent' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {tab === 'Users' && (
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3">
                <Avatar userId={u.id} size={28} />
                <div>
                  <div className="text-meta font-medium text-text-primary">{u.name}</div>
                  <div className="text-caption text-text-secondary">{u.email}</div>
                </div>
                <span className="ml-auto rounded-tag bg-surface-elevated px-2 py-1 text-caption uppercase tracking-wide text-text-secondary">
                  {u.role.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === 'Digest Preview' && (
          <div className="mx-auto max-w-lg rounded-card border border-border bg-surface p-5 font-mono text-caption leading-relaxed text-text-secondary">
            <div className="mb-3 text-body font-semibold text-text-primary">Subject: Your Hiring Update — Week of {format(new Date(), 'MMM d')}</div>
            <p className="text-text-primary">Hi {digest.hmName.split(' ')[0]},</p>
            <p className="mt-2">Here's where things stand across your open roles.</p>

            <div className="mt-4 border-t border-border pt-2 font-semibold text-text-primary">PIPELINE</div>
            {digest.pipeline.length === 0 && <div className="mt-1">No active candidates in your pipeline.</div>}
            {digest.pipeline.map(({ candidate, note }) => (
              <div key={candidate.id} className="mt-1">
                • {candidate.name} — {note}
              </div>
            ))}

            <div className="mt-4 border-t border-border pt-2 font-semibold text-text-primary">NEW HIRES STARTING SOON</div>
            {digest.newHiresSoon.length === 0 && <div className="mt-1">None in the next 45 days.</div>}
            {digest.newHiresSoon.map(({ candidate, tracker }) => (
              <div key={candidate.id} className="mt-1">
                • {candidate.name} — Starting {format(new Date(tracker.startDate), 'MMM d')}
                <div className="ml-3">
                  BGC: {CHECK[tracker.backgroundCheck.status]} · DT: {CHECK[tracker.drugTest.status]} · Tech Setup: {CHECK[tracker.techSetup.status]}
                </div>
              </div>
            ))}

            <div className="mt-4 border-t border-border pt-2 font-semibold text-text-primary">ACTION NEEDED FROM YOU</div>
            {digest.actionNeeded.length === 0 && <div className="mt-1">Nothing pending. 🎉</div>}
            {digest.actionNeeded.map((a) => (
              <div key={a} className="mt-1">
                • {a}
              </div>
            ))}
          </div>
        )}

        {tab === 'Integrations' && (
          <div className="flex flex-col gap-2">
            {[
              ['Google Calendar', 'stub'],
              ['Outlook Calendar', 'stub'],
              ['Webex', 'stub'],
              ['HackerRank', 'stub'],
              ['Claude API', 'stub — swap in an API key to enable live drafts'],
              ['Email (SMTP / Resend)', 'stub'],
              ['E-signature', 'stub'],
              ['Checkr', 'stub'],
            ].map(([name, status]) => (
              <div key={name} className="flex items-center justify-between rounded-card border border-border bg-surface px-4 py-3 text-meta">
                <span className="text-text-primary">{name}</span>
                <span className="rounded-tag bg-warning/15 px-2 py-1 text-caption text-warning">{status}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'Danger Zone' && (
          <div className="max-w-md rounded-card border border-danger/30 bg-danger/5 p-4">
            <div className="text-body font-semibold text-danger">Reset demo data</div>
            <p className="mt-1 text-meta text-text-secondary">Restores all tickets to the seeded end-to-end scenario. Local-only, no server data affected.</p>
            <button
              onClick={() => {
                resetDemoData()
                toast.success('Demo data reset')
              }}
              className="mt-3 rounded-button bg-danger px-3 py-1.5 text-meta font-medium text-white hover:bg-danger/85"
            >
              Reset Demo Data
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
