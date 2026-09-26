# DB Best Worlds — QA Test Case Suite

Covers existing core platform + the v2 features from the build spec. Organized by module. Each case: **ID | Scenario | Steps | Expected Result | Priority**.

Priority key: **P0** = blocks release, **P1** = high, **P2** = medium/edge case.

---

## 1. Authentication & Account

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|------------------|----------|
| AUTH-01 | Register with valid email + phone | Fill registration form, submit | Account created, OTP sent to phone/email | P0 |
| AUTH-02 | Register with duplicate email | Register using an already-registered email | Error: "Email already in use", no duplicate account created | P0 |
| AUTH-03 | OTP verification success | Enter correct OTP within validity window | Account marked `isVerified: true`, redirected to dashboard | P0 |
| AUTH-04 | OTP expired | Wait past OTP TTL, then submit | Error shown, "Resend OTP" option available | P1 |
| AUTH-05 | OTP wrong code, 3 attempts | Enter incorrect OTP 3 times | Account temporarily locked or rate-limited, no crash | P1 |
| AUTH-06 | Login with correct credentials | Submit valid email + password | JWT issued, redirected to dashboard | P0 |
| AUTH-07 | Login with wrong password | Submit invalid password | Generic "invalid credentials" error (no user enumeration) | P0 |
| AUTH-08 | Login with unverified account | Login before OTP verification | Blocked, prompted to verify first | P1 |
| AUTH-09 | Forgot password flow | Request reset, receive token, set new password | Password updated, old sessions invalidated | P0 |
| AUTH-10 | Reset token reused after use | Use the same reset token twice | Second attempt rejected | P1 |
| AUTH-11 | Reset token expired | Use token after TTL | Rejected with clear error, new request possible | P1 |
| AUTH-12 | Google OAuth login | Complete OAuth flow | Account created/linked, JWT issued | P0 |
| AUTH-13 | Refresh token rotation | Let access token expire, use refresh token | New access token issued; old refresh token invalidated | P0 |
| AUTH-14 | Logout | Click logout | Tokens cleared client-side, refresh token revoked server-side | P0 |
| AUTH-15 | Role-based access — USER on `/ops` | Log in as USER, navigate to `/ops` | Access denied (403) or redirected | P0 |
| AUTH-16 | Role-based access — SUPPORT on `/ops` | Log in as SUPPORT role | Access granted, ops dashboard loads | P0 |
| AUTH-17 | Session across tabs | Log in on one tab, open second tab | Auth state reflected in both (Zustand + storage sync) | P2 |

---

## 2. Trip Planner (Origin, Dates, Budget, Multi-Leg)

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|------------------|----------|
| PLAN-01 | Create single-leg trip | Enter origin, destination, dates, travelers, budget | 3 tier plans generated (Budget/Balanced/Comfort) | P0 |
| PLAN-02 | Origin = destination | Enter same city for both | Validation error, form blocked | P1 |
| PLAN-03 | End date before start date | Set invalid date range | Validation error shown before submission | P0 |
| PLAN-04 | Zero travelers | Set travelers count to 0 | Validation error, minimum 1 enforced | P1 |
| PLAN-05 | Large traveler count (e.g. 20) | Enter 20 travelers | Plan generation still succeeds or shows a "contact support for groups" message, no crash | P2 |
| PLAN-06 | Multi-leg trip creation | Add Delhi→Agra→Jaipur→Delhi legs via MultiLegStep | All legs saved with correct sequence order | P0 |
| PLAN-07 | Multi-leg reorder | Drag/reorder legs in the UI | `sequence` field updates correctly in backend | P1 |
| PLAN-08 | Multi-leg remove a leg | Delete a middle leg | Remaining legs re-sequence correctly, no gaps | P1 |
| PLAN-09 | Multi-leg overlapping dates | Set leg 2 start date before leg 1 end date | Validation error on submission | P1 |
| PLAN-10 | Plan generation failure (no inventory) | Request a route with no available train/hotel data | Graceful error state, not a blank page or crash | P0 |
| PLAN-11 | Day-by-day itinerary render | Open a generated plan | Morning/Afternoon/Evening blocks populated for each day | P1 |
| PLAN-12 | Tier cost differences | Compare Budget vs Comfort Plus cost breakdown | Comfort Plus > Balanced > Budget Explorer in total cost | P0 |

---

## 3. Pricing Transparency & Price Lock

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|------------------|----------|
| PRICE-01 | Itemized breakdown visible | Open ConsentPage for any plan | Train, hotel, cab, buffer shown as separate line items summing to total | P0 |
| PRICE-02 | No hidden fees at checkout | Compare ConsentPage total to final payment amount | Amounts match exactly | P0 |
| PRICE-03 | Price lock activates | Select a plan, proceed to consent | `PriceLock` record created with `expiresAt` ~10-15 min out | P0 |
| PRICE-04 | Price lock countdown UI | Stay on ConsentPage | `PriceLockBanner` shows live countdown, matches Redis TTL | P1 |
| PRICE-05 | Price lock expires before booking | Wait past TTL, then click "Book Now" | User prompted to re-quote; stale price rejected server-side | P0 |
| PRICE-06 | Price lock re-quote reflects new price | Trigger re-quote after expiry | Updated itemized costs shown, user must re-consent | P1 |
| PRICE-07 | Concurrent price locks on same trip | Open ConsentPage in two tabs for the same trip | Only one active lock honored; second tab handled gracefully (not double-charged) | P1 |

---

## 4. Booking Saga Orchestrator (Train → Hotel → Cab)

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|------------------|----------|
| SAGA-01 | Full happy path | Book a plan where all 3 legs succeed | Train, Hotel, Cab all `CONFIRMED`; trip status `BOOKED` | P0 |
| SAGA-02 | Train booking fails | Simulate train adapter failure | Saga halts, no hotel/cab attempted (or compensates if already reserved), user notified, refund triggered | P0 |
| SAGA-03 | Hotel booking fails after train succeeds | Simulate hotel adapter failure mid-saga | Train booking automatically cancelled/compensated, full refund initiated | P0 |
| SAGA-04 | Cab booking fails after train + hotel succeed | Simulate cab adapter failure | Train and hotel compensated/rolled back, refund triggered | P0 |
| SAGA-05 | Compensation itself fails (e.g., train cancel API down) | Simulate compensation step failure | Saga marked as `NEEDS_MANUAL_INTERVENTION`, routed to Ops queue, not silently lost | P0 |
| SAGA-06 | Idempotent retry — duplicate "confirm hotel" call | Fire the same booking request twice with the same idempotency key | Only one hotel booking created; second call returns the cached result | P0 |
| SAGA-07 | Idempotency key missing/malformed | Send booking request without an idempotency key | Request rejected with clear validation error | P1 |
| SAGA-08 | Concurrent saga runs for same trip | Trigger "Book Now" twice rapidly for the same trip | Redlock prevents a second saga from starting; second request rejected or queued | P0 |
| SAGA-09 | Train returns RAC status | Simulate adapter returning RAC | `Booking.status = RAC`, UI shows RAC badge, saga proceeds (not treated as failure) | P0 |
| SAGA-10 | Train returns WAITLISTED status | Simulate adapter returning WL | `Booking.status = WAITLISTED`, UI offers fallback (bus/flight) option | P0 |
| SAGA-11 | Waitlist clears before departure | Simulate status change WL → CONFIRMED via polling/webhook | Booking status updates, user notified via WebSocket + notification | P1 |
| SAGA-12 | Saga timeout / vendor never responds | Simulate adapter hanging indefinitely | Saga step times out per configured limit, triggers failure/compensation path rather than hanging forever | P0 |
| SAGA-13 | SagaEvent logging completeness | Run any saga (success or failure) | Every step transition recorded in `SagaEvent` with correct `status` and timestamp | P1 |
| SAGA-14 | Partial modification — change hotel only | Post-booking, trigger "Modify Hotel" | Mini-saga runs for hotel only; train/cab bookings untouched | P0 |
| SAGA-15 | Partial modification failure | Simulate new hotel booking failing during modification | Original hotel booking remains intact (not cancelled until replacement confirmed) | P0 |

---

## 5. Real-Time WebSocket Updates

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|------------------|----------|
| WS-01 | Live milestone events | Book a trip, watch BookingProgressPage | Events stream in order: train confirmed → hotel locked → cab assigned | P0 |
| WS-02 | Reconnect after network drop | Disconnect Wi-Fi mid-saga, reconnect | Client rejoins `trip:{id}` room, receives missed/current state (not stuck on stale UI) | P0 |
| WS-03 | Multi-instance broadcast | Run 2 API instances behind LB, trigger saga | Events reach the client regardless of which instance processed the step (Redis adapter working) | P0 |
| WS-04 | Price-lock expiry socket event | Let price lock approach expiry | `price-lock:expiring` event fires client-side with correct seconds remaining | P1 |
| WS-05 | Unauthorized room join | Attempt to join another user's `trip:{id}` room | Rejected — server validates room membership against JWT/user ID | P0 |
| WS-06 | Saga step event for Ops panel | Trigger a saga while Ops dashboard is open | `saga:step` events populate `SagaObservabilityPanel` in real time | P1 |

---

## 6. Payments (Razorpay + Split Payments + Refunds)

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|------------------|----------|
| PAY-01 | Successful payment capture | Complete payment via Razorpay | `Payment.status = CAPTURED`, saga proceeds | P0 |
| PAY-02 | Payment webhook signature valid | Send valid Razorpay webhook | Processed, payment status updated | P0 |
| PAY-03 | Payment webhook signature invalid | Send tampered/invalid signature | Rejected (401/400), not processed | P0 |
| PAY-04 | Duplicate webhook delivery | Send the same webhook event twice | Second delivery deduplicated via idempotency table, no double-processing | P0 |
| PAY-05 | Payment fails at gateway | Simulate card decline | Trip not booked, user shown clear failure reason, no saga started | P0 |
| PAY-06 | Refund on saga failure | Trigger a saga rollback after payment captured | Refund initiated via Razorpay; `Payment.status = REFUNDED` | P0 |
| PAY-07 | "Instant" refund messaging accuracy | Trigger refund, check UI copy | UI reflects actual settlement time (e.g., "instant wallet credit, bank refund in 5-7 days") — not a false "instant" promise | P1 |
| PAY-08 | Split payment link generation | Create a group booking, generate per-traveler links | Each traveler gets a unique Razorpay payment link with correct amount | P0 |
| PAY-09 | Split payment partial completion | 2 of 3 travelers pay, 1 doesn't | Booking held pending; clear status per traveler shown; timeout/cancellation handled | P0 |
| PAY-10 | Split payment overpayment/underpayment edge case | Simulate a share paid at wrong amount | Rejected or reconciled explicitly, not silently accepted | P1 |
| PAY-11 | Split payment all shares complete | All travelers pay their share | Saga triggers automatically once full amount collected | P0 |

---

## 7. Dashboard (Traveler)

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|------------------|----------|
| DASH-01 | Trip history listing | Open Dashboard with past + upcoming trips | Correctly separated into past/current/upcoming sections | P1 |
| DASH-02 | Voucher download | Click download on a confirmed booking | PDF/voucher downloads with correct PNR/reference codes | P0 |
| DASH-03 | Vendor emergency contact display | Open a confirmed trip | Hotel and cab driver contact numbers visible and correct | P0 |
| DASH-04 | Savings counter accuracy | Compare displayed "You saved ₹X" to manual calculation | Value matches sum of (separate booking estimate − actual itemized cost) | P1 |
| DASH-05 | Empty state — no trips yet | View dashboard as a brand-new user | Friendly empty state with CTA to plan first trip (not a blank page) | P2 |
| DASH-06 | Post-trip review submission | Submit a rating/review after trip completion date | Review saved, reflected in `VendorRating`, feeds `trustScore` | P1 |
| DASH-07 | Review submission before trip completion | Attempt to review a trip still in progress | Blocked or hidden until trip end date passes | P2 |
| DASH-08 | Trip modification entry point | Click "Modify" on an upcoming confirmed trip | Opens `TripModificationModal` scoped to eligible legs only | P1 |

---

## 8. Ops / Support Desk

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|------------------|----------|
| OPS-01 | Task claiming | Agent claims a pending manual booking | Task locked to that agent, removed from others' queue | P0 |
| OPS-02 | Double-claim prevention | Two agents attempt to claim the same task simultaneously | Only one succeeds; second gets a "already claimed" response | P0 |
| OPS-03 | SLA deadline visibility | Open ops queue | Each task shows correct `slaDeadline` and time remaining | P1 |
| OPS-04 | SLA breach auto-escalation | Let a task's SLA deadline pass unclaimed | Task auto-escalates (reassigned or flagged) per `slaEscalation.service.ts` | P0 |
| OPS-05 | Saga observability panel accuracy | Open panel during/after a saga run | Timeline matches actual `SagaEvent` records in order | P1 |
| OPS-06 | Manual override / retry | Agent manually retries a failed booking step | Retry uses idempotency key correctly, doesn't duplicate | P0 |
| OPS-07 | Ticket reference verification | Agent enters a vendor reference code to verify | System validates format and marks task verified | P2 |

---

## 9. Vendor Management

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|------------------|----------|
| VEND-01 | Vendor KYC verification flow | Submit vendor documents | `kycVerified` flag updates correctly after admin approval | P1 |
| VEND-02 | Vendor trust score calculation | Add multiple ratings/disputes for a vendor | `trustScore` recalculates correctly | P1 |
| VEND-03 | Vendor scorecard deprioritization | Vendor exceeds cancellation-rate threshold | Vendor deprioritized/excluded from new plan generation | P1 |
| VEND-04 | Unverified vendor exclusion | Attempt to include a non-KYC vendor in a plan | Excluded from itinerary generation entirely | P0 |

---

## 10. Notifications

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|------------------|----------|
| NOTIF-01 | Booking confirmation SMS/email | Complete a booking | SMS (Twilio) and email (SES) sent with correct trip details | P1 |
| NOTIF-02 | Notification job failure retry | Simulate SMS provider downtime | Job retried per BullMQ config, eventually DLQ'd if still failing | P1 |
| NOTIF-03 | Waitlist-clear notification | Trigger WL → CONFIRMED transition | User notified via SMS/email/push in near real time | P1 |
| NOTIF-04 | Price-lock expiring reminder | Approach price lock expiry | Optional reminder notification sent (if implemented) | P2 |

---

## 11. Security

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|------------------|----------|
| SEC-01 | SQL/NoSQL injection attempt | Submit malicious strings in form fields | Rejected/sanitized by Zod validation, no DB error leakage | P0 |
| SEC-02 | JWT tampering | Modify JWT payload and resend | Request rejected (signature mismatch) | P0 |
| SEC-03 | Rate limiting on auth endpoints | Send rapid repeated login attempts | Rate limiter blocks after threshold | P0 |
| SEC-04 | CORS policy | Send request from unauthorized origin | Blocked by Fastify CORS config | P1 |
| SEC-05 | Sensitive data in logs | Trigger errors during payment/auth flows | Passwords, tokens, card details never appear in Pino logs | P0 |
| SEC-06 | IDOR — access another user's trip | Authenticated User A requests User B's trip ID directly | 403/404, not the trip data | P0 |
| SEC-07 | Password hashing | Inspect stored password | Argon2 hash, never plaintext | P0 |

---

## 12. Performance & Scalability

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|------------------|----------|
| PERF-01 | Plan generation under load | Simulate concurrent plan requests (e.g., 50 rps) | Response times stay within acceptable threshold, no DB connection exhaustion | P1 |
| PERF-02 | Neon connection pool under load | Run sustained load test | No "too many connections" errors (pooled connection string in use) | P0 |
| PERF-03 | WebSocket scaling across instances | Load test with multiple API instances | Events delivered reliably regardless of instance | P1 |
| PERF-04 | BullMQ queue backlog handling | Flood notification queue with jobs | Queue drains without memory issues; DLQ catches persistent failures | P2 |

---

## 13. Cross-Cutting UI/UX (Track A)

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|------------------|----------|
| UI-01 | Responsive layout — mobile | Load each page at 375px width | No horizontal overflow, all controls usable | P0 |
| UI-02 | Dark mode toggle | Switch theme via `ThemeToggle` | All pages render correctly in dark mode, no unreadable contrast | P1 |
| UI-03 | Skeleton loaders | Throttle network, load Dashboard/Plans pages | Skeletons match final layout shape, not generic spinners | P2 |
| UI-04 | Toast consistency | Trigger success/error across different flows | Single consistent Toast component used everywhere | P2 |
| UI-05 | Page transition smoothness | Navigate between planner wizard steps | Framer Motion transitions run at 150-300ms, no jank | P2 |
| UI-06 | Accessibility — keyboard navigation | Tab through PlannerWizard and ConsentPage | All interactive elements reachable and operable via keyboard | P1 |
| UI-07 | Accessibility — screen reader labels | Run axe/Lighthouse accessibility audit | No critical violations on core booking flow pages | P1 |
| UI-08 | Waitlist/RAC badge color coding | View a booking with WL/RAC status | Warning color (not error red, not success green) per design tokens | P2 |

---

## How to Use This Suite
- Run **P0 cases** before every release — these protect money movement, saga correctness, and security.
- Run **P1** cases on a regular QA cadence (e.g., weekly or per sprint).
- **P2** cases are good candidates for automated regression tests once the UI stabilizes.
- SAGA and PAY sections should be your first target for automated integration tests, since compensation/rollback paths are the hardest to catch manually and the most costly to get wrong in production.
