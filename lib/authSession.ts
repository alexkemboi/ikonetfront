import type { Session } from "next-auth";

/** Remove backend credentials before a session is returned to a browser. */
export function sanitizeClientSession(session: Session): Session {
  const user = { ...session.user } as Record<string, unknown>;
  delete user.apiToken;
  delete user.refreshToken;
  return { ...session, user } as unknown as Session;
}

/** Attach the backend token for server consumers without making it serializable. */
export function attachServerOnlyApiToken(session: Session, apiToken: string): Session {
  const serverSession = { ...session, user: { ...session.user } };
  Object.defineProperty(serverSession.user, "apiToken", {
    value: apiToken,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return serverSession;
}
