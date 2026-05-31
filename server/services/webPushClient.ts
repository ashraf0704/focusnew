import webPush from 'web-push';
import {supabaseAdmin} from './supabaseClient.js';

const publicKey = process.env.VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';
const subject = process.env.VAPID_SUBJECT || 'mailto:support@focusbuddy.app';

if (publicKey && privateKey) {
  webPush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendPushToProfile(
  profile: {id: string; push_subscription?: unknown; notifications_enabled?: boolean} | null,
  title: string,
  body: string,
) {
  if (!publicKey || !privateKey || !profile?.notifications_enabled || !profile.push_subscription) return;

  try {
    await webPush.sendNotification(profile.push_subscription as webPush.PushSubscription, JSON.stringify({title, body, url: '/'}));
  } catch (error: any) {
    if (error?.statusCode === 404 || error?.statusCode === 410) {
      await supabaseAdmin.from('user_profiles').update({push_subscription: null}).eq('id', profile.id);
    }
  }
}
