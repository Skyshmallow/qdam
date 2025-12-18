# API Specification

## Base URL
Production: `https://qdam.tech/`  
Local development (Supabase/edge or local backend): `http://localhost:3000`

## Authentication
- Scheme: Bearer JWT (Supabase session access token).
- Send via `Authorization: Bearer <token>`.
- Public endpoints are noted explicitly; all others require auth.

---

## Endpoint: POST /auth/login
Purpose: Exchange OAuth credential (Google) for a session token.

Request (JSON):
```json
{
  "provider": "google",
  "oauthToken": "<google_oauth_token>"
}
```

Response 200:
```json
{
  "accessToken": "<jwt>",
  "expiresIn": 3600,
  "refreshToken": "<refresh_token>",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

Errors: 400 invalid payload; 401 auth failed; 429 rate limited.

---

## Endpoint: POST /auth/logout
Purpose: Invalidate current session.

Headers: `Authorization: Bearer <token>`

Response 204: no content.

Errors: 401 unauthorized.

---

## Endpoint: GET /profiles/me
Purpose: Fetch current user profile and stats.

Headers: `Authorization: Bearer <token>`

Response 200:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "walker",
  "displayName": "Walker",
  "avatarUrl": "https://.../avatar.png",
  "territoryAreaKm2": 1.23,
  "isDeveloper": false,
  "stats": {
    "totalChains": 12,
    "totalDistanceKm": 4.8,
    "territoryKm2": 1.23,
    "score": 1200
  }
}
```

Errors: 401 unauthorized.

---

## Endpoint: PUT /profiles/me
Purpose: Update display/profile fields.

Headers: `Authorization: Bearer <token>`

Request (JSON):
```json
{
  "displayName": "Walker",
  "avatarUrl": "https://.../avatar.png"
}
```

Response 200: updated profile (same shape as GET).

Errors: 400 validation; 401 unauthorized.

---

## Endpoint: POST /nodes
Purpose: Create start/end nodes for a route.

Headers: `Authorization: Bearer <token>`

Request (JSON):
```json
{
  "start": { "lat": 43.256, "lng": 76.945 },
  "end":   { "lat": 43.261, "lng": 76.951 }
}
```

Response 201:
```json
{
  "startNodeId": "uuid-start",
  "endNodeId": "uuid-end",
  "createdAt": "2025-01-12T10:00:00Z"
}
```

Errors: 400 validation; 401 unauthorized; 409 influence-radius violation.

---

## Endpoint: POST /chains
Purpose: Create a chain (route) between two nodes.

Headers: `Authorization: Bearer <token>`

Request (JSON):
```json
{
  "nodeAId": "uuid-start",
  "nodeBId": "uuid-end",
  "distanceKm": 0.62
}
```

Response 201:
```json
{
  "id": "uuid-chain",
  "nodeAId": "uuid-start",
  "nodeBId": "uuid-end",
  "distanceKm": 0.62,
  "createdAt": "2025-01-12T10:00:05Z"
}
```

Errors: 400 validation; 401 unauthorized; 404 node not found.

---

## Endpoint: GET /territories
Purpose: List territories (current user and others) with public fields only.

Headers: `Authorization: Bearer <token>` (optional if public read allowed; enforce per RLS policy)

Response 200:
```json
{
  "territories": [
    {
      "userId": "uuid-user",
      "polygon": [[43.25,76.94],[43.26,76.95],[43.27,76.94]],
      "areaKm2": 1.23,
      "color": "#00FF88",
      "updatedAt": "2025-01-12T10:01:00Z",
      "profile": {
        "displayName": "Walker",
        "avatarUrl": "https://.../avatar.png"
      }
    }
  ]
}
```

Errors: 401 unauthorized if private; 500 server error.

---

## Endpoint: POST /territories/recompute
Purpose: Trigger territory polygon recompute for current user (idempotent).

Headers: `Authorization: Bearer <token>`

Response 202:
```json
{ "status": "queued" }
```

Errors: 401 unauthorized; 409 insufficient nodes.

---

## Endpoint: GET /chains
Purpose: Fetch user chains (optionally paginated).

Query params: `limit`, `offset`

Headers: `Authorization: Bearer <token>`

Response 200:
```json
{
  "chains": [
    {
      "id": "uuid-chain",
      "nodeAId": "uuid-start",
      "nodeBId": "uuid-end",
      "distanceKm": 0.62,
      "createdAt": "2025-01-12T10:00:05Z"
    }
  ],
  "total": 12
}
```

Errors: 401 unauthorized.

---

## Endpoint: GET /nodes
Purpose: Fetch user nodes (optionally paginated).

Query params: `limit`, `offset`

Headers: `Authorization: Bearer <token>`

Response 200:
```json
{
  "nodes": [
    {
      "id": "uuid-start",
      "coordinates": { "lat": 43.256, "lng": 76.945 },
      "createdAt": "2025-01-12T10:00:00Z"
    }
  ],
  "total": 24
}
```

Errors: 401 unauthorized.

---

## Endpoint: POST /dev/simulate-route
Purpose: Developer-only simulation to create a route without affecting production gameplay.

Headers: `Authorization: Bearer <token>`

Request (JSON):
```json
{
  "points": [
    { "lat": 43.256, "lng": 76.945 },
    { "lat": 43.261, "lng": 76.951 }
  ]
}
```

Response 201:
```json
{ "status": "created", "chainId": "uuid-sim" }
```

Errors: 401 unauthorized; 403 not a developer.

---

## Error Codes (common)
- 400 Bad Request: validation failed or missing required fields.
- 401 Unauthorized: missing/invalid token.
- 403 Forbidden: not permitted (e.g., non-developer for simulation).
- 404 Not Found: referenced resource does not exist.
- 409 Conflict: business rule violation (e.g., outside influence radius, insufficient nodes).
- 429 Too Many Requests: rate limiting.
- 500 Internal Server Error: unexpected failure.

