// MFA push-approval service worker. Receives an "Approve sign-in?" push,
// shows it with Approve/Deny actions, and posts the response straight back
// to the API using this device's own session cookie — no app needs to be
// open in the foreground for this to work.
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }
  if (payload.type !== "mfa-approval") return;

  event.waitUntil(
    self.registration.showNotification(payload.title || "Approve sign-in?", {
      body: payload.body || "Someone is signing in to your account.",
      icon: "/icons/icon-192.png",
      tag: `mfa-${payload.challengeToken}`,
      requireInteraction: true,
      data: { challengeToken: payload.challengeToken },
      actions: [
        { action: "approve", title: "Approve" },
        { action: "deny", title: "Deny" },
      ],
    }),
  );
});

async function readCsrfCookie() {
  // Service workers have no `document`, but Chrome/Firefox expose the
  // async Cookie Store API here — same csrf_token cookie the app's own
  // API client reads, just from a context that can't touch document.cookie.
  if (typeof cookieStore !== "undefined") {
    const cookie = await cookieStore.get("csrf_token");
    return cookie?.value ?? null;
  }
  return null;
}

self.addEventListener("notificationclick", (event) => {
  const challengeToken = event.notification.data?.challengeToken;
  event.notification.close();
  if (!challengeToken || event.action === "") return;

  const approve = event.action === "approve";
  event.waitUntil(
    readCsrfCookie()
      .then((csrf) =>
        fetch("/api/v1/auth/mfa/push/respond", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(csrf ? { "x-csrf-token": csrf } : {}),
          },
          credentials: "include",
          body: JSON.stringify({ challengeToken, approve }),
        }),
      )
      .catch(() => {
        // Device is offline or session expired — the login page's own
        // timeout will fall back to manual code entry either way.
      }),
  );
});
