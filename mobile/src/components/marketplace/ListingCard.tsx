import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import type { ListingDto } from '../../lib/api/marketplace.types';
import { VerifiedBadge } from '../VerifiedBadge';

interface Props {
  listing: ListingDto;
  onPress: () => void;
}

const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function ListingCard({ listing, onPress }: Props) {
  const cover = listing.photos[0]?.thumbnailUrl || listing.photos[0]?.url;
  const isSold = listing.status === 'sold';

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.imageWrap}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]} />
        )}
        {isSold && (
          <View style={styles.soldOverlay}>
            <Text style={styles.soldText}>VENDIDO</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={styles.price}>{priceFormatter.format(listing.price)}</Text>
        <View style={styles.sellerRow}>
          <VerifiedBadge verified={listing.sellerIsVerified} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imageWrap: { width: '100%', aspectRatio: 1, position: 'relative', backgroundColor: '#F3F4F6' },
  image: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: '#E5E7EB' },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,24,39,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  body: { padding: 10 },
  title: { fontSize: 14, color: '#111827', fontWeight: '600', marginBottom: 4 },
  price: { fontSize: 16, color: '#16A34A', fontWeight: '800', marginBottom: 6 },
  sellerRow: { flexDirection: 'row', alignItems: 'center' },
});
