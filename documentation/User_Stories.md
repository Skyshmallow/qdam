# User Stories

## Story 1: Sign in and start playing
As a player, I want to sign in with my Google account so I can access the game and have my progress saved.
Acceptance Criteria:
- Sign-in succeeds with a Google account and creates/loads my profile.
- Sign-out clears the session.
- If sign-in fails, I see an error and remain logged out.

## Story 2: Start and stop a route to create nodes
As a player, I want to start and stop a route so I can create nodes at my start and end points.
Acceptance Criteria:
- Pressing START records my start node; pressing STOP records my end node.
- The first route can start anywhere; subsequent starts are blocked unless inside the 500m influence radius.
- Nodes persist locally when offline and sync to cloud when online.

## Story 3: Form a territory
As a player, I want my routes to form a territory so I can see the area I control.
Acceptance Criteria:
- When I have at least 4 nodes (≥2 routes), a territory polygon is generated/updated.
- The territory area is displayed.
- Territory persists across sessions and after sync.

## Story 4: See other players’ territories
As a player, I want to see other players’ territories so I can understand nearby competition.
Acceptance Criteria:
- The map shows other players’ territories in distinct colors.
- Updates appear within ~2 seconds of changes.
- I do not see other players’ exact routes or node coordinates.

## Story 5: Play offline and sync later
As a player, I want to keep playing without internet so my progress is not lost.
Acceptance Criteria:
- I can start/stop routes offline; nodes/chains are stored locally.
- When the connection returns, pending data syncs automatically without duplication.
- If sync fails, it retries with backoff and shows a non-blocking status.

## Story 6: Developer simulation mode
As a developer/tester, I want to simulate routes without real movement so I can test features safely.
Acceptance Criteria:
- Only whitelisted emails can enter simulation mode.
- I can place start/end points by clicking and generate simulated chains/territory.
- Simulated data does not pollute production player data.


