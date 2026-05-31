import React, { useState } from 'react';
import { Check, Sparkles, ShieldCheck, Award, Zap, Coins } from 'lucide-react';
import { api } from '../api';
import { UserProfile } from '../types';

interface SubscriptionHubProps {
  buddyPoints?: number;
  onRedeemBuddyPoints?: (profile: UserProfile) => void;
}

export default function SubscriptionHub({
  buddyPoints = 250,
  onRedeemBuddyPoints,
}: SubscriptionHubProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [applyPoints, setApplyPoints] = useState<boolean>(true);
  const [lastPaymentInfo, setLastPaymentInfo] = useState<{
    planName: string;
    pointsDeducted: number;
    amountPaid: number;
  } | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const plans = [
    {
      id: 'free',
      name: 'Novice Ashram Pass',
      badge: 'Free Tier',
      status: 'Current Level',
      priceMonthly: 0,
      priceYearly: 0,
      color: 'border-brand-outline bg-white',
      accent: 'text-brand-muted',
      buttonText: 'Active',
      features: [
        '💬 Basic Single-Agent Doubt Solver (10 queries/day)',
        'Standard Custom Pomodoro Clocks',
        'Ambient Rain & White Noise audio',
        'Course Milestone lists (1 course folder)',
        'Basic local studies statistics'
      ]
    },
    {
      id: 'pro',
      name: 'Deep Ashram Scholar',
      badge: 'Most Popular',
      status: 'Select Tier',
      priceMonthly: 199,
      priceYearly: 1599, // save substantial rupees
      color: 'border-brand-vibrant bg-[#FEFAE0]/10 ring-2 ring-brand-vibrant bg-white',
      accent: 'text-brand-vibrant',
      buttonText: 'Upgrade securely with points/UPI',
      features: [
        '🚀 Unlimited ChatGPT-4o & Gemini Advanced solvers',
        '⚡ Hyper-fast instant AI-generated revision sheets',
        '🔑 KameraShield Webcam Eye Monitor (Alerts)',
        'Unlimited interactive Course Folders',
        'Infinite revision flashcard decks',
        'Procedural sound & cafe ambient loops'
      ]
    },
    {
      id: 'guru',
      name: 'Premium Rishi Mentor',
      badge: 'Ultimate Power',
      status: 'Select Tier',
      priceMonthly: 399,
      priceYearly: 2999,
      color: 'border-brand-outline bg-white',
      accent: 'text-brand-primary',
      buttonText: 'Acquire Guru clearance',
      features: [
        '🌐 Ultimate Quad-AI suite (ChatGPT, Gemini, Claude, Perplexity)',
        '🔍 Grounded Perplexity web research & sources citations',
        '📊 Deep AI-powered behavioral analytics reviews',
        'All features of Deep Ashram Scholar',
        'Exclusive traditional Raga sound loops (Sitar, Flute)',
        'Sub-second latency multiplayer study focus rooms',
        'Direct offline CSV summaries export'
      ]
    }
  ];

  const handleCheckout = async (planId: string) => {
    if (planId === 'free') return;
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const order = await api.createPaymentOrder({
        planId: planId as 'pro' | 'guru',
        billingCycle,
        applyPoints,
      });

      if (order.profile) {
        onRedeemBuddyPoints?.(order.profile);
        setLastPaymentInfo({planName: plan.name, pointsDeducted: order.pointsApplied, amountPaid: 0});
        setSubscribed(true);
        return;
      }

      if (!window.Razorpay || !order.orderId) {
        throw new Error('Razorpay checkout is not available. Please check your connection and try again.');
      }

      await new Promise<void>((resolve, reject) => {
        const checkout = new window.Razorpay!({
          key: order.keyId,
          amount: order.amount * 100,
          currency: order.currency,
          name: 'Focus Buddy',
          description: `${plan.name} ${billingCycle} subscription`,
          order_id: order.orderId,
          theme: {color: '#5A5A40'},
          handler: async (response: Record<string, unknown>) => {
            try {
              const updated = await api.verifyPayment({
                ...response,
                planId,
                billingCycle,
                pointsApplied: order.pointsApplied,
              });
              onRedeemBuddyPoints?.(updated);
              setLastPaymentInfo({
                planName: plan.name,
                pointsDeducted: order.pointsApplied,
                amountPaid: order.amount,
              });
              setSubscribed(true);
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled.')),
          },
        });
        checkout.open();
      });
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Could not start checkout.');
    } finally {
      setIsCheckingOut(false);
    }
    return;

    const originalPrice = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
    
    let discount = 0;
    let pointsSpent = 0;

    if (applyPoints) {
      // 1 Buddy Point = ₹1 discount
      pointsSpent = Math.min(originalPrice, buddyPoints);
      discount = pointsSpent;
    }

    const finalAmount = Math.max(0, originalPrice - discount);

    if (onRedeemBuddyPoints && pointsSpent > 0) {
      onRedeemBuddyPoints({buddyPoints: Math.max(0, buddyPoints - pointsSpent)} as UserProfile);
    }

    setLastPaymentInfo({
      planName: plan.name,
      pointsDeducted: pointsSpent,
      amountPaid: finalAmount,
    });
    setSubscribed(true);

    setTimeout(() => {
      alert(`🎉 Congratulations! You have successfully upgraded to "${plan.name}" via modern checkout!
      Deducted Buddy Points: ${pointsSpent} Pts
      UPI/Razorpay invoice: ₹${finalAmount}
      Advanced KameraShield active eye monitoring is fully unlocked!`);
    }, 120);
  };

  return (
    <div className="p-6 bg-white border border-brand-outline rounded-3xl shadow-sm space-y-6" id="indian-subscription-hub">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-outline pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-brand-vibrant font-extrabold text-xs tracking-wider uppercase mb-1">
            <Zap size={14} className="fill-current animate-pulse" />
            Premium Focus buddy Access Tiers
          </div>
          <h3 className="font-sans font-black text-lg text-brand-dark">Premium Scholar Upgrade Suites</h3>
          <p className="text-xs text-brand-muted mt-0.5">Secure local Razorpay API gateways initialized. Local Indian pricing with UPI options available.</p>
        </div>

        {/* Billing cycle toggles */}
        <div className="flex items-center p-1 bg-brand-bg border border-brand-outline rounded-xl self-start">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
              billingCycle === 'monthly'
                ? 'bg-brand-primary text-white font-black shadow-xs'
                : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            Monthly Tiers
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
              billingCycle === 'yearly'
                ? 'bg-brand-primary text-white font-black shadow-xs'
                : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            Yearly Plan (Save ~37%)
          </button>
        </div>
      </div>

      {/* Buddy Points Reward & Payment Toggle Bar */}
      <div className="p-4 bg-brand-vibrant/5 border border-brand-vibrant/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 select-none animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-vibrant/20 flex items-center justify-center text-brand-vibrant">
            <Coins size={20} className="animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <span className="text-xs font-extrabold text-[#7C5A38] block">Your Buddy Points: {buddyPoints} Pts</span>
            <span className="text-[11px] text-brand-muted block">Redeem points for massive rupee discounts! (1 Pt = ₹1)</span>
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer bg-white px-4 py-2 border border-brand-outline rounded-xl shadow-xs hover:border-brand-primary/40 transition">
          <input
            type="checkbox"
            checked={applyPoints}
            onChange={(e) => setApplyPoints(e.target.checked)}
            className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary border-brand-outline accent-brand-vibrant cursor-pointer"
          />
          <span className="text-xs font-bold text-brand-dark">Apply point discounts</span>
        </label>
      </div>

      {checkoutError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
          {checkoutError}
        </div>
      )}

      {subscribed ? (
        <div className="p-8 bg-[#CCD5AE]/20 border border-brand-primary/20 rounded-2xl text-center space-y-4">
          <div className="w-16 h-16 bg-[#CCD5AE]/40 rounded-full flex items-center justify-center text-brand-primary mx-auto">
            <Award size={32} className="animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <h4 className="font-sans font-black text-brand-dark text-lg uppercase">{lastPaymentInfo?.planName || 'PRO'} ACTIVATED!</h4>
          <p className="text-xs text-brand-muted max-w-md mx-auto">
            Enjoy full advanced Kamerashield webcam tracking, custom breathing exercises, and zero advertisements.
          </p>
          <div className="p-3 bg-white/80 border border-brand-outline max-w-sm mx-auto rounded-xl text-left text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-brand-muted font-bold">Points Redeemed:</span>
              <span className="font-extrabold text-brand-vibrant">-{lastPaymentInfo?.pointsDeducted} Pts</span>
            </div>
            <div className="flex justify-between border-t border-brand-outline/65 pt-1 mt-1 font-bold">
              <span className="text-brand-dark">Net Amount Paid:</span>
              <span className="text-brand-primary">₹{lastPaymentInfo?.amountPaid}</span>
            </div>
          </div>
          <button
            onClick={() => setSubscribed(false)}
            className="px-5 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-xl hover:opacity-95 transition cursor-pointer"
          >
            Manage Billing Options
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const isPro = plan.id === 'pro';
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
            
            // Calculate discount
            const discount = applyPoints ? Math.min(price, buddyPoints) : 0;
            const discountedPrice = Math.max(0, price - discount);

            return (
              <div
                key={plan.id}
                className={`p-5 rounded-3xl border flex flex-col justify-between space-y-5 transition-all duration-300 relative ${plan.color}`}
              >
                {/* Special popular flag */}
                {isPro && (
                  <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-brand-vibrant text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                    {plan.badge}
                  </span>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-sans font-black text-brand-dark text-sm tracking-tight">{plan.name}</h4>
                      <span className="text-[10px] text-brand-muted font-bold font-sans">{plan.badge}</span>
                    </div>
                  </div>

                  {/* INR Price indicator with dynamic points checkout discount representation */}
                  <div className="space-y-1">
                    {discount > 0 && price > 0 ? (
                      <div className="space-y-0.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-brand-muted text-xs line-through">₹{price}</span>
                          <span className="text-3xl font-black text-brand-vibrant">₹{discountedPrice}</span>
                          <span className="text-xs text-brand-muted">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#7C5A38] block">
                          🪙 Saved ₹{discount} using {discount} points!
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-brand-dark">₹{price}</span>
                        <span className="text-xs text-brand-muted">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                      </div>
                    )}
                  </div>

                  {billingCycle === 'yearly' && plan.priceYearly > 0 && discount === 0 && (
                    <span className="text-[10px] text-brand-vibrant font-bold block bg-[#FEFAE0] border border-brand-outline px-2 py-0.5 rounded-md w-max">
                      Billed ₹{price} annually
                    </span>
                  )}

                  {/* Features list */}
                  <ul className="space-y-2 border-t border-brand-outline pt-4">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex gap-2 text-xs text-brand-dark leading-relaxed">
                        <Check size={13} className="text-brand-primary shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={plan.id === 'free' || isCheckingOut}
                  onClick={() => handleCheckout(plan.id)}
                  className={`w-full py-3 rounded-xl font-sans font-bold text-xs shadow-xs transition-all duration-200 pointer-events-auto active:scale-[0.98] cursor-pointer ${
                    plan.id === 'free'
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : isPro
                        ? 'bg-brand-vibrant text-white hover:opacity-95'
                        : 'bg-brand-primary text-white hover:opacity-95'
                  }`}
                >
                  {plan.id === 'free' ? 'Default Level' : isCheckingOut ? 'Opening checkout...' : plan.buttonText}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* UPI Indian checkout reassurance */}
      <div className="p-4 bg-brand-bg/50 border border-brand-outline rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-brand-primary" />
          <span className="font-bold text-brand-dark">NPCI UPI Verified Gateways Only</span>
        </div>
        <p className="text-[11px] text-brand-muted leading-tight text-center sm:text-right max-w-sm">
          Supports Google Pay, PhonePe, Paytm, RuPay Debit cards, and net banking with top Indian banks (SBI, HDFC, ICICI).
        </p>
      </div>
    </div>
  );
}
