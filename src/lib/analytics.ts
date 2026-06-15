// Offline-first usage analytics for the kid games.
// Queues events in localStorage and flushes to Supabase when online.
// The publishable key is safe to ship in client code (RLS limits it to
// inserting rows into the events table only).

// ---- CONFIG: fill these in after creating the Supabase project ------------
const SUPABASE_URL = 'https://qipeblmrhmvzorfsujxd.supabase.co'; // e.g. https://abcd1234.supabase.co
const SUPABASE_KEY = 'sb_publishable_NBSUcyu_ZzezBO8PJIJBig_AMB-X9Nb'; // sb_publishable_...
const APP = 'zoo-smiles';
// ---------------------------------------------------------------------------

const ENDPOINT = `${SUPABASE_URL}/rest/v1/events`;
const QUEUE_KEY = 'kg_event_queue';
const DEVICE_KEY = 'kg_device_id';
const CONFIGURED =
  !SUPABASE_URL.includes('__') && !SUPABASE_KEY.includes('__');

type EventRow = {
  app: string;
  event_type: string;
  item: string | null;
  device_id: string;
  session_id: string;
  client_ts: string;
  duration_ms: number | null;
};

function uuid(): string {
  try {
    if (crypto && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* older WebView */
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function deviceId(): string {
  try {
    let d = localStorage.getItem(DEVICE_KEY);
    if (!d) {
      d = uuid();
      localStorage.setItem(DEVICE_KEY, d);
    }
    return d;
  } catch {
    return 'no-storage';
  }
}

const SESSION_ID = uuid();
const SESSION_START = Date.now();

function readQueue(): EventRow[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeQueue(q: EventRow[]): void {
  try {
    // keep the queue bounded so a long offline streak can't bloat storage
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-500)));
  } catch {
    /* storage full or blocked */
  }
}

let flushing = false;
async function flush(): Promise<void> {
  if (!CONFIGURED || flushing) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  const batch = readQueue();
  if (batch.length === 0) return;
  flushing = true;
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(batch),
      keepalive: true,
    });
    if (res.ok) {
      // drop exactly what we sent; anything enqueued mid-flush stays
      writeQueue(readQueue().slice(batch.length));
    }
  } catch {
    /* offline or blocked — stays queued for next flush */
  } finally {
    flushing = false;
  }
}

function enqueue(
  event_type: string,
  item?: string | null,
  duration_ms?: number | null,
): void {
  const row: EventRow = {
    app: APP,
    event_type,
    item: item ?? null,
    device_id: deviceId(),
    session_id: SESSION_ID,
    client_ts: new Date().toISOString(),
    duration_ms: duration_ms ?? null,
  };
  const q = readQueue();
  q.push(row);
  writeQueue(q);
  void flush();
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void flush());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
  // flush anything left over from a previous offline session
  void flush();
}

let appOpenSent = false;

export const analytics = {
  /** Call once when the app boots. Deduped against React StrictMode remounts. */
  appOpen(): void {
    if (appOpenSent) return;
    appOpenSent = true;
    enqueue('app_open');
  },
  /** Record opening a game / animal / sneaker. `item` is the id. */
  track(event_type: string, item?: string | null): void {
    enqueue(event_type, item);
  },
  /** Best-effort session-length ping when the app is hidden/closed. */
  sessionEnd(): void {
    enqueue('session_end', null, Date.now() - SESSION_START);
  },
};
