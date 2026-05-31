import {ReactNode} from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import {Colors} from '@/constants/colors';

export function Card({children, style}: {children: ReactNode; style?: ViewStyle}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {backgroundColor: Colors.white, borderRadius: 18, borderWidth: 1, borderColor: Colors.softBorder, padding: 16},
});
