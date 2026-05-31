import {ReactNode} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {Colors} from '@/constants/colors';

export function Button({children, onPress, variant = 'primary', disabled}: {children: ReactNode; onPress?: () => void; variant?: 'primary' | 'ghost' | 'danger'; disabled?: boolean}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.base, styles[variant], disabled && styles.disabled]}>
      <Text style={[styles.text, variant === 'ghost' && styles.ghostText]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center'},
  primary: {backgroundColor: Colors.primary},
  ghost: {backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.softBorder},
  danger: {backgroundColor: Colors.danger},
  disabled: {opacity: 0.5},
  text: {color: Colors.white, fontWeight: '800'},
  ghostText: {color: Colors.primary},
});
