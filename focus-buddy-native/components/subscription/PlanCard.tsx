import {StyleSheet, Text, View} from 'react-native';
import {Button} from '@/components/ui/Button';
import {Colors} from '@/constants/colors';

export function PlanCard({name, price, features, onUpgrade}: {name: string; price: number; features: string[]; onUpgrade?: () => void}) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.price}>Rs. {price}</Text>
      {features.map(feature => <Text key={feature} style={styles.feature}>✓ {feature}</Text>)}
      {onUpgrade ? <Button onPress={onUpgrade}>Upgrade</Button> : <Button variant="ghost">Active</Button>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.softBorder, borderRadius: 18, padding: 16, gap: 10, marginBottom: 12},
  name: {fontSize: 18, fontWeight: '900', color: Colors.dark},
  price: {fontSize: 24, fontWeight: '900', color: Colors.vibrant},
  feature: {color: Colors.dark},
});
