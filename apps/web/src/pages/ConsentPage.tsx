import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Shield, IndianRupee, Train, Hotel, Car, Loader2, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { useTripStore } from "@/store/tripStore";

export default function ConsentPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { setConsentData } = useTripStore();
  const [accepted, setAccepted] = useState(false);
  const [booking, setBooking] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["consent", tripId],
    queryFn: async () => {
      const res = await api.post(`/trips/${tripId}/consent`);
      return res.data;
    },
    enabled: !!tripId,
  });

  const handleProceed = async () => {
    if (!accepted || !data) return;
    setBooking(true);
    try {
      setConsentData({ itemizedPrice: data.itemizedPrice, consentToken: data.consentToken });

      // Initiate booking (stub payment method token for dev)
      await api.post("/bookings/initiate", {
        tripId,
        consentToken: data.consentToken,
        paymentMethodToken: "rzp_dev_stub_token",
      });

      navigate(`/trips/${tripId}/booking`);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to initiate booking.");
    } finally {
      setBooking(false);
    }
  };

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
            Review & <span className="gradient-text">confirm</span>
          </h1>
          <p className="text-muted text-sm">
            Here is the full itemized price. No surprises after this screen.
          </p>
        </div>

        <div className="glass-card p-6 mb-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : price ? (
            <>
              <h3 className="font-semibold text-slate-200 mb-4">Price Breakdown</h3>
              <div className="space-y-3">
                {[
                  { icon: <Train className="w-4 h-4" />, label: "Train / Transport", amount: price.train },
                  { icon: <Hotel className="w-4 h-4" />, label: "Hotel Stay", amount: price.hotel },
                  { icon: <Car className="w-4 h-4" />, label: "Local Cab", amount: price.cab },
                  { icon: <IndianRupee className="w-4 h-4" />, label: "Buffer / contingency", amount: price.buffer },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50">
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <span className="text-muted">{item.icon}</span>
                      {item.label}
                    </div>
                    <span className="font-semibold">₹{item.amount?.toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-fg">Platform fee (3%)</span>
                  <span className="text-sm font-semibold">₹{price.platformFee?.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-bold text-lg">Total</span>
                  <span className="text-2xl font-black gradient-text">
                    ₹{price.total?.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-warning text-sm py-4">
              <AlertTriangle className="w-4 h-4" />
              Could not load pricing. Please go back and try again.
            </div>
          )}
        </div>

        {/* Cancellation & consent */}
        <div className="glass-card p-5 mb-6 border-warning/20">
          <p className="text-xs text-muted-fg leading-relaxed">
            <span className="text-warning font-semibold">Cancellation policy:</span> Train bookings
            follow IRCTC rules. Hotel and cab cancellations as per vendor policy (shown on
            confirmation page). Refunds processed within 5–7 business days.
          </p>
        </div>

        {/* Consent checkbox */}
        <label className="flex items-start gap-3 cursor-pointer mb-6 group select-none">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
              accepted ? "border-primary bg-primary" : "border-border group-hover:border-primary/50"
            }`}
          >
            {accepted && <span className="text-white text-xs font-bold">✓</span>}
          </div>
          <span className="text-sm text-slate-300 leading-relaxed">
            I have reviewed the itemized price and agree to proceed. I understand this will
            authorize payment of{" "}
            <span className="font-bold text-white">₹{price?.total?.toLocaleString("en-IN")}</span> and
            initiate the booking process.
          </span>
        </label>

        <button
          onClick={handleProceed}
          disabled={!accepted || booking || isLoading}
          className="btn-primary w-full text-lg py-4"
        >
          {booking ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Initiating booking…</>
          ) : (
            <>🔒 Proceed to Book — ₹{price?.total?.toLocaleString("en-IN")}</>
          )}
        </button>
        <p className="text-center text-xs text-muted-fg mt-3">
          Secured by Razorpay · Your card is never stored on our servers
        </p>
      </div>
    </motion.div>
  );
}
