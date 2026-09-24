import type { BookingStatus } from "../../../types/models";

export interface SearchParams {
  type: "TRAIN" | "HOTEL" | "CAB";
  origin?: string;
  destination: string;
  date: string;
  travelers: number;
}

export interface VendorOption {
  id: string;
  name: string;
  price: number;
  meta: Record<string, unknown>;
}

export interface Quote {
  optionId: string;
  amount: number;
  currency: "INR";
  validUntil: Date;
}

export interface TravelerInfo {
  name: string;
  age?: number;
  idType?: string;
  idRef?: string;
}

export interface VendorAdapter {
  search(params: SearchParams): Promise<VendorOption[]>;
  quote(optionId: string): Promise<Quote>;
  book(
    optionId: string,
    travelerInfo: TravelerInfo[]
  ): Promise<{ status?: BookingStatus; referenceCode: string }>;
  cancel(referenceCode?: string): Promise<void>;
  getStatus(referenceCode?: string): Promise<BookingStatus>;
}
