import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useChatStore } from '../lib/chat-store';

interface TabRoute {
  key: string;
  name: string;
}

interface TabState {
  index: number;
  routes: TabRoute[];
}

interface TabNavigation {
  emit: (opts: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
  navigate: (name: string) => void;
}

export interface BottomTabsProps {
  state: TabState;
  navigation: TabNavigation;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptors?: any;
}

const TAB_CONFIG: Record<string, { label: string; icon: string }> = {
  feed: { label: 'Bairro', icon: '🏘️' },
  marketplace: { label: 'Mercado', icon: '🛒' },
  chat: { label: 'Chat', icon: '💬' },
};

function getTabKey(routeName: string) {
  return routeName.replace('(tabs)/', '');
}

export function BottomTabs({ state, navigation }: BottomTabsProps) {
  const unreadTotal = useChatStore((s) => s.unreadTotal);

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const key = getTabKey(route.name);
        const config = TAB_CONFIG[key] ?? { label: key, icon: '•' };
        const isFocused = state.index === index;
        const isChatTab = key === 'chat';

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tab}>
            <View>
              <Text style={[styles.icon, isFocused && styles.iconFocused]}>{config.icon}</Text>
              {isChatTab && unreadTotal > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadTotal > 99 ? '99+' : unreadTotal}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isFocused && styles.labelFocused]}>{config.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 8,
    paddingTop: 6,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  icon: { fontSize: 22, opacity: 0.5 },
  iconFocused: { opacity: 1 },
  label: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  labelFocused: { color: '#15803D', fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
