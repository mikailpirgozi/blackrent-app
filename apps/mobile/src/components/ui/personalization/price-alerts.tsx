/**
 * 🎯 Price Alerts Component
 * Display price alerts and trends for favorite vehicles
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Apple Design System
import AppleDesign from '../../../styles/apple-design-system';
import { useTranslation } from '../../../hooks/use-translation';
import { PriceAlert } from '../../../services/personalization-service';

interface PriceAlertsProps {
  alerts: PriceAlert[];
  onAlertPress: (alert: PriceAlert) => void;
  onManageAlertsPress: () => void;
}

export function PriceAlerts({
  alerts,
  onAlertPress,
  onManageAlertsPress,
}: PriceAlertsProps) {
  const { t } = useTranslation();

  const _getTrendIcon = (trend: PriceAlert['trend']) => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'stable':
        return 'remove';
      default:
        return 'remove';
    }
  };

  const _getTrendColor = (trend: PriceAlert['trend']) => {
    switch (trend) {
      case 'up':
        return AppleDesign.Colors.systemRed;
      case 'down':
        return AppleDesign.Colors.systemGreen;
      case 'stable':
        return AppleDesign.Colors.systemGray;
      default:
        return AppleDesign.Colors.systemGray;
    }
  };

  const _formatPriceChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}€${change}`;
  };


  if (alerts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-outline" size={48} color={AppleDesign.Colors.systemGray3} />
        <Text style={styles.emptyTitle}>Žiadne cenové upozornenia</Text>
        <Text style={styles.emptyText}>
          Nastavte si upozornenia na zmeny cien vašich obľúbených vozidiel.
        </Text>
        <TouchableOpacity style={styles.setupButton} onPress={onManageAlertsPress}>
          <Text style={styles.setupButtonText}>Nastaviť upozornenia</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="notifications" size={20} color={AppleDesign.Colors.systemPurple} />
          <Text style={styles.title}>Cenové upozornenia</Text>
        </View>
        <TouchableOpacity onPress={onManageAlertsPress}>
          <Text style={styles.manageText}>Spravovať</Text>
        </TouchableOpacity>
      </View>

      {/* Alerts List */}
      <View style={styles.listContent}>
        {alerts.map((item, index) => (
          <React.Fragment key={item.id}>
            <AlertCard alert={item} onPress={() => onAlertPress(item)} />
            {index < alerts.length - 1 && <View style={styles.separator} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

/**
 * Individual alert card component
 */
function AlertCard({ 
  alert, 
  onPress 
}: { 
  alert: PriceAlert; 
  onPress: () => void;
}) {
  const _getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const _getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return AppleDesign.Colors.systemRed;
      case 'down': return AppleDesign.Colors.systemGreen;
      default: return AppleDesign.Colors.systemGray;
    }
  };

  const trendIcon = getTrendIcon(alert.trend);
  const trendColor = getTrendColor(alert.trend);
  const isGoodNews = alert.trend === 'down' && alert.priceChange < 0;

  return (
    <TouchableOpacity
      style={[styles.alertCard, isGoodNews && styles.alertCardGood]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.alertIcon, { backgroundColor: trendColor + '20' }]}>
        <Ionicons name={trendIcon as any} size={20} color={trendColor} />
      </View>

      <View style={styles.alertContent}>
        <Text style={styles.vehicleName} numberOfLines={1}>
          {alert.vehicleName}
        </Text>
        <Text style={styles.currentPrice}>
          €{alert.currentPrice}/deň
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: AppleDesign.Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.screenPadding,
    marginBottom: AppleDesign.Spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginLeft: AppleDesign.Spacing.sm,
  },
  manageText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: AppleDesign.Spacing.screenPadding,
  },
  separator: {
    height: AppleDesign.Spacing.sm,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppleDesign.Colors.systemBackground,
    padding: AppleDesign.Spacing.md,
    borderRadius: AppleDesign.BorderRadius.lg,
    shadowColor: AppleDesign.Colors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertCardGood: {
    borderLeftWidth: 4,
    borderLeftColor: AppleDesign.Colors.systemGreen,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: AppleDesign.Spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  vehicleName: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: AppleDesign.Spacing.xs,
  },
  currentPrice: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '500',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceChange: {
    ...AppleDesign.Typography.caption1,
    fontWeight: '600',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.xs,
  },
  targetLabel: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginRight: AppleDesign.Spacing.sm,
  },
  targetPrice: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: AppleDesign.Spacing.xs,
  },
  statusText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.systemGreen,
    fontWeight: '500',
    marginLeft: AppleDesign.Spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: AppleDesign.Spacing.xxl,
    paddingHorizontal: AppleDesign.Spacing.screenPadding,
  },
  emptyTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginTop: AppleDesign.Spacing.md,
    marginBottom: AppleDesign.Spacing.sm,
  },
  emptyText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: AppleDesign.Spacing.lg,
  },
  setupButton: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingVertical: AppleDesign.Spacing.md,
    borderRadius: AppleDesign.BorderRadius.lg,
  },
  setupButtonText: {
    ...AppleDesign.Typography.body,
    color: 'white',
    fontWeight: '600',
  },
});
