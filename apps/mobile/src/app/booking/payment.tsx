/**
 * Payment Screen
 * Final step in booking flow - process payment
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { AppleDesign } from '../../styles/apple-design-system';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import {
  createPaymentIntent,
  confirmCardPayment,
  processApplePayPayment,
  processGooglePayPayment,
} from '../../services/payment/stripe-service';
import { STRIPE_THEME } from '../../config/stripe';

export default function PaymentScreen() {
  const router = useRouter();
  const { t } = useTranslation(['booking', 'common']);
  const params = useLocalSearchParams<{
    amount: string;
    rentalId: string;
    vehicleId: string;
  }>();
  
  const { isPlatformPaySupported } = useStripe();

  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'google_pay'>('card');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);
  
  const amount = parseFloat(params.amount || '0');

  // Check platform pay availability
  useEffect(() => {
    const checkPlatformPay = async () => {
      // Check Apple Pay (iOS only)
      if (Platform.OS === 'ios') {
        const applePaySupported = await isPlatformPaySupported();
        setApplePayAvailable(applePaySupported);
      }
      
      // Check Google Pay (Android only)
      if (Platform.OS === 'android') {
        const googlePaySupported = await isPlatformPaySupported({
          googlePay: { testEnv: __DEV__ },
        });
        setGooglePayAvailable(googlePaySupported);
      }
    };
    
    checkPlatformPay();
  }, [isPlatformPaySupported]);

  // Create payment intent on mount
  useEffect(() => {
    const initPayment = async () => {
      try {
        setLoading(true);
        const intent = await createPaymentIntent({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'eur',
          rentalId: params.rentalId,
          metadata: {
            vehicleId: params.vehicleId,
          },
        });
        
        setClientSecret(intent.clientSecret);
      } catch (error) {
        console.error('Failed to initialize payment:', error);
        Alert.alert(
          t('common:errors.general'),
          t('booking:payment.initError'),
          [
            {
              text: t('common:buttons.retry'),
              onPress: () => router.back(),
            },
          ]
        );
      } finally {
        setLoading(false);
      }
    };
    
    initPayment();
  }, [amount, params.rentalId, params.vehicleId]);

  const handleCardPayment = useCallback(async () => {
    if (!clientSecret || !cardComplete) {
      return;
    }

    try {
      setLoading(true);
      
      const result = await confirmCardPayment(clientSecret, {
        email: 'customer@example.com', // TODO: Get from auth context
        name: 'Customer Name', // TODO: Get from booking data
      });

      if (result.success) {
        // Payment successful
        Alert.alert(
          t('booking:payment.success'),
          t('booking:payment.successMessage'),
          [
            {
              text: t('common:buttons.continue'),
              onPress: () => {
                router.replace({
                  pathname: '/booking/confirmation',
                  params: {
                    rentalId: params.rentalId,
                    paymentIntentId: result.paymentIntentId,
                  },
                });
              },
            },
          ]
        );
      } else {
        // Payment failed
        Alert.alert(
          t('booking:payment.failed'),
          result.error || t('booking:payment.failedMessage'),
          [
            {
              text: t('common:buttons.retry'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert(
        t('common:errors.general'),
        t('booking:payment.error')
      );
    } finally {
      setLoading(false);
    }
  }, [clientSecret, cardComplete, params.rentalId, t, router]);

  const handleApplePay = useCallback(async () => {
    if (!clientSecret) return;

    try {
      setLoading(true);
      
      const result = await processApplePayPayment(
        clientSecret,
        'merchant.com.blackrent', // TODO: Use from config
        [
          {
            label: t('booking:payment.vehicleRental'),
            amount: amount.toFixed(2),
          },
        ]
      );

      if (result.success) {
        Alert.alert(
          t('booking:payment.success'),
          t('booking:payment.successMessage'),
          [
            {
              text: t('common:buttons.continue'),
              onPress: () => {
                router.replace({
                  pathname: '/booking/confirmation',
                  params: {
                    rentalId: params.rentalId,
                    paymentIntentId: result.paymentIntentId,
                  },
                });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          t('booking:payment.failed'),
          result.error || t('booking:payment.failedMessage')
        );
      }
    } catch (error) {
      console.error('Apple Pay error:', error);
      Alert.alert(
        t('common:errors.general'),
        t('booking:payment.error')
      );
    } finally {
      setLoading(false);
    }
  }, [clientSecret, amount, params.rentalId, t, router]);

  const handleGooglePay = useCallback(async () => {
    if (!clientSecret) return;

    try {
      setLoading(true);
      
      const result = await processGooglePayPayment(
        clientSecret,
        Math.round(amount * 100), // cents
        'EUR',
        'SK'
      );

      if (result.success) {
        Alert.alert(
          t('booking:payment.success'),
          t('booking:payment.successMessage'),
          [
            {
              text: t('common:buttons.continue'),
              onPress: () => {
                router.replace({
                  pathname: '/booking/confirmation',
                  params: {
                    rentalId: params.rentalId,
                    paymentIntentId: result.paymentIntentId,
                  },
                });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          t('booking:payment.failed'),
          result.error || t('booking:payment.failedMessage')
        );
      }
    } catch (error) {
      console.error('Google Pay error:', error);
      Alert.alert(
        t('common:errors.general'),
        t('booking:payment.error')
      );
    } finally {
      setLoading(false);
    }
  }, [clientSecret, amount, params.rentalId, t, router]);

  const handlePayment = useCallback(() => {
    if (paymentMethod === 'card') {
      handleCardPayment();
    } else if (paymentMethod === 'apple_pay') {
      handleApplePay();
    } else if (paymentMethod === 'google_pay') {
      handleGooglePay();
    }
  }, [paymentMethod, handleCardPayment, handleApplePay, handleGooglePay]);

  if (loading && !clientSecret) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppleDesign.Colors.systemBlue} />
          <Text style={styles.loadingText}>{t('booking:payment.initializing')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={24} color={AppleDesign.Colors.systemBlue} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('booking:payment.title')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Amount Summary */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>{t('booking:payment.totalAmount')}</Text>
          <Text style={styles.amountValue}>{amount.toFixed(2)}€</Text>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking:payment.selectMethod')}</Text>

          {/* Card Payment */}
          <TouchableOpacity
            style={[
              styles.methodCard,
              paymentMethod === 'card' && styles.methodCardActive,
            ]}
            onPress={() => setPaymentMethod('card')}
            disabled={loading}
          >
            <View style={styles.methodHeader}>
              <View style={styles.methodLeft}>
                <Ionicons
                  name="card-outline"
                  size={24}
                  color={paymentMethod === 'card' ? AppleDesign.Colors.systemBlue : AppleDesign.Colors.label}
                />
                <Text style={[
                  styles.methodName,
                  paymentMethod === 'card' && styles.methodNameActive,
                ]}>
                  {t('booking:payment.creditCard')}
                </Text>
              </View>
              <View style={[
                styles.radio,
                paymentMethod === 'card' && styles.radioActive,
              ]}>
                {paymentMethod === 'card' && (
                  <View style={styles.radioDot} />
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Apple Pay */}
          {applePayAvailable && Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[
                styles.methodCard,
                paymentMethod === 'apple_pay' && styles.methodCardActive,
              ]}
              onPress={() => setPaymentMethod('apple_pay')}
              disabled={loading}
            >
              <View style={styles.methodHeader}>
                <View style={styles.methodLeft}>
                  <Ionicons
                    name="logo-apple"
                    size={24}
                    color={paymentMethod === 'apple_pay' ? AppleDesign.Colors.systemBlue : AppleDesign.Colors.label}
                  />
                  <Text style={[
                    styles.methodName,
                    paymentMethod === 'apple_pay' && styles.methodNameActive,
                  ]}>
                    Apple Pay
                  </Text>
                </View>
                <View style={[
                  styles.radio,
                  paymentMethod === 'apple_pay' && styles.radioActive,
                ]}>
                  {paymentMethod === 'apple_pay' && (
                    <View style={styles.radioDot} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Google Pay */}
          {googlePayAvailable && Platform.OS === 'android' && (
            <TouchableOpacity
              style={[
                styles.methodCard,
                paymentMethod === 'google_pay' && styles.methodCardActive,
              ]}
              onPress={() => setPaymentMethod('google_pay')}
              disabled={loading}
            >
              <View style={styles.methodHeader}>
                <View style={styles.methodLeft}>
                  <Ionicons
                    name="logo-google"
                    size={24}
                    color={paymentMethod === 'google_pay' ? AppleDesign.Colors.systemBlue : AppleDesign.Colors.label}
                  />
                  <Text style={[
                    styles.methodName,
                    paymentMethod === 'google_pay' && styles.methodNameActive,
                  ]}>
                    Google Pay
                  </Text>
                </View>
                <View style={[
                  styles.radio,
                  paymentMethod === 'google_pay' && styles.radioActive,
                ]}>
                  {paymentMethod === 'google_pay' && (
                    <View style={styles.radioDot} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Card Field (only visible for card payment) */}
        {paymentMethod === 'card' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('booking:payment.cardDetails')}</Text>
            <View style={styles.cardFieldContainer}>
              <CardField
                postalCodeEnabled={false}
                placeholders={{
                  number: '4242 4242 4242 4242',
                }}
                cardStyle={{
                  backgroundColor: AppleDesign.Colors.tertiarySystemFill,
                  textColor: AppleDesign.Colors.label,
                  placeholderColor: AppleDesign.Colors.placeholderText,
                  borderRadius: AppleDesign.BorderRadius.input,
                }}
                style={styles.cardField}
                onCardChange={(details) => {
                  setCardComplete(details.complete);
                }}
              />
            </View>
            
            <View style={styles.secureInfo}>
              <Ionicons name="lock-closed" size={16} color={AppleDesign.Colors.systemGreen} />
              <Text style={styles.secureText}>
                {t('booking:payment.securePayment')}
              </Text>
            </View>
          </View>
        )}

        {/* Terms */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            {t('booking:payment.terms')}
          </Text>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (!cardComplete && paymentMethod === 'card' || loading) && styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={(paymentMethod === 'card' && !cardComplete) || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
              <Text style={styles.payButtonText}>
                {t('booking:payment.payNow')} • {amount.toFixed(2)}€
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemGroupedBackground,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingVertical: AppleDesign.Spacing.md,
    backgroundColor: AppleDesign.Colors.systemBackground,
    borderBottomWidth: 1,
    borderBottomColor: AppleDesign.Colors.separator,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: AppleDesign.Spacing.lg,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: AppleDesign.Spacing.md,
  },
  loadingText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },

  // Amount Card
  amountCard: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    borderRadius: AppleDesign.BorderRadius.large,
    padding: AppleDesign.Spacing.xl,
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.xl,
    ...AppleDesign.Shadows.medium,
  },
  amountLabel: {
    ...AppleDesign.Typography.body,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: AppleDesign.Spacing.xs,
  },
  amountValue: {
    ...AppleDesign.Typography.largeTitle,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Section
  section: {
    marginBottom: AppleDesign.Spacing.xl,
  },
  sectionTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginBottom: AppleDesign.Spacing.md,
  },

  // Payment Method
  methodCard: {
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    padding: AppleDesign.Spacing.lg,
    marginBottom: AppleDesign.Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardActive: {
    borderColor: AppleDesign.Colors.systemBlue,
    backgroundColor: AppleDesign.Colors.systemBlueLight || 'rgba(0, 122, 255, 0.05)',
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.md,
  },
  methodName: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  methodNameActive: {
    color: AppleDesign.Colors.systemBlue,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppleDesign.Colors.systemGray4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: AppleDesign.Colors.systemBlue,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppleDesign.Colors.systemBlue,
  },

  // Card Field
  cardFieldContainer: {
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    overflow: 'hidden',
  },
  cardField: {
    height: 50,
  },
  secureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.xs,
    marginTop: AppleDesign.Spacing.md,
    justifyContent: 'center',
  },
  secureText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.systemGreen,
  },

  // Terms
  termsContainer: {
    paddingVertical: AppleDesign.Spacing.lg,
  },
  termsText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Footer
  footer: {
    padding: AppleDesign.Spacing.lg,
    backgroundColor: AppleDesign.Colors.systemBackground,
    borderTopWidth: 1,
    borderTopColor: AppleDesign.Colors.separator,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppleDesign.Spacing.sm,
    backgroundColor: AppleDesign.Colors.systemBlue,
    paddingVertical: AppleDesign.Spacing.lg,
    borderRadius: AppleDesign.BorderRadius.button,
    ...AppleDesign.Shadows.medium,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    ...AppleDesign.Typography.headline,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

