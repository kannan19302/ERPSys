import { NextResponse } from "next/server";

/**
 * Serves the MFA push-approval service worker with the API's real origin
 * baked in server-side, instead of relying on a relative `fetch()` URL inside
 * the worker script.
 *
 * A static `public/mfa-push-sw.js` using a relative path (`/api/v1/...`)
 * only works when the web app and API share an origin. In dev (and any
 * split-origin deployment) `NEXT_PUBLIC_API_URL` points at a different host
 * — Next's `rewrites()` proxies *page* fetches for `/api/v1/*` transparently,
 * but a bare relative path is still fragile for a script that must keep
 * working from a background push event with no page/tab open. Baking in the
 * absolute origin removes that dependency entirely.
 */
export async function GET() {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "/api/v1").replace(
    /\/+$/,
    "",
  );

  const script = `// MFA push-approval service worker. Receives an "Approve sign-in?" push,
// shows it with Approve/Deny actions, and posts the response straight back
// to the API using this device's own session cookie — no app needs to be
// open in the foreground for this to work.
const API_BASE = ${JSON.stringify(apiBase)};

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }
  if (payload.type !== 'mfa-approval') return;

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Approve sign-in?', {
      body: payload.body || 'Someone is signing in to your account.',
      icon: '/icons/icon-192.png',
      tag: 'mfa-' + payload.challengeToken,
      requireInteraction: true,
      data: { challengeToken: payload.challengeToken },
      actions: [
        { action: 'approve', title: 'Approve' },
        { action: 'deny', title: 'Deny' },
      ],
    }),
  );
});

async function readCsrfCookie() {
  // Service workers have no \`document\`, but Chrome/Firefox expose the
  // async Cookie Store API here — same csrf_token cookie the app's own
  // API client reads, just from a context that can't touch document.cookie.
  if (typeof cookieStore !== 'undefined') {
    const cookie = await cookieStore.get('csrf_token');
    return cookie?.value ?? null;
  }
  return null;
}

async function respond(challengeToken, approve) {
  const csrf = await readCsrfCookie();
  const res = await fetch(API_BASE + '/auth/mfa/push/respond', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrf ? { 'x-csrf-token': csrf } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ challengeToken, approve }),
  });
  if (!res.ok) {
    throw new Error('respond failed: ' + res.status);
  }
}

self.addEventListener('notificationclick', (event) => {
  const challengeToken = event.notification.data?.challengeToken;
  event.notification.close();
  if (!challengeToken) return;

  // Tapping the notification body (not an action button) has no explicit
  // approve/deny intent — the previous version silently did nothing here,
  // which is exactly what made this feel broken. Bring the app to the
  // foreground instead so the user can find the manual code entry if the
  // action buttons weren't visible/tappable on their device.
  if (event.action === '') {
    event.waitUntil(
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clients) => {
          for (const client of clients) {
            if ('focus' in client) return client.focus();
          }
          return self.clients.openWindow('/login');
        }),
    );
    return;
  }

  const approve = event.action === 'approve';
  event.waitUntil(
    respond(challengeToken, approve).catch(() =>
      // The click reached the browser but the API call failed (offline,
      // session expired, wrong origin, ...) — tell the user instead of
      // silently swallowing it, so "Approve" never just appears to do
      // nothing.
      self.registration.showNotification('Approval could not be sent', {
        body: 'Open UniERP and enter the 6-digit code instead.',
        tag: 'mfa-' + challengeToken + '-failed',
      }),
    ),
  );
});
`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // Service workers must never be aggressively cached — a stale worker
      // would keep calling the wrong API origin after a deploy.
      "Cache-Control": "no-cache",
      "Service-Worker-Allowed": "/",
    },
  });
}
