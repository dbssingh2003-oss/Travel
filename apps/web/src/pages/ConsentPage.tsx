import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Shield, IndianRupee, Train, Hotel, Car, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { tripsApi, bookingsApi } from "@/lib/apiService";
import { useTripStore } from "@/store/tripStore";

export default function ConsentPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { setConsentData } = useTripStore();
  const [accepted, setAccepted] = useState(false);
  const [booking, setBooking] = useState(false);

  const isValidTripId = Boolean(tripId && tripId !== "undefined" && tripId.trim() !== "");

  const { data, isLoading, error } = useQuery({
    queryKey: ["consent", tripId],
    queryFn: async () => {
      if (!isValidTripId) throw new Error("Invalid Trip ID");
      return await tripsApi.getConsent(tripId!);
    },
    enabled: isValidTripId,
  });

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

      navigate(`/trips/${tripId}/booking`);
    } catch (err: any) {
      alert(err.message || "Failed to initiate booking.");
    } finally {
      setBooking(false);
    }
  };

  if (!isValidTripId) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">No Active Trip Selected</h2>
          <p className="text-muted text-sm mb-6">
            Please create or select a trip first.
          </p>
          <button onClick={() => navigate("/plan")} className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Go to Planner
          </button>
        </div>
      </div>
    );
  }

  const price = data?.itemizedPrice;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-24 pb-16"
    >
      <div className="section max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-success" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Transparent <span className="gradient-text">Price Consent</span>
          </h1>
          <p className="text-muted text-sm">
            Review the exact breakdown. No hidden fees, ever.
          </p>
        </div>

        {isLoading ? (
          <div className="glass-card p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="glass-card p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-danger mx-auto mb-3" />
            <p className="text-danger text-sm mb-4">
              {(error as any)?.message || "Failed to load price consent details."}
            </p>
            <button onClick={() => navigate(`/trips/${tripId}/plans`)} className="btn-secondary text-sm">
              Back to Plans
            </button>
          </div>
        ) : price ? (
          <div className="glass-card p-6 space-y-6">
            {/* Itemized list */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-200">Itemized Cost Breakdown</h3>
              <div className="divide-y divide-border">
                <div className="py-2.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-fg">
                    <Train className="w-4 h-4 text-muted" /> Train Tickets
                  </span>
                  <span className="font-medium">₹{(price.train || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-fg">
                    <Hotel className="w-4 h-4 text-muted" /> Hotel Stay
                  </span>
                  <span className="font-medium">₹{(price.hotel || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-fg">
                    <Car className="w-4 h-4 text-muted" /> Local Cab / Transfers
                  </span>
                  <span className="font-medium">₹{(price.cab || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-sm">
                  <span className="text-muted-fg">Platform Service Fee</span>
                  <span className="font-medium">₹{(price.platformFee || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-sm">
                  <span className="text-muted-fg">Taxes & GST (5%)</span>
                  <span className="font-medium">₹{(price.gst || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="py-3 flex items-center justify-between font-bold text-base">
                  <span>Total Amount</span>
                  <div className="flex items-center gap-1 text-xl gradient-text">
                    <IndianRupee className="w-5 h-5 text-accent" />
                    <span>{(price.total || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl bg-surface-2 border border-border hover:border-primary/40 transition-colors">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs text-muted-fg leading-relaxed">
                I authorize DB Best Worlds to book on my behalf at the exact prices listed above.
                My payment will only be charged once each leg is confirmed by verified vendors.
              </span>
            </label>

            <button
              onClick={handleProceed}
              disabled={!accepted || booking}
              className="btn-primary w-full text-base py-3.5 shadow-glow-primary"
            >
              {booking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authorizing Payment…
                </>
              ) : (
                `Authorize ₹${(price.total || 0).toLocaleString("en-IN")}`
              )}
            </button>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
