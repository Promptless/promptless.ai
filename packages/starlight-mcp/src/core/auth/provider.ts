/**
 * Authentication seam.
 *
 * v1 ships only `AnonymousAuthProvider` (no auth — every request is anonymous,
 * and only `public` content is visible). The interface exists so that v2 can
 * add a `DelegatedResourceServer` (OAuth 2.1 resource server: verify a bearer
 * token, bind audience, map claims → groups) behind the same contract without
 * changing the transport, the server factory, or any tool signature.
 *
 * See `MCP_SERVER_PLAN.md` §6 for the eventual auth design.
 */

export type Identity =
  | { kind: 'anonymous' }
  | { kind: 'user'; subject: string; groups: string[] };

export interface AuthProvider {
  /** Whether this provider rejects unauthenticated requests. v1: false. */
  readonly requiresAuth: boolean;
  /**
   * Resolve the caller's identity from the request. v1 always returns
   * `{ kind: 'anonymous' }`. v2 verifies a bearer token and returns a user
   * identity, or signals a challenge (to be added to the return type then).
   */
  authenticate(request: Request): Promise<Identity>;
}

export class AnonymousAuthProvider implements AuthProvider {
  readonly requiresAuth = false;

  async authenticate(_request: Request): Promise<Identity> {
    return { kind: 'anonymous' };
  }
}
