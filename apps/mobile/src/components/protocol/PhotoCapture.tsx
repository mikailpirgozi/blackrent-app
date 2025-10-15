/**
 * PhotoCapture Component
 * Camera integration for protocol photos
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AppleDesign from '../../styles/apple-design-system';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import type { ProtocolPhoto } from '../../types/protocol';

interface PhotoCaptureProps {
  photos: ProtocolPhoto[];
  onPhotosChange: (photos: ProtocolPhoto[]) => void;
  requiredTypes?: Array<'front' | 'back' | 'left' | 'right' | 'interior' | 'odometer'>;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  photos,
  onPhotosChange,
  requiredTypes = ['front', 'back', 'left', 'right', 'odometer'],
}) => {
  const { t } = useTranslation(['protocol', 'common']);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [currentPhotoType, setCurrentPhotoType] = useState<ProtocolPhoto['type']>('front');
  const cameraRef = useRef<CameraView>(null);

  // Request permissions
  const requestPermissions = async () => {
    const { status } = await requestCameraPermission();
    return status === 'granted';
  };

  // Open camera for specific photo type
  const openCamera = async (photoType: ProtocolPhoto['type']) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert(
        t('protocol:camera.permissionRequired'),
        t('protocol:camera.permissionMessage')
      );
      return;
    }

    setCurrentPhotoType(photoType);
    setShowCamera(true);
  };

  // Pick from gallery
  const pickFromGallery = async (photoType: ProtocolPhoto['type']) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      const newPhoto: ProtocolPhoto = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
        type: photoType,
        timestamp: new Date(),
      };
      onPhotosChange([...photos, newPhoto]);
    }
  };

  // Take photo
  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo) {
        const newPhoto: ProtocolPhoto = {
          id: Date.now().toString(),
          uri: photo.uri,
          type: currentPhotoType,
          timestamp: new Date(),
        };
        
        onPhotosChange([...photos, newPhoto]);
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Failed to take picture:', error);
      Alert.alert(t('common:errors.general'), t('protocol:camera.error'));
    }
  };

  // Delete photo
  const deletePhoto = (photoId: string) => {
    Alert.alert(
      t('protocol:camera.deleteTitle'),
      t('protocol:camera.deleteMessage'),
      [
        {
          text: t('common:buttons.cancel'),
          style: 'cancel',
        },
        {
          text: t('common:buttons.delete'),
          style: 'destructive',
          onPress: () => {
            onPhotosChange(photos.filter(p => p.id !== photoId));
          },
        },
      ]
    );
  };

  // Get photos by type
  const getPhotosByType = (type: ProtocolPhoto['type']) => {
    return photos.filter(p => p.type === type);
  };

  // Check if required photo type is captured
  const isTypeCaptured = (type: ProtocolPhoto['type']) => {
    return photos.some(p => p.type === type);
  };

  // Photo type labels
  const photoTypeLabels: Record<ProtocolPhoto['type'], string> = {
    front: t('protocol:photoTypes.front'),
    back: t('protocol:photoTypes.back'),
    left: t('protocol:photoTypes.left'),
    right: t('protocol:photoTypes.right'),
    interior: t('protocol:photoTypes.interior'),
    odometer: t('protocol:photoTypes.odometer'),
    damage: t('protocol:photoTypes.damage'),
    other: t('protocol:photoTypes.other'),
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
        >
          <View style={styles.cameraOverlay}>
            {/* Header */}
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCamera(false)}
              >
                <Ionicons name="close" size={30} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>
                {photoTypeLabels[currentPhotoType]}
              </Text>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => setCameraType(current => current === 'back' ? 'front' : 'back')}
              >
                <Ionicons name="camera-reverse" size={30} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Capture button */}
            <View style={styles.cameraFooter}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('protocol:camera.title')}</Text>
      <Text style={styles.subtitle}>{t('protocol:camera.subtitle')}</Text>

      <ScrollView contentContainerStyle={styles.photoTypesContainer}>
        {requiredTypes.map((type) => {
          const typePhotos = getPhotosByType(type);
          const isCaptured = isTypeCaptured(type);

          return (
            <View key={type} style={styles.photoTypeCard}>
              <View style={styles.photoTypeHeader}>
                <View style={styles.photoTypeInfo}>
                  <Text style={styles.photoTypeLabel}>
                    {photoTypeLabels[type]}
                  </Text>
                  {isCaptured && (
                    <View style={styles.capturedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color={AppleDesign.Colors.systemGreen} />
                      <Text style={styles.capturedText}>
                        {typePhotos.length}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.photoTypeActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => openCamera(type)}
                  >
                    <Ionicons name="camera" size={24} color={AppleDesign.Colors.systemBlue} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => pickFromGallery(type)}
                  >
                    <Ionicons name="images" size={24} color={AppleDesign.Colors.systemBlue} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Photo thumbnails */}
              {typePhotos.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailsContainer}
                >
                  {typePhotos.map((photo) => (
                    <View key={photo.id} style={styles.thumbnailWrapper}>
                      <Image
                        source={{ uri: photo.uri }}
                        style={styles.thumbnail}
                      />
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deletePhoto(photo.id)}
                      >
                        <Ionicons name="close-circle" size={24} color={AppleDesign.Colors.systemRed} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {t('protocol:camera.photosCount', { count: photos.length })}
        </Text>
        <Text style={styles.summarySubtext}>
          {t('protocol:camera.requiredCount', { count: requiredTypes.length })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginBottom: AppleDesign.Spacing.xs,
  },
  subtitle: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    marginBottom: AppleDesign.Spacing.lg,
  },

  // Camera
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingTop: AppleDesign.Spacing.xl,
    paddingBottom: AppleDesign.Spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    ...AppleDesign.Typography.headline,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  flipButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFooter: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },

  // Photo types
  photoTypesContainer: {
    paddingVertical: AppleDesign.Spacing.md,
  },
  photoTypeCard: {
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    padding: AppleDesign.Spacing.lg,
    marginBottom: AppleDesign.Spacing.md,
  },
  photoTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.md,
  },
  photoTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.sm,
  },
  photoTypeLabel: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  capturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  capturedText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.systemGreen,
    fontWeight: '600',
  },
  photoTypeActions: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
    borderRadius: AppleDesign.BorderRadius.button,
  },

  // Thumbnails
  thumbnailsContainer: {
    gap: AppleDesign.Spacing.sm,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: AppleDesign.BorderRadius.medium,
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },

  // Summary
  summary: {
    marginTop: AppleDesign.Spacing.xl,
    paddingVertical: AppleDesign.Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: AppleDesign.Colors.separator,
  },
  summaryText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: 4,
  },
  summarySubtext: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
  },
});

