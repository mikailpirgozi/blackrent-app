/**
 * SignaturePad Component
 * Digital signature capture with SVG paths
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import AppleDesign from '../../styles/apple-design-system';
import { useTranslation } from '../../i18n/hooks/useTranslation';

interface SignaturePadProps {
  onSignatureCapture: (signature: string) => void;
  signatureDataUrl?: string;
  title?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSignatureCapture,
  signatureDataUrl,
  title,
}) => {
  const { t } = useTranslation(['protocol', 'common']);
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const signatureRef = useRef<View>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(`M${locationX},${locationY}`);
      },
      
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath((prevPath) => `${prevPath} L${locationX},${locationY}`);
      },
      
      onPanResponderRelease: () => {
        if (currentPath) {
          setPaths((prevPaths) => [...prevPaths, currentPath]);
          setCurrentPath('');
        }
      },
    })
  ).current;

  const clearSignature = () => {
    setPaths([]);
    setCurrentPath('');
  };

  const captureSignature = async () => {
    if (signatureRef.current && (paths.length > 0 || currentPath)) {
      try {
        const uri = await captureRef(signatureRef, {
          format: 'png',
          quality: 1,
          result: 'data-uri',
        });
        onSignatureCapture(uri);
      } catch (error) {
        console.error('Failed to capture signature:', error);
      }
    }
  };

  const hasSignature = paths.length > 0 || currentPath.length > 0;

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={styles.signatureContainer}>
        <View
          ref={signatureRef}
          style={styles.signaturePad}
          {...panResponder.panHandlers}
        >
          <Svg style={styles.svg}>
            {/* Render all completed paths */}
            {paths.map((path, index) => (
              <Path
                key={`path-${index}`}
                d={path}
                stroke={AppleDesign.Colors.label}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {/* Render current drawing path */}
            {currentPath && (
              <Path
                d={currentPath}
                stroke={AppleDesign.Colors.label}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>
          
          {!hasSignature && (
            <View style={styles.placeholder}>
              <Ionicons
                name="create-outline"
                size={40}
                color={AppleDesign.Colors.tertiaryLabel}
              />
              <Text style={styles.placeholderText}>
                {t('protocol:signature.placeholder')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.signatureLine} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearSignature}
          disabled={!hasSignature}
        >
          <Ionicons name="trash-outline" size={20} color={AppleDesign.Colors.systemRed} />
          <Text style={[styles.buttonText, styles.clearButtonText]}>
            {t('protocol:signature.clear')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.confirmButton,
            !hasSignature && styles.buttonDisabled,
          ]}
          onPress={captureSignature}
          disabled={!hasSignature}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
          <Text style={[styles.buttonText, styles.confirmButtonText]}>
            {t('protocol:signature.confirm')}
          </Text>
        </TouchableOpacity>
      </View>

      {signatureDataUrl && (
        <View style={styles.savedSignature}>
          <Ionicons name="checkmark-circle" size={20} color={AppleDesign.Colors.systemGreen} />
          <Text style={styles.savedText}>{t('protocol:signature.saved')}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.md,
  },
  signatureContainer: {
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    overflow: 'hidden',
    marginBottom: AppleDesign.Spacing.md,
  },
  signaturePad: {
    height: 200,
    backgroundColor: AppleDesign.Colors.systemBackground,
    position: 'relative',
  },
  svg: {
    flex: 1,
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: AppleDesign.Spacing.sm,
    pointerEvents: 'none',
  },
  placeholderText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.tertiaryLabel,
    textAlign: 'center',
  },
  signatureLine: {
    height: 1,
    backgroundColor: AppleDesign.Colors.separator,
    marginHorizontal: AppleDesign.Spacing.xl,
    marginBottom: AppleDesign.Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppleDesign.Spacing.xs,
    paddingVertical: AppleDesign.Spacing.md,
    borderRadius: AppleDesign.BorderRadius.button,
  },
  clearButton: {
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
  },
  confirmButton: {
    backgroundColor: AppleDesign.Colors.systemBlue,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...AppleDesign.Typography.body,
    fontWeight: '600',
  },
  clearButtonText: {
    color: AppleDesign.Colors.systemRed,
  },
  confirmButtonText: {
    color: '#FFFFFF',
  },
  savedSignature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.xs,
    marginTop: AppleDesign.Spacing.md,
    padding: AppleDesign.Spacing.md,
    backgroundColor: AppleDesign.Colors.systemGreenLight || 'rgba(52, 199, 89, 0.1)',
    borderRadius: AppleDesign.BorderRadius.medium,
  },
  savedText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemGreen,
    fontWeight: '600',
  },
});

