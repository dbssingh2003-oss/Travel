import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Shield, IndianRupee, Train, Hotel, Car, AlertTriangle, ArrowLeft, Users, CheckCircle2 } from "lucide-react";
import { tripsApi, bookingsApi } from "@/lib/apiService";
import { useTripStore } from "@/store/tripStore";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PriceLockBanner } from "@/components/booking/PriceLockBanner";
import { SplitPaymentPanel, SplitShareItem } from "@/components/payments/SplitPaymentPanel";

export default function ConsentPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { setConsentData } = useTripStore();
  const { addToast } = useUIStore();
  const [accepted, setAccepted] = useState(false);
  const [booking, setBooking] = useState(false);
  const [isSplitMode, setIsSplitMode] = useState(false);

  const isValidTripId = Boolean(tripId && tripId !== "undefined" && tripId.trim() !== "");

  const { data, isLoading, error } = useQuery({
    queryKey: ["consent", tripId],
    queryFn: async () => {
      if (!isValidTripId) throw new Error("Invalid Trip ID");
      return await tripsApi.getConsent(tripId!);
    },
    enabled: isValidTripId,
  });

  const price = data?.itemizedPrice;
  const totalCost = price?.total || 0;

  // Mock initial split shares for multi-traveler trips
  const splitShares: SplitShareItem[] = [
    { id: "share_1", travelerId: "t_1", name: "You (Primary Booker)", amount: Math.ceil(totalCost / 2), status: "PENDING", payLinkUrl: `https://rzp.io/l/split_1_${tripId?.substring(0, 6)}` },
    { id: "share_2", travelerId: "t_2", name: "Traveler 2", amount: Math.floor(totalCost / 2), status: "PENDING", payLinkUrl: `https://rzp.io/l/split_2_${tripId?.substring(0, 6)}` },
  ];

  const handleProceed = async () => {
    if (!accepted || !data || !isValidTripId) return;
    setBooking(true);
    try {
      setConsentData({ itemizedPrice: data.itemizedPrice, consentToken: data.consentToken });

      await bookingsApi.initiate({
        tripId,
        consentToken: data.consentToken,
        paymentMethodToken: "rzp_dev_stub_token",
      });

      addToast({
        type: "success",
        title: "Payment Authorized",
        message: "Saga coordinator has started sequential booking across all segments.",
      });

      navigate(`/trips/${tripId}/booking`);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Authorization Failed",
        message: err.message || "Failed to initiate booking.",
      });
    } finally {
      setBooking(false);
    }
  };

  if (!isValidTripId) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4">
        <Card variant="default" className="p-8 text-center max-w-md space-y-4">
          <h2 className="text-xl font-bold text-text-main">No Active Trip Selected</h2>
          <p className="text-muted-fg text-sm">
            Please create or select a trip first.
          </p>
          <Button variant="primary" size="md" onClick={() => navigate("/plan")} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Go to Planner
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-16 px-4 max-w-3xl mx-auto space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto text-brand-500">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight">
          Itemized Price & Authorization Consent
        </h1>
        <p className="text-muted-fg text-sm max-w-md mx-auto">
          Review the transparent cost allocation before confirming. Zero hidden commissions or surprise fees.
        </p>
      </div>

      {tripId && (
        <PriceLockBanner tripId={tripId} lockedAmount={totalCost} />
      )}

      {isLoading ? (
        <Card variant="default" className="p-12 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent" />
        </Card>
      ) : error ? (
        <Card variant="default" className="p-8 text-center space-y-4">
          <AlertTriangle className="w-8 h-8 text-danger-500 mx-auto" />
          <p className="text-danger-500 text-sm font-medium">
            {(error as any)?.message || "Failed to load price consent details."}
          </p>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/trips/${tripId}/plans`)}>
            Back to Plans
          </Button>
        </Card>
      ) : price ? (
        <div className="space-y-6">
          <Card variant="default" className="p-6 space-y-6">
            {/* Itemized list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                <h3 className="font-bold text-sm text-text-main">Transparent Cost Breakdown</h3>
                <Badge variant="success" size="sm" dot>Audited Fares</Badge>
              </div>

              <div className="divide-y divide-surface-border">
                <div className="py-2.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-fg">
                    <Train className="w-4 h-4 text-brand-500" /> Train / Transport Tickets
                  </span>
                  <span className="font-mono font-semibold text-text-main">₹{(price.train || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-fg">
                    <Hotel className="w-4 h-4 text-brand-500" /> Hotel / Stay Accommodation
                  </span>
                  <span className="font-mono font-semibold text-text-main">₹{(price.hotel || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-fg">
                    <Car className="w-4 h-4 text-brand-500" /> Local Cab & Sightseeing Transfers
                  </span>
                  <span className="font-mono font-semibold text-text-main">₹{(price.cab || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-sm">
                  <span className="text-muted-fg">Platform Service Fee</span>
                  <span className="font-mono font-semibold text-text-main">₹{(price.platformFee || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-sm">
                  <span className="text-muted-fg">Statutory GST & Taxes (5%)</span>
                  <span className="font-mono font-semibold text-text-main">₹{(price.gst || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="py-3 flex items-center justify-between font-bold text-base bg-surface-hover/30 px-3 rounded-lg mt-2">
                  <span className="text-text-main">Total Authorized Amount</span>
                  <div className="flex items-center gap-1 text-xl font-mono font-extrabold text-brand-500">
                    <span>₹{(price.total || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Payment Toggle */}
            <div className="pt-2 border-t border-surface-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-500" />
                <span className="text-xs font-semibold text-text-main">Traveling with friends/family?</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSplitMode(!isSplitMode)}
              >
                {isSplitMode ? "Single Payer Mode" : "Enable Split Payment"}
              </Button>
            </div>

            {/* Split payment view if enabled */}
            {isSplitMode && (
              <SplitPaymentPanel
                totalAmount={totalCost}
                shares={splitShares}
              />
            )}

            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl bg-surface-hover/60 border border-surface-border hover:border-brand-500/40 transition-colors">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 rounded border-surface-border text-brand-500 focus:ring-brand-500 w-4 h-4"
              />
              <span className="text-xs text-muted-fg leading-relaxed">
                I authorize DB Best Worlds to execute bookings at the exact itemized prices listed above.
                Funds are held securely and only captured once all segments are confirmed. Any single leg failure automatically triggers a 100% compensating refund.
              </span>
            </label>

            <Button
              onClick={handleProceed}
              disabled={!accepted}
              isLoading={booking}
              variant="primary"
              size="lg"
              className="w-full text-base py-4 font-bold shadow-elevated"
            >
              Authorize ₹{(price.total || 0).toLocaleString("en-IN")} & Start Booking
            </Button>
          </Card>
        </div>
      ) : null}
    </motion.div>
  );
}
