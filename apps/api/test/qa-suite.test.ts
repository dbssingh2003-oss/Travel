/**
 * Automated QA Test Suite — DB Best Worlds v2
 * Validates critical P0 & P1 test cases across Saga, Redlock, Price Lock, Split Payments, and Security.
 */
import { prisma } from "../src/lib/prisma";
import { runBookingSaga, SagaStep } from "../src/modules/bookings/orchestrator/saga";
import { acquireTripLock } from "../src/modules/bookings/locking/redlock";
import { createPriceLock, getActivePriceLock, releasePriceLock } from "../src/modules/pricing/priceLock.service";
import { createSplitPaymentGroup, markSharePaid } from "../src/modules/payments/split/splitPayment.service";
import { hashPassword, verifyPassword } from "../src/modules/auth/auth.service";
import { createTripLegSchema } from "../src/modules/trips/legs/legs.schema";
import { getTripSagaTimeline } from "../src/modules/bookings/orchestrator/sagaLog";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testId: string, description: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testId} — ${description}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testId} — ${description}`);
    failedCount++;
  }
}

async function runAllTests() {
  console.log("==================================================================");
  console.log("🚀 Running DB Best Worlds Automated QA Test Suite (P0 & P1 Cases)");
  console.log("==================================================================\n");

  const testUserId = `test-user-${Date.now()}`;
  const testTripId = `test-trip-${Date.now()}`;

  try {
    // ----------------------------------------------------------------
    // Setup Test User & Trip
    // ----------------------------------------------------------------
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        email: `qa-test-${Date.now()}@dbbestworlds.test`,
        name: "QA Automated Tester",
        role: "USER",
        isVerified: true,
      },
    });

    const trip = await prisma.trip.create({
      data: {
        id: testTripId,
        userId: user.id,
        destination: "Manali, Himachal Pradesh",
        originCity: "New Delhi",
        startDate: new Date("2026-10-10"),
        endDate: new Date("2026-10-15"),
        travelers: 2,
        budgetTier: "MEDIUM",
        status: "DRAFT",
      },
    });

    const plan = await prisma.tripPlan.create({
      data: {
        tripId: trip.id,
        label: "Balanced",
        estimatedCost: 18500,
        costBreakdown: { transport: 6000, stay: 8500, localTransport: 2500, buffer: 1500 },
        itineraryJson: [{ day: 1, title: "Arrival & Mall Road Walk" }],
        selected: true,
      },
    });

    await prisma.payment.create({
      data: {
        tripId: trip.id,
        gateway: "razorpay",
        gatewayRefId: `pay_${Date.now()}`,
        amount: 18500,
        status: "AUTHORIZED",
      },
    });

    await prisma.booking.createMany({
      data: [
        { tripId: trip.id, type: "TRAIN", status: "PENDING", amount: 6000 },
        { tripId: trip.id, type: "HOTEL", status: "PENDING", amount: 8500 },
        { tripId: trip.id, type: "CAB", status: "PENDING", amount: 4000 },
      ],
    });

    // ================================================================
    // Module 1: Security & Auth (SEC-07, AUTH-07)
    // ================================================================
    console.log("🔐 Section 1: Authentication & Security Test Cases");
    const rawPass = "SuperSecret@2026";
    const hashed = await hashPassword(rawPass);
    assert(hashed.startsWith("$argon2"), "SEC-07", "Password securely hashed with Argon2id");

    const validPass = await verifyPassword(rawPass, hashed);
    assert(validPass === true, "AUTH-06", "Valid credentials verified successfully");

    const invalidPass = await verifyPassword("WrongPassword123", hashed);
    assert(invalidPass === false, "AUTH-07", "Invalid password rejected securely without leaking hash");

    // ================================================================
    // Module 2: Schema Validation (PLAN-03, SEC-01)
    // ================================================================
    console.log("\n🗺️ Section 2: Input Validation & Multi-Leg Test Cases");
    const validLeg = createTripLegSchema.safeParse({
      tripId: "123e4567-e89b-12d3-a456-426614174000",
      sequence: 1,
      originCity: "Delhi",
      destination: "Agra",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
    });
    assert(validLeg.success, "PLAN-06", "Valid multi-leg schema parsed and accepted");

    const invalidLeg = createTripLegSchema.safeParse({
      tripId: "not-a-uuid",
      sequence: 0,
      originCity: "D",
      destination: "",
      startDate: "invalid-date",
      endDate: "invalid-date",
    });
    assert(!invalidLeg.success, "SEC-01", "Zod rejects invalid/malicious input formats");

    // ================================================================
    // Module 3: Price Lock Window (PRICE-03, PRICE-04, PRICE-05)
    // ================================================================
    console.log("\n⏱️ Section 3: Pricing & Price Lock Test Cases");
    const priceLock = await createPriceLock(trip.id, plan.id, 900);
    assert(priceLock.lockedCost === 18500, "PRICE-03", "PriceLock record generated with locked price");
    assert(priceLock.secondsRemaining > 800, "PRICE-04", "PriceLock TTL initialized to ~15 minutes");

    const activeLock = await getActivePriceLock(trip.id);
    assert(activeLock !== null && activeLock.lockedCost === 18500, "PRICE-01", "Active quote hold verified");

    await releasePriceLock(trip.id);
    const releasedLock = await getActivePriceLock(trip.id);
    assert(releasedLock === null, "PRICE-05", "PriceLock successfully released after expiry or booking");

    // ================================================================
    // Module 4: Saga Distributed Concurrency & Rollback (SAGA-01 to SAGA-08)
    // ================================================================
    console.log("\n⚡ Section 4: Booking Saga Orchestrator Test Cases");

    // SAGA-08: Redlock Concurrency Test
    const lock1 = await acquireTripLock(trip.id, 10000);
    assert(lock1 !== null, "SAGA-08a", "Primary Redlock acquired for trip");

    const lock2 = await acquireTripLock(trip.id, 10000);
    assert(lock2 === null, "SAGA-08b", "Concurrent saga execution blocked by distributed lock");

    if (lock1) await lock1.release();

    // SAGA-03: Middle Failure & Rollback Test (Hotel fails -> Train compensates)
    console.log("\n  -> Simulating SAGA-03: Mid-saga failure (Train succeeds, Hotel fails, Train rolls back)");
    let trainCompensated = false;
    let hotelExecuted = false;

    const rollbackSteps: SagaStep[] = [
      {
        name: "TRAIN",
        execute: async () => ({ status: "CONFIRMED", referenceCode: "PNR_987654321" }),
        compensate: async () => {
          trainCompensated = true;
        },
      },
      {
        name: "HOTEL",
        execute: async () => {
          hotelExecuted = true;
          throw new Error("Hotel room inventory sold out at vendor");
        },
        compensate: async () => {},
      },
      {
        name: "CAB",
        execute: async () => ({ status: "CONFIRMED", referenceCode: "CAB_123" }),
        compensate: async () => {},
      },
    ];

    const rollbackResult = await runBookingSaga(rollbackSteps, trip.id);
    assert(!rollbackResult.success, "SAGA-03a", "Saga correctly halts on segment failure");
    assert(trainCompensated === true, "SAGA-03b", "Already-booked train was compensated & cancelled");

    const updatedPaymentRollback = await prisma.payment.findFirst({ where: { tripId: trip.id } });
    assert(updatedPaymentRollback?.status === "REFUNDED", "SAGA-03c", "Payment automatically refunded on saga failure");

    // SAGA-01: Full Happy Path Test
    console.log("\n  -> Simulating SAGA-01: Happy Path (Train -> Hotel -> Cab all succeed)");
    // Reset payment to AUTHORIZED for happy path test
    await prisma.payment.updateMany({
      where: { tripId: trip.id },
      data: { status: "AUTHORIZED" },
    });

    const happySteps: SagaStep[] = [
      {
        name: "TRAIN",
        execute: async () => ({ status: "CONFIRMED", referenceCode: "PNR_1122334455" }),
        compensate: async () => {},
      },
      {
        name: "HOTEL",
        execute: async () => ({ status: "CONFIRMED", referenceCode: "HTL_VOUCHER_99" }),
        compensate: async () => {},
      },
      {
        name: "CAB",
        execute: async () => ({ status: "CONFIRMED", referenceCode: "CAB_SCHEDULE_77" }),
        compensate: async () => {},
      },
    ];

    const happyResult = await runBookingSaga(happySteps, trip.id);
    assert(happyResult.success === true, "SAGA-01a", "Full saga successfully completed all legs");

    const updatedTrip = await prisma.trip.findUnique({ where: { id: trip.id } });
    assert(updatedTrip?.status === "BOOKED", "SAGA-01b", "Trip status transitioned to BOOKED");

    const updatedPaymentHappy = await prisma.payment.findFirst({ where: { tripId: trip.id } });
    assert(updatedPaymentHappy?.status === "CAPTURED", "SAGA-01c", "Payment captured upon full confirmation");

    // SAGA-13: SagaEvent Observability Audit Trail
    const events = await getTripSagaTimeline(trip.id);
    assert(events.length >= 6, "SAGA-13", `SagaEvent audit log recorded ${events.length} lifecycle transitions`);

    // ================================================================
    // Module 5: Split / Group Payments (PAY-08, PAY-09, PAY-11)
    // ================================================================
    console.log("\n👥 Section 5: Split / Group Payments Test Cases");
    const splitResult = await createSplitPaymentGroup({
      tripId: trip.id,
      totalAmount: 18500,
      splits: [
        { travelerId: "t_primary", amount: 9250 },
        { travelerId: "t_friend", amount: 9250 },
      ],
    });

    assert(splitResult.shares.length === 2, "PAY-08a", "Created 2 traveler payment shares");
    assert(Boolean(splitResult.shares[0].payLinkUrl), "PAY-08b", "Unique payment links generated per traveler");

    // Partial payment
    const partialResult = await markSharePaid(splitResult.shares[0].id);
    assert(!partialResult.allPaid, "PAY-09", "Booking remains pending until all shares collected");

    // Full payment
    const fullResult = await markSharePaid(splitResult.shares[1].id);
    assert(fullResult.allPaid === true, "PAY-11", "All shares paid triggers CAPTURED payment status");

    // ----------------------------------------------------------------
    // Cleanup QA fixture data
    // ----------------------------------------------------------------
    await prisma.paymentShare.deleteMany({ where: { paymentId: splitResult.payment.id } });
    await prisma.payment.deleteMany({ where: { tripId: trip.id } });
    await prisma.booking.deleteMany({ where: { tripId: trip.id } });
    await prisma.sagaEvent.deleteMany({ where: { tripId: trip.id } });
    await prisma.auditLog.deleteMany({ where: { tripId: trip.id } });
    await prisma.tripPlan.deleteMany({ where: { tripId: trip.id } });
    await prisma.trip.delete({ where: { id: trip.id } });
    await prisma.user.delete({ where: { id: user.id } });

  } catch (err: any) {
    console.error("Test execution threw exception:", err);
    failedCount++;
  }

  console.log("\n==================================================================");
  console.log(`🏁 QA Test Suite Run Complete: ${passedCount} Passed | ${failedCount} Failed`);
  console.log("==================================================================");

  process.exit(failedCount > 0 ? 1 : 0);
}

runAllTests();
