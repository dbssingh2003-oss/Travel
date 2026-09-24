/**
 * Manual Vendor Adapter (v1)
 *
 * Implements VendorAdapter for the ops-fulfilled manual vendor network.
 * book() creates a PENDING Booking and enqueues an ops task.
 * cancel() marks a booking CANCELLED.
 * getStatus() reads from the DB (ops agent updates it).
 *
 * Forward-compatibility: when a real vendor API is available,
 * replace only book()/getStatus() here — saga + DB + frontend don't change.
 */
import { prisma } from "../../../lib/prisma";
import { opsQueue } from "../../../jobs/ops-queue";
import type { VendorAdapter, SearchParams, VendorOption, Quote, TravelerInfo } from "./vendor-adapter.interface";
import type { BookingStatus, BookingType } from "../../../types/models";

export class ManualVendorAdapter implements VendorAdapter {
  constructor(
    private readonly type: BookingType,
    private readonly tripId: string,
    private readonly bookingId: string,
    private readonly amount: number
  ) {}

  async search(_params: SearchParams): Promise<VendorOption[]> {
    // Manual network: return vendors from DB for the given type/city
    const vendors = await prisma.vendor.findMany({
      where: { type: this.type, active: true, kycVerified: true },
      orderBy: { trustScore: "desc" },
      take: 5,
    });
    return vendors.map((v) => ({
      id: v.id,
      name: v.name,
      price: this.amount,
      meta: { city: v.city },
    }));
  }

  async quote(optionId: string): Promise<Quote> {
    return {
      optionId,
      amount: this.amount,
      currency: "INR",
      validUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 min
    };
  }

  async book(
    _optionId: string,
    _travelerInfo: TravelerInfo[]
  ): Promise<{ status: BookingStatus; referenceCode: string }> {
    // Set SLA deadline based on type
    const slaMins = this.type === "CAB" ? 20 : 45;
    const slaDeadline = new Date(Date.now() + slaMins * 60 * 1000);
    const referenceCode = `PENDING-${this.bookingId.slice(0, 8).toUpperCase()}`;

    await prisma.booking.update({
      where: { id: this.bookingId },
      data: { status: "PENDING", referenceCode, slaDeadline },
    });

    // Enqueue ops fulfillment task
    await opsQueue.add(
      "fulfill-booking",
      {
        bookingId: this.bookingId,
        tripId: this.tripId,
        type: this.type,
        amount: this.amount,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: false,
      }
    );

    // Return status PENDING + placeholder reference code
    return { status: "PENDING", referenceCode };
  }

  async cancel(_referenceCode?: string): Promise<void> {
    await prisma.booking.updateMany({
      where: { id: this.bookingId },
      data: { status: "CANCELLED" },
    });
  }

  async getStatus(_referenceCode?: string): Promise<BookingStatus> {
    const booking = await prisma.booking.findUnique({ where: { id: this.bookingId } });
    return booking?.status ?? "PENDING";
  }
}
