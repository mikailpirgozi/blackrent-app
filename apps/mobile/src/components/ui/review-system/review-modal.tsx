/**
 * 🌟 Review Modal Component
 * Advanced review system with photos, ratings, and moderation
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

// Apple Design System
import AppleDesign from '../../../styles/apple-design-system';
import { useTranslation } from '../../../hooks/use-translation';

const { width: screenWidth } = Dimensions.get('window');

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (review: ReviewData) => void;
  vehicleId: string;
  vehicleName: string;
  bookingId?: string;
}

export interface ReviewData {
  vehicleId: string;
  bookingId?: string;
  ratings: {
    cleanliness: number;
    condition: number;
    service: number;
    communication: number;
    overall: number;
  };
  comment: string;
  photos: string[];
  wouldRecommend: boolean;
}

const RATING_CRITERIA = [
  { key: 'cleanliness', label: 'Čistota vozidla', icon: 'sparkles' },
  { key: 'condition', label: 'Technický stav', icon: 'build' },
  { key: 'service', label: 'Kvalita služieb', icon: 'people' },
  { key: 'communication', label: 'Komunikácia', icon: 'chatbubbles' },
  { key: 'overall', label: 'Celková spokojnosť', icon: 'star' },
] as const;

export function ReviewModal({
  visible,
  onClose,
  onSubmit,
  vehicleId,
  vehicleName,
  bookingId,
}: ReviewModalProps) {
  const { t } = useTranslation();
  const [ratings, setRatings] = useState({
    cleanliness: 0,
    condition: 0,
    service: 0,
    communication: 0,
    overall: 0,
  });
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingChange = (criterion: keyof typeof ratings, rating: number) => {
    setRatings(prev => ({ ...prev, [criterion]: rating }));
  };

  const handleAddPhoto = async () => {
    if (photos.length >= 5) {
      Alert.alert('Limit fotiek', 'Môžete pridať maximálne 5 fotiek.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Povolenie potrebné', 'Potrebujeme prístup k vašim fotkám.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    const hasAllRatings = Object.values(ratings).every(rating => rating > 0);
    if (!hasAllRatings) {
      Alert.alert('Chýbajúce hodnotenie', 'Prosím ohodnoťte všetky kritériá.');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Krátky komentár', 'Komentár musí mať aspoň 10 znakov.');
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData: ReviewData = {
        vehicleId,
        bookingId,
        ratings,
        comment: comment.trim(),
        photos,
        wouldRecommend,
      };

      await onSubmit(reviewData);
      
      // Reset form
      setRatings({
        cleanliness: 0,
        condition: 0,
        service: 0,
        communication: 0,
        overall: 0,
      });
      setComment('');
      setPhotos([]);
      setWouldRecommend(true);
      
      onClose();
      Alert.alert('Ďakujeme!', 'Vaša recenzia bola úspešne odoslaná.');
    } catch (error) {
      Alert.alert('Chyba', 'Nepodarilo sa odoslať recenziu. Skúste to znovu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (criterion: keyof typeof ratings, currentRating: number) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRatingChange(criterion, star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= currentRating ? 'star' : 'star-outline'}
              size={28}
              color={star <= currentRating ? AppleDesign.Colors.systemYellow : AppleDesign.Colors.systemGray3}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Zrušiť</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Ohodnotiť vozidlo</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          >
            <Text style={[styles.submitButtonText, isSubmitting && styles.submitButtonTextDisabled]}>
              {isSubmitting ? 'Odosielam...' : 'Odoslať'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Vehicle Info */}
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>{vehicleName}</Text>
            <Text style={styles.vehicleSubtitle}>Ako ste spokojní s prenájmom?</Text>
          </View>

          {/* Rating Criteria */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hodnotenie</Text>
            {RATING_CRITERIA.map((criterion) => (
              <View key={criterion.key} style={styles.criterionContainer}>
                <View style={styles.criterionHeader}>
                  <Ionicons
                    name={criterion.icon as any}
                    size={20}
                    color={AppleDesign.Colors.systemBlue}
                  />
                  <Text style={styles.criterionLabel}>{criterion.label}</Text>
                </View>
                {renderStarRating(criterion.key as keyof typeof ratings, ratings[criterion.key as keyof typeof ratings])}
              </View>
            ))}
          </View>

          {/* Comment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Váš komentár</Text>
            <TextInput
              style={styles.commentInput}
              multiline
              numberOfLines={4}
              placeholder="Popíšte svoju skúsenosť s prenájmom..."
              placeholderTextColor={AppleDesign.Colors.placeholderText}
              value={comment}
              onChangeText={setComment}
              maxLength={500}
            />
            <Text style={styles.characterCount}>{comment.length}/500</Text>
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fotky z prenájmu (voliteľné)</Text>
            <Text style={styles.sectionSubtitle}>Pridajte až 5 fotiek</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={AppleDesign.Colors.systemRed} />
                  </TouchableOpacity>
                </View>
              ))}
              
              {photos.length < 5 && (
                <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                  <Ionicons name="camera" size={32} color={AppleDesign.Colors.systemGray} />
                  <Text style={styles.addPhotoText}>Pridať fotku</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Recommendation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Odporúčanie</Text>
            <View style={styles.recommendationContainer}>
              <TouchableOpacity
                style={[styles.recommendationButton, wouldRecommend && styles.recommendationButtonActive]}
                onPress={() => setWouldRecommend(true)}
              >
                <Ionicons
                  name="thumbs-up"
                  size={20}
                  color={wouldRecommend ? 'white' : AppleDesign.Colors.systemGreen}
                />
                <Text style={[styles.recommendationText, wouldRecommend && styles.recommendationTextActive]}>
                  Odporúčam
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.recommendationButton, !wouldRecommend && styles.recommendationButtonActive]}
                onPress={() => setWouldRecommend(false)}
              >
                <Ionicons
                  name="thumbs-down"
                  size={20}
                  color={!wouldRecommend ? 'white' : AppleDesign.Colors.systemRed}
                />
                <Text style={[styles.recommendationText, !wouldRecommend && styles.recommendationTextActive]}>
                  Neodporúčam
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppleDesign.Colors.separator,
  },
  closeButton: {
    paddingVertical: AppleDesign.Spacing.xs,
  },
  closeButtonText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
  },
  title: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  submitButton: {
    paddingVertical: AppleDesign.Spacing.xs,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: AppleDesign.Colors.systemGray,
  },
  content: {
    flex: 1,
  },
  vehicleInfo: {
    padding: AppleDesign.Spacing.lg,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppleDesign.Colors.separator,
  },
  vehicleName: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.xs,
  },
  vehicleSubtitle: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  section: {
    padding: AppleDesign.Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppleDesign.Colors.separator,
  },
  sectionTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.md,
  },
  sectionSubtitle: {
    ...AppleDesign.Typography.footnote,
    color: AppleDesign.Colors.secondaryLabel,
    marginBottom: AppleDesign.Spacing.md,
  },
  criterionContainer: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  criterionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.sm,
  },
  criterionLabel: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    marginLeft: AppleDesign.Spacing.sm,
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    padding: AppleDesign.Spacing.xs,
  },
  commentInput: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    backgroundColor: AppleDesign.Colors.systemGray6,
    borderRadius: AppleDesign.BorderRadius.md,
    padding: AppleDesign.Spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    ...AppleDesign.Typography.caption2,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'right',
    marginTop: AppleDesign.Spacing.xs,
  },
  photosContainer: {
    flexDirection: 'row',
  },
  photoContainer: {
    position: 'relative',
    marginRight: AppleDesign.Spacing.md,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: AppleDesign.BorderRadius.md,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: AppleDesign.Colors.systemBackground,
    borderRadius: 12,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    backgroundColor: AppleDesign.Colors.systemGray6,
    borderRadius: AppleDesign.BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: AppleDesign.Colors.systemGray4,
    borderStyle: 'dashed',
  },
  addPhotoText: {
    ...AppleDesign.Typography.caption2,
    color: AppleDesign.Colors.systemGray,
    marginTop: AppleDesign.Spacing.xs,
    textAlign: 'center',
  },
  recommendationContainer: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.md,
  },
  recommendationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: AppleDesign.Spacing.md,
    borderRadius: AppleDesign.BorderRadius.md,
    borderWidth: 1,
    borderColor: AppleDesign.Colors.systemGray4,
    backgroundColor: AppleDesign.Colors.systemBackground,
  },
  recommendationButtonActive: {
    backgroundColor: AppleDesign.Colors.systemGreen,
    borderColor: AppleDesign.Colors.systemGreen,
  },
  recommendationText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    marginLeft: AppleDesign.Spacing.sm,
    fontWeight: '500',
  },
  recommendationTextActive: {
    color: 'white',
  },
});
