import { View, Text, StyleSheet } from 'react-native';

interface Props {
  verified: boolean;
}

export function VerifiedBadge({ verified }: Props) {
  if (!verified) {
    return (
      <View style={[styles.badge, styles.unverified]}>
        <Text style={styles.unverifiedText}>Não verificado</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.verified]}>
      <Text style={styles.checkmark}>✓</Text>
      <Text style={styles.verifiedText}>Verificado</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  verified: { backgroundColor: '#10B981' },
  unverified: { backgroundColor: '#E5E7EB' },
  checkmark: { color: '#fff', fontWeight: '900', marginRight: 4 },
  verifiedText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  unverifiedText: { color: '#6B7280', fontWeight: '600', fontSize: 12 },
});
