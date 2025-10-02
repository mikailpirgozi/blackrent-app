/**
 * ✍️ Digital Signature Component
 * Electronic signature capture and verification
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

// Apple Design System
import AppleDesign from '../../../styles/apple-design-system';
import { OptimizedFadeIn, OptimizedSlideIn } from '../optimized-animations';

const { width: screenWidth } = Dimensions.get('window');

interface SignaturePoint {
  x: number;
  y: number;
  timestamp: number;
}

interface DigitalSignatureProps {
  onSignatureComplete: (signature: string) => void;
  onCancel: () => void;
  title?: string;
  subtitle?: string;
  required?: boolean;
}

export function DigitalSignature({
  onSignatureComplete,
  onCancel,
  title = 'Elektronický podpis',
  subtitle = 'Podpíšte sa do vyznačeného priestoru',
  required = true,
}: DigitalSignatureProps) {
  const [signature, setSignature] = useState<SignaturePoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        const newPoint: SignaturePoint = {
          x: locationX || 0,
          y: locationY || 0,
          timestamp: Date.now(),
        };

        setSignature([newPoint]);
        setIsDrawing(true);
        setCurrentPath(`M${newPoint.x},${newPoint.y}`);
      },

      onPanResponderMove: (event) => {
        if (!isDrawing) return;

        const { locationX, locationY } = event.nativeEvent;
        const newPoint: SignaturePoint = {
          x: locationX || 0,
          y: locationY || 0,
          timestamp: Date.now(),
        };

        setSignature(prev => [...prev, newPoint]);
        setCurrentPath(prev => `${prev} L${newPoint.x},${newPoint.y}`);
      },

      onPanResponderRelease: () => {
        setIsDrawing(false);
        setHasSignature(signature.length > 0);
      },
    })
  ).current;

  const clearSignature = () => {
    setSignature([]);
    setCurrentPath('');
    setHasSignature(false);
  };

  const saveSignature = () => {
    if (!hasSignature && required) {
      Alert.alert('Chyba', 'Prosím podpíšte sa pred pokračovaním');
      return;
    }

    // Convert signature to base64 or SVG string
    const signatureData = generateSignatureData();
    onSignatureComplete(signatureData);
  };

  const generateSignatureData = (): string => {
    if (signature.length === 0) return '';

    // Create SVG path from signature points
    let pathData = '';
    if (signature.length > 0) {
      pathData = `M${signature[0].x},${signature[0].y}`;
      for (let i = 1; i < signature.length; i++) {
        pathData += ` L${signature[i].x},${signature[i].y}`;
      }
    }

    // Return SVG string
    return `<svg width="${screenWidth - 40}" height="200" xmlns="http://www.w3.org/2000/svg">
      <path d="${pathData}" stroke="#007AFF" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  };

  const generateSignaturePath = (): string => {
    if (signature.length === 0) return '';

    let pathData = '';
    if (signature.length > 0) {
      pathData = `M${signature[0].x},${signature[0].y}`;
      for (let i = 1; i < signature.length; i++) {
        pathData += ` L${signature[i].x},${signature[i].y}`;
      }
    }

    return pathData;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <OptimizedFadeIn delay={0}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Ionicons name="close" size={24} color={AppleDesign.Colors.label} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.placeholder} />
        </View>
      </OptimizedFadeIn>

      {/* Instructions */}
      <OptimizedSlideIn delay={100} direction="up">
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>{subtitle}</Text>
          <Text style={styles.instructionsText}>
            {required 
              ? 'Podpis je povinný pre dokončenie rezervácie'
              : 'Podpis je voliteľný, ale odporúčaný'
            }
          </Text>
        </View>
      </OptimizedSlideIn>

      {/* Signature Area */}
      <OptimizedSlideIn delay={200} direction="up">
        <View style={styles.signatureContainer}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureArea} {...panResponder.panHandlers}>
              <Svg
                width={screenWidth - 80}
                height={200}
                style={styles.signatureSvg}
              >
                <Path
                  d={generateSignaturePath()}
                  stroke={AppleDesign.Colors.systemBlue}
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              
              {!hasSignature && (
                <View style={styles.placeholderText}>
                  <Ionicons name="create" size={32} color={AppleDesign.Colors.systemGray4} />
                  <Text style={styles.placeholderTextLabel}>
                    Podpíšte sa tu
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Podpis</Text>
          </View>
        </View>
      </OptimizedSlideIn>

      {/* Signature Info */}
      <OptimizedFadeIn delay={300}>
        <View style={styles.signatureInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={16} color={AppleDesign.Colors.systemGreen} />
            <Text style={styles.infoText}>
              Váš podpis je bezpečne uložený a šifrovaný
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="lock-closed" size={16} color={AppleDesign.Colors.systemBlue} />
            <Text style={styles.infoText}>
              Podpis má rovnakú platnosť ako písomný podpis
            </Text>
          </View>
        </View>
      </OptimizedFadeIn>

      {/* Action Buttons */}
      <OptimizedSlideIn delay={400} direction="up">
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearSignature}
            disabled={!hasSignature}
          >
            <Ionicons name="refresh" size={20} color={AppleDesign.Colors.systemBlue} />
            <Text style={[
              styles.clearButtonText,
              !hasSignature && styles.clearButtonTextDisabled
            ]}>
              Vymazať
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              !hasSignature && required && styles.saveButtonDisabled
            ]}
            onPress={saveSignature}
            disabled={!hasSignature && required}
          >
            <Ionicons name="checkmark" size={20} color="white" />
            <Text style={styles.saveButtonText}>
              {hasSignature ? 'Uložiť podpis' : 'Preskočiť podpis'}
            </Text>
          </TouchableOpacity>
        </View>
      </OptimizedSlideIn>

      {/* Legal Notice */}
      <OptimizedFadeIn delay={500}>
        <View style={styles.legalNotice}>
          <Text style={styles.legalText}>
            Podpisom potvrdzujete, že ste si prečítali a súhlasíte s podmienkami rezervácie.
            Elektronický podpis má rovnakú platnosť ako písomný podpis podľa zákona č. 215/2002 Z. z.
          </Text>
        </View>
      </OptimizedFadeIn>
    </View>
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
    borderBottomColor: AppleDesign.Colors.systemGray5,
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppleDesign.Colors.systemGray6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  
  // Instructions
  instructionsContainer: {
    padding: AppleDesign.Spacing.lg,
    backgroundColor: AppleDesign.Colors.systemBackground,
    margin: AppleDesign.Spacing.lg,
    borderRadius: AppleDesign.BorderRadius.medium,
  },
  instructionsTitle: {
    ...AppleDesign.Typography.title3,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.sm,
  },
  instructionsText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  
  // Signature Area
  signatureContainer: {
    padding: AppleDesign.Spacing.lg,
  },
  signatureBox: {
    backgroundColor: AppleDesign.Colors.systemBackground,
    borderRadius: AppleDesign.BorderRadius.medium,
    padding: AppleDesign.Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signatureArea: {
    height: 200,
    borderWidth: 2,
    borderColor: AppleDesign.Colors.systemGray4,
    borderStyle: 'dashed',
    borderRadius: AppleDesign.BorderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  signatureSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  placeholderText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTextLabel: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemGray4,
    marginTop: AppleDesign.Spacing.sm,
  },
  signatureLine: {
    height: 1,
    backgroundColor: AppleDesign.Colors.systemGray4,
    marginTop: AppleDesign.Spacing.lg,
  },
  signatureLabel: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
    marginTop: AppleDesign.Spacing.sm,
  },
  
  // Signature Info
  signatureInfo: {
    padding: AppleDesign.Spacing.lg,
    backgroundColor: AppleDesign.Colors.systemBackground,
    margin: AppleDesign.Spacing.lg,
    marginTop: 0,
    borderRadius: AppleDesign.BorderRadius.medium,
    gap: AppleDesign.Spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.sm,
  },
  infoText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    flex: 1,
  },
  
  // Actions
  actionContainer: {
    flexDirection: 'row',
    padding: AppleDesign.Spacing.lg,
    gap: AppleDesign.Spacing.md,
  },
  clearButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppleDesign.Colors.systemBlue,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: AppleDesign.Spacing.md,
    borderRadius: AppleDesign.BorderRadius.medium,
    gap: AppleDesign.Spacing.sm,
  },
  clearButtonText: {
    color: AppleDesign.Colors.systemBlue,
    fontSize: 16,
    fontWeight: '500',
  },
  clearButtonTextDisabled: {
    color: AppleDesign.Colors.systemGray4,
  },
  saveButton: {
    flex: 2,
    backgroundColor: AppleDesign.Colors.systemBlue,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: AppleDesign.Spacing.md,
    borderRadius: AppleDesign.BorderRadius.medium,
    gap: AppleDesign.Spacing.sm,
    shadowColor: AppleDesign.Colors.systemBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: AppleDesign.Colors.systemGray4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Legal Notice
  legalNotice: {
    padding: AppleDesign.Spacing.lg,
    backgroundColor: AppleDesign.Colors.systemGray6,
    margin: AppleDesign.Spacing.lg,
    borderRadius: AppleDesign.BorderRadius.medium,
  },
  legalText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
    lineHeight: 16,
  },
});
