import {useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native';
import {BadgeGrid} from '@/components/insights/BadgeGrid';
import {SessionHistory} from '@/components/insights/SessionHistory';
import {WeeklyChart} from '@/components/insights/WeeklyChart';
import {BuddyPointsBar} from '@/components/subscription/BuddyPointsBar';
import {PlanCard} from '@/components/subscription/PlanCard';
import {Card} from '@/components/ui/Card';
import {Colors} from '@/constants/colors';
import {endpoints} from '@/lib/apiClient';
import {useAppStore} from '@/store/appStore';
import {useAuthStore} from '@/store/authStore';

export default function InsightsScreen() {
  const profile = useAuthStore(state => state.profile);
  const setProfile = useAuthStore(state => state.setProfile);
  const {sessionLogs, badges} = useAppStore();
  const [billingCycle] = useState<'monthly' | 'yearly'>('monthly');

  async function upgrade(planId: 'pro' | 'guru') {
    try {
      const order = await endpoints.createPaymentOrder({planId, billingCycle, applyPoints: true});
      if (order.profile) return setProfile(order.profile);
      const {default: RazorpayCheckout} = await import('react-native-razorpay');
      const payment = await RazorpayCheckout.open({
        key: order.keyId || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount * 100,
        currency: 'INR',
        order_id: order.orderId,
        name: 'Focus Buddy',
        description: `${planId} subscription`,
        theme: {color: Colors.primary},
      });
      const updated = await endpoints.verifyPayment({...payment, planId, billingCycle, pointsApplied: order.pointsApplied});
      setProfile(updated);
    } catch (error) {
      Alert.alert('Payment failed', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Insights & Growth</Text>
      <View style={styles.grid}>
        <Card><Text style={styles.metric}>{profile?.sessionsCount || 0}</Text><Text>Sessions</Text></Card>
        <Card><Text style={styles.metric}>{profile?.totalFocusMinutes || 0}</Text><Text>Minutes</Text></Card>
      </View>
      <Card><Text style={styles.section}>Last 7 days</Text><WeeklyChart logs={sessionLogs} /></Card>
      <Card><Text style={styles.section}>Badges</Text><BadgeGrid badges={badges} /></Card>
      <Card><Text style={styles.section}>Recent sessions</Text><SessionHistory logs={sessionLogs} /></Card>
      <BuddyPointsBar points={profile?.buddyPoints || 0} />
      <PlanCard name="Novice Ashram Pass" price={0} features={['Basic timer', 'Limited AI help']} />
      <PlanCard name="Deep Ashram Scholar" price={199} features={['Unlimited decks', 'Advanced AI solvers']} onUpgrade={() => upgrade('pro')} />
      <PlanCard name="Premium Rishi Mentor" price={399} features={['Quad AI suite', 'Premium analytics']} onUpgrade={() => upgrade('guru')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.bg},
  content: {padding: 18, gap: 18, paddingBottom: 110},
  title: {fontSize: 28, fontWeight: '900', color: Colors.dark},
  section: {fontSize: 18, fontWeight: '900', color: Colors.dark, marginBottom: 10},
  grid: {flexDirection: 'row', gap: 12},
  metric: {fontSize: 28, fontWeight: '900', color: Colors.vibrant},
});
