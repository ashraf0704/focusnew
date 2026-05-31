import crypto from 'node:crypto';
import {Router} from 'express';
import {HttpError} from '../middleware/errorHandler.js';
import {razorpay} from '../services/razorpayClient.js';
import {supabaseAdmin} from '../services/supabaseClient.js';
import {sendPushToProfile} from '../services/webPushClient.js';
import {profileFromRow} from '../utils/mappers.js';
import {getProfileRow} from './profile.js';

export const paymentsRouter = Router();

const prices = {
  pro: {monthly: 199, yearly: 1599, name: 'Deep Ashram Scholar'},
  guru: {monthly: 399, yearly: 2999, name: 'Premium Rishi Mentor'},
};

async function activatePlan(userId: string, planId: 'pro' | 'guru', billingCycle: 'monthly' | 'yearly', pointsApplied: number) {
  const profile = await getProfileRow(userId);
  const expires = new Date();
  expires.setDate(expires.getDate() + (billingCycle === 'monthly' ? 30 : 365));
  const {data, error} = await supabaseAdmin
    .from('user_profiles')
    .update({
      subscription_plan: planId,
      subscription_expires_at: expires.toISOString(),
      buddy_points: Math.max(0, Number(profile.buddy_points || 0) - pointsApplied),
    })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw new HttpError(400, 'Could not activate subscription', 'SUBSCRIPTION_ACTIVATE_FAILED');
  await sendPushToProfile(data, `Welcome to ${prices[planId].name}!`, 'Your account has been upgraded.');
  return data;
}

paymentsRouter.post('/create-order', async (req, res, next) => {
  try {
    const {planId, billingCycle, applyPoints} = req.body || {};
    if (!prices[planId as 'pro' | 'guru'] || !['monthly', 'yearly'].includes(billingCycle)) {
      throw new HttpError(400, 'Invalid plan selection', 'VALIDATION_ERROR');
    }

    const profile = await getProfileRow(req.user!.id);
    const basePrice = prices[planId as 'pro' | 'guru'][billingCycle as 'monthly' | 'yearly'];
    const pointsApplied = applyPoints ? Math.min(basePrice, Number(profile.buddy_points || 0)) : 0;
    const finalAmount = basePrice - pointsApplied;

    if (finalAmount === 0) {
      const updated = await activatePlan(req.user!.id, planId, billingCycle, pointsApplied);
      return res.json({amount: 0, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID || '', pointsApplied, profile: profileFromRow(updated)});
    }

    const order = await razorpay.orders.create({
      amount: finalAmount * 100,
      currency: 'INR',
      receipt: `fb_${req.user!.id.slice(0, 8)}_${Date.now()}`,
      notes: {userId: req.user!.id, planId, billingCycle, pointsApplied},
    });

    res.json({orderId: order.id, amount: finalAmount, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID || '', pointsApplied});
  } catch (error) {
    next(error);
  }
});

paymentsRouter.post('/verify', async (req, res, next) => {
  try {
    const {razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, billingCycle, pointsApplied = 0} = req.body || {};
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) throw new HttpError(400, 'Payment signature verification failed', 'PAYMENT_VERIFY_FAILED');
    const updated = await activatePlan(req.user!.id, planId, billingCycle, Number(pointsApplied || 0));
    res.json(profileFromRow(updated));
  } catch (error) {
    next(error);
  }
});
