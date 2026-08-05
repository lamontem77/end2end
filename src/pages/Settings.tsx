import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { CheckCircle2, AlertCircle, Loader2, RefreshCw, Link2, Unlink, ExternalLink } from 'lucide-react'
import { useStore } from '../store/useStore'
import { buildDigest } from '../lib/digest'
import { CHECK } from '../lib/digest'
import { Avatar } from '../components/ui/Avatar'
import { api, getBackendUrl, setBackendUrl, type BreezyStatus, type GoogleStatus } from '../integrations/apiClient'

const TABS = ['Users', 'Digest Preview', 'Integrations', 'Danger Zone'] as const

// ─── Integrations tab ─────────────────────────────────────────────────────────

function StatusBadge({ ok, label }: { ok: boolean; label?: string }) {
  return ok ? (
    <span className="flex items-center gap-1 rounded-tag bg-success/10 px-2 py-1 text-caption text-success">
      <CheckCircle2 className="h-3 w-3" />
      {label ?? 'Connected'}
    </span>
  ) : (
    <span className="flex items-center gap-1 rounded-tag bg-warning/15 px-2 py-1 text-caption text-warning">
      <AlertCircle className="h-3 w-3" />
      {label ?? 'Not connected'}
    </span>
  )
}

function IntegrationCard({ children, title, description }: { children: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="text-body font-semibold text-text-primary">{title}</div>
          <div className="mt-0.5 text-meta text-text-secondary">{description}</div>
        </div>
      </div>
      {children}
    </div>
  )
}

function BackendConfigSection({
  backendUrl,
  setBackendUrlState,
  onCheck,
  checking,
}: {
  backendUrl: string
  setBackendUrlState: (u: string) => void
  onCheck: () => void
  checking: boolean
}) {
  const [draft, setDraft] = useState(backendUrl)
  return (
    <IntegrationCard title="RecruiterOS Backend" description="URL of the Node.js server that talks to Breezy and Google.">
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-button border border-border bg-surface-elevated px-3 py-1.5 text-meta text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="http://localhost:3001"
        />
        <button
          onClick={() => {
            setBackendUrl(draft)
            setBackendUrlState(draft)
            onCheck()
          }}
          className="rounded-button bg-accent px-3 py-1.5 text-meta font-medium text-white hover:bg-accent/90"
        >
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save & Check'}
        </button>
      </div>
    </IntegrationCard>
  )
}

function BreezySection() {
  const [status, setStatus] = useState<BreezyStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [showForm, setShowForm] = useState(false)

  const fetchStatus = async () => {
    try {
      const s = await api.breezy.status()
      setStatus(s)
    } catch {
      setStatus(null)
    }
  }

  useEffect(() => { void fetchStatus() }, [])

  const handleConnect = async () => {
    if (!email || !password) { toast.error('Email and password are required'); return }
    setLoading(true)
    try {
      const res = await api.breezy.connect(email, password, companyId || undefined)
      toast.success(`Connected to Breezy — ${res.companyName}`)
      setShowForm(false)
      await fetchStatus()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      await api.breezy.sync()
      toast.success('Sync complete')
      await fetchStatus()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <IntegrationCard
      title="Breezy HR"
      description="Sync candidates from Breezy and push stage changes back."
    >
      <div className="flex items-center justify-between">
        <StatusBadge ok={status?.connected ?? false} />
        <div className="flex items-center gap-2">
          {status?.connected && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1 rounded-button border border-border px-2 py-1 text-caption text-text-secondary hover:text-text-primary"
            >
              {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Sync now
            </button>
          )}
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1 rounded-button border border-border px-2 py-1 text-caption text-text-secondary hover:text-text-primary"
          >
            <Link2 className="h-3 w-3" />
            {status?.connected ? 'Re-connect' : 'Connect'}
          </button>
        </div>
      </div>

      {status?.connected && status.sync.lastSyncAt && (
        <div className="mt-2 text-caption text-text-secondary">
          Last synced {format(new Date(status.sync.lastSyncAt), 'MMM d, h:mm a')} ·{' '}
          {status.sync.candidateCount} candidates across {status.sync.positionCount} positions
          {status.sync.error && (
            <span className="ml-2 text-danger">Error: {status.sync.error}</span>
          )}
        </div>
      )}

      {showForm && (
        <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
          <input
            className="rounded-button border border-border bg-surface-elevated px-3 py-1.5 text-meta text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            type="email"
            placeholder="Breezy account email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="rounded-button border border-border bg-surface-elevated px-3 py-1.5 text-meta text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="rounded-button border border-border bg-surface-elevated px-3 py-1.5 text-meta text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Company ID (optional — leave blank to auto-detect)"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          />
          <button
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-button bg-accent px-3 py-1.5 text-meta font-medium text-white hover:bg-accent/90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Connecting…' : 'Connect Breezy'}
          </button>
        </div>
      )}
    </IntegrationCard>
  )
}

function GoogleSection() {
  const [status, setStatus] = useState<GoogleStatus | null>(null)
  const [revoking, setRevoking] = useState(false)

  const fetchStatus = async () => {
    try {
      const s = await api.google.status()
      setStatus(s)
    } catch {
      setStatus(null)
    }
  }

  useEffect(() => {
    // Check if we just came back from OAuth
    const params = new URLSearchParams(window.location.search)
    if (params.get('google') === 'connected') {
      toast.success(`Google connected as ${params.get('email') ?? 'unknown'}`)
      window.history.replaceState({}, '', window.location.pathname)
    } else if (params.get('google') === 'error') {
      toast.error(`Google OAuth failed: ${params.get('message') ?? 'unknown error'}`)
      window.history.replaceState({}, '', window.location.pathname)
    }
    void fetchStatus()
  }, [])

  const handleRevoke = async () => {
    setRevoking(true)
    try {
      await api.google.revoke()
      toast.success('Google disconnected')
      setStatus({ connected: false, email: null })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke')
    } finally {
      setRevoking(false)
    }
  }

  return (
    <IntegrationCard
      title="Google (Gmail + Calendar)"
      description="Send emails via Gmail and book interviews on Google Calendar."
    >
      <div className="flex items-center justify-between">
        <StatusBadge
          ok={status?.connected ?? false}
          label={status?.connected ? status.email ?? 'Connected' : 'Not connected'}
        />
        <div className="flex items-center gap-2">
          {status?.connected ? (
            <button
              onClick={handleRevoke}
              disabled={revoking}
              className="flex items-center gap-1 rounded-button border border-border px-2 py-1 text-caption text-danger hover:bg-danger/5"
            >
              {revoking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
              Disconnect
            </button>
          ) : (
            <a
              href={api.google.oauthUrl()}
              className="flex items-center gap-1 rounded-button bg-accent px-3 py-1.5 text-caption font-medium text-white hover:bg-accent/90"
            >
              <ExternalLink className="h-3 w-3" />
              Connect Google
            </a>
          )}
        </div>
      </div>
      {!status?.connected && (
        <p className="mt-2 text-caption text-text-secondary">
          Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the server .env.{' '}
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            Set up in Google Cloud Console →
          </a>
        </p>
      )}
    </IntegrationCard>
  )
}

// ─── Main Settings page ───────────────────────────────────────────────────────

export function Settings() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Users')
  const users = useStore((s) => s.users)
  const candidates = useStore((s) => s.candidates)
  const trackers = useStore((s) => s.newHireTrackers)
  const resetDemoData = useStore((s) => s.resetDemoData)
  const hm = users.find((u) => u.role === 'hiring_manager')!
  const digest = buildDigest(hm.id, hm.name, candidates, trackers)

  const [backendUrl, setBackendUrlState] = useState(getBackendUrl)
  const [checking, setChecking] = useState(false)

  const checkBackend = async () => {
    setChecking(true)
    try {
      await api.health()
      toast.success('Backend reachable')
    } catch {
      toast.error('Cannot reach backend — is it running?')
    } finally {
      setChecking(false)
    }
  }

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
            <div className="mb-3 text-body font-semibold text-text-primary">
              Subject: Your Hiring Update — Week of {format(new Date(), 'MMM d')}
            </div>
            <p className="text-text-primary">Hi {digest.hmName.split(' ')[0]},</p>
            <p className="mt-2">Here's where things stand across your open roles.</p>

            <div className="mt-4 border-t border-border pt-2 font-semibold text-text-primary">PIPELINE</div>
            {digest.pipeline.length === 0 && <div className="mt-1">No active candidates in your pipeline.</div>}
            {digest.pipeline.map(({ candidate, note }) => (
              <div key={candidate.id} className="mt-1">• {candidate.name} — {note}</div>
            ))}

            <div className="mt-4 border-t border-border pt-2 font-semibold text-text-primary">NEW HIRES STARTING SOON</div>
            {digest.newHiresSoon.length === 0 && <div className="mt-1">None in the next 45 days.</div>}
            {digest.newHiresSoon.map(({ candidate, tracker }) => (
              <div key={candidate.id} className="mt-1">
                • {candidate.name} — Starting {format(new Date(tracker.startDate), 'MMM d')}
                <div className="ml-3">
                  BGC: {CHECK[tracker.backgroundCheck.status]} · DT: {CHECK[tracker.drugTest.status]} · Tech Setup:{' '}
                  {CHECK[tracker.techSetup.status]}
                </div>
              </div>
            ))}

            <div className="mt-4 border-t border-border pt-2 font-semibold text-text-primary">ACTION NEEDED FROM YOU</div>
            {digest.actionNeeded.length === 0 && <div className="mt-1">Nothing pending. 🎉</div>}
            {digest.actionNeeded.map((a) => (
              <div key={a} className="mt-1">• {a}</div>
            ))}
          </div>
        )}

        {tab === 'Integrations' && (
          <div className="flex max-w-xl flex-col gap-4">
            <BackendConfigSection
              backendUrl={backendUrl}
              setBackendUrlState={setBackendUrlState}
              onCheck={checkBackend}
              checking={checking}
            />
            <BreezySection />
            <GoogleSection />

            <div className="rounded-card border border-border bg-surface p-4">
              <div className="text-body font-semibold text-text-primary">Other integrations</div>
              <div className="mt-3 flex flex-col gap-2">
                {[
                  ['Webex / Zoom', 'Meeting links in interview invites'],
                  ['HackerRank / Codility', 'Auto-send assessments'],
                  ['Checkr', 'Background check initiation'],
                  ['E-signature (DocuSign / HelloSign)', 'Offer letter signing'],
                ].map(([name, note]) => (
                  <div key={name} className="flex items-center justify-between text-meta">
                    <div>
                      <span className="text-text-primary">{name}</span>
                      <span className="ml-2 text-text-secondary">{note}</span>
                    </div>
                    <span className="rounded-tag bg-surface-elevated px-2 py-1 text-caption text-text-secondary">Coming soon</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'Danger Zone' && (
          <div className="max-w-md rounded-card border border-danger/30 bg-danger/5 p-4">
            <div className="text-body font-semibold text-danger">Reset demo data</div>
            <p className="mt-1 text-meta text-text-secondary">
              Restores all tickets to the seeded end-to-end scenario. Local-only, no server data affected.
            </p>
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
