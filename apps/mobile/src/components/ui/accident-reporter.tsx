import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Button } from './button';
import { SmartImage } from './smart-image/smart-image';
// Simple mock translation for emergency components
const useTranslation = () => ({
  t: (key: string, fallback?: string) => fallback || key.split('.').pop() || key
});
import { Modal } from './modal';

interface AccidentPhoto {
  id: string;
  uri: string;
  type: 'damage' | 'scene' | 'documents' | 'other';
  description?: string;
}

interface AccidentReport {
  id: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  description: string;
  photos: AccidentPhoto[];
  severity: 'minor' | 'major' | 'critical';
  emergencyServicesCalled: boolean;
  vehicleId: string;
  bookingId: string;
}

interface AccidentReporterProps {
  isVisible: boolean;
  onClose: () => void;
  vehicleId?: string;
  bookingId?: string;
  onReportSubmit?: (report: AccidentReport) => void;
}

export function AccidentReporter({
  isVisible,
  onClose,
  vehicleId = '',
  bookingId = '',
  onReportSubmit
}: AccidentReporterProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'details' | 'photos' | 'review'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'minor' | 'major' | 'critical'>('minor');
  const [emergencyServicesCalled, setEmergencyServicesCalled] = useState(false);
  const [photos, setPhotos] = useState<AccidentPhoto[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);

  React.useEffect(() => {
    if (isVisible) {
      getCurrentLocation();
    }
  }, [isVisible]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('location.permissionDenied', 'Povolenie zamietnuté'),
          t('location.permissionMessage', 'Potrebujeme prístup k lokácii pre nahlásenie nehody.')
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
    } catch {
      //     }
  };

  const addPhoto = async (type: AccidentPhoto['type']) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('camera.permissionDenied', 'Povolenie zamietnuté'),
          t('camera.permissionMessage', 'Potrebujeme prístup k fotoaparátu a galérii.')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto: AccidentPhoto = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          type,
        };
        setPhotos(prev => [...prev, newPhoto]);
      }
    } catch {
      //       Alert.alert(
        t('error.title', 'Chyba'),
        t('error.photoSelection', 'Nepodarilo sa vybrať fotku.')
      );
    }
  };

  const takePhoto = async (type: AccidentPhoto['type']) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('camera.permissionDenied', 'Povolenie zamietnuté'),
          t('camera.permissionMessage', 'Potrebujeme prístup k fotoaparátu.')
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto: AccidentPhoto = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          type,
        };
        setPhotos(prev => [...prev, newPhoto]);
      }
    } catch {
      //       Alert.alert(
        t('error.title', 'Chyba'),
        t('error.photoCapture', 'Nepodarilo sa odfotiť.')
      );
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const submitReport = async () => {
    if (!description.trim()) {
      Alert.alert(
        t('validation.required', 'Povinné pole'),
        t('accident.descriptionRequired', 'Prosím popíšte čo sa stalo.')
      );
      return;
    }

    if (!currentLocation) {
      Alert.alert(
        t('location.required', 'Lokácia potrebná'),
        t('accident.locationRequired', 'Potrebujeme vašu aktuálnu lokáciu.')
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const report: AccidentReport = {
        id: Date.now().toString(),
        timestamp: new Date(),
        location: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        description: description.trim(),
        photos,
        severity,
        emergencyServicesCalled,
        vehicleId,
        bookingId,
      };

      onReportSubmit?.(report);
      
      Alert.alert(
        t('accident.reportSubmitted', 'Hlásenie odoslané'),
        t('accident.reportSubmittedMessage', 'Vaše hlásenie nehody bolo úspešne odoslané. Budeme vás kontaktovať čo najskôr.'),
        [{ text: t('common.ok', 'OK'), onPress: onClose }]
      );
      
      // Reset form
      setDescription('');
      setSeverity('minor');
      setEmergencyServicesCalled(false);
      setPhotos([]);
      setStep('details');
      
    } catch {
      //       Alert.alert(
        t('error.title', 'Chyba'),
        t('accident.submitError', 'Nepodarilo sa odoslať hlásenie. Skúste to znovu.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDetailsStep = () => (
    <ScrollView className="flex-1 p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-6">
        {t('accident.reportTitle', 'Nahlásenie nehody')}
      </Text>

      {/* Severity Selection */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-900 mb-3">
          {t('accident.severity', 'Závažnosť nehody')}
        </Text>
        <View className="space-y-2">
          {[
            { key: 'minor', label: t('accident.minor', 'Menšia škoda'), color: 'bg-yellow-100 border-yellow-300' },
            { key: 'major', label: t('accident.major', 'Väčšia škoda'), color: 'bg-orange-100 border-orange-300' },
            { key: 'critical', label: t('accident.critical', 'Kritická nehoda'), color: 'bg-red-100 border-red-300' },
          ].map(({ key, label, color }) => (
            <Button
              key={key}
              variant={severity === key ? 'default' : 'outline'}
              onPress={() => setSeverity(key as any)}
              className={severity === key ? '' : color}
            >
              <Text className={severity === key ? 'text-white' : 'text-gray-700'}>
                {label}
              </Text>
            </Button>
          ))}
        </View>
      </View>

      {/* Emergency Services */}
      <View className="mb-6">
        <Button
          variant={emergencyServicesCalled ? 'default' : 'outline'}
          onPress={() => setEmergencyServicesCalled(!emergencyServicesCalled)}
          className="flex-row items-center justify-between"
        >
          <Text className={emergencyServicesCalled ? 'text-white' : 'text-gray-700'}>
            {t('accident.emergencyServices', 'Záchranné služby privolané')}
          </Text>
          <Ionicons 
            name={emergencyServicesCalled ? 'checkmark-circle' : 'ellipse-outline'} 
            size={24} 
            color={emergencyServicesCalled ? 'white' : '#6B7280'} 
          />
        </Button>
      </View>

      {/* Description */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-900 mb-3">
          {t('accident.description', 'Popis nehody')}
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t('accident.descriptionPlaceholder', 'Popíšte čo sa stalo, kedy a kde...')}
          multiline
          numberOfLines={4}
          className="border border-gray-300 rounded-lg p-3 text-gray-900 bg-white"
          textAlignVertical="top"
        />
      </View>

      <Button onPress={() => setStep('photos')}>
        <Text className="text-white font-semibold">
          {t('common.next', 'Ďalej')}
        </Text>
      </Button>
    </ScrollView>
  );

  const renderPhotosStep = () => (
    <ScrollView className="flex-1 p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-6">
        {t('accident.photos', 'Fotky nehody')}
      </Text>

      {/* Photo Categories */}
      <View className="space-y-4 mb-6">
        {[
          { key: 'damage', label: t('accident.damage', 'Škoda na vozidle'), icon: 'car' },
          { key: 'scene', label: t('accident.scene', 'Miesto nehody'), icon: 'location' },
          { key: 'documents', label: t('accident.documents', 'Dokumenty'), icon: 'document-text' },
          { key: 'other', label: t('accident.other', 'Ostatné'), icon: 'camera' },
        ].map(({ key, label, icon }) => (
          <View key={key} className="bg-white rounded-lg p-4 border border-gray-200">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Ionicons name={icon as any} size={24} color="#6B7280" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">
                  {label}
                </Text>
              </View>
              <Text className="text-sm text-gray-500">
                {photos.filter(p => p.type === key).length} fotiek
              </Text>
            </View>
            
            <View className="flex-row space-x-2">
              <Button
                variant="outline"
                onPress={() => takePhoto(key as any)}
                className="flex-1"
              >
                <Ionicons name="camera" size={20} color="#6B7280" />
                <Text className="text-gray-700 ml-2">
                  {t('common.takePhoto', 'Odfotiť')}
                </Text>
              </Button>
              <Button
                variant="outline"
                onPress={() => addPhoto(key as any)}
                className="flex-1"
              >
                <Ionicons name="images" size={20} color="#6B7280" />
                <Text className="text-gray-700 ml-2">
                  {t('common.selectPhoto', 'Vybrať')}
                </Text>
              </Button>
            </View>
          </View>
        ))}
      </View>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            {t('accident.selectedPhotos', 'Vybrané fotky')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {photos.map((photo) => (
              <View key={photo.id} className="relative">
                <SmartImage
                  images={[photo.uri]}
                  style={{ width: 80, height: 80, borderRadius: 8 }}
                />
                <Button
                  onPress={() => removePhoto(photo.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 items-center justify-center"
                >
                  <Ionicons name="close" size={16} color="white" />
                </Button>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className="flex-row space-x-3">
        <Button
          variant="outline"
          onPress={() => setStep('details')}
          className="flex-1"
        >
          <Text className="text-gray-700">
            {t('common.back', 'Späť')}
          </Text>
        </Button>
        <Button
          onPress={() => setStep('review')}
          className="flex-1"
        >
          <Text className="text-white font-semibold">
            {t('common.next', 'Ďalej')}
          </Text>
        </Button>
      </View>
    </ScrollView>
  );

  const renderReviewStep = () => (
    <ScrollView className="flex-1 p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-6">
        {t('accident.review', 'Kontrola hlásenia')}
      </Text>

      {/* Summary */}
      <View className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
        <View className="space-y-3">
          <View>
            <Text className="text-sm text-gray-500">
              {t('accident.severity', 'Závažnosť')}
            </Text>
            <Text className="text-lg font-semibold text-gray-900">
              {severity === 'minor' && t('accident.minor', 'Menšia škoda')}
              {severity === 'major' && t('accident.major', 'Väčšia škoda')}
              {severity === 'critical' && t('accident.critical', 'Kritická nehoda')}
            </Text>
          </View>
          
          <View>
            <Text className="text-sm text-gray-500">
              {t('accident.emergencyServices', 'Záchranné služby')}
            </Text>
            <Text className="text-lg font-semibold text-gray-900">
              {emergencyServicesCalled 
                ? t('common.yes', 'Áno') 
                : t('common.no', 'Nie')
              }
            </Text>
          </View>
          
          <View>
            <Text className="text-sm text-gray-500">
              {t('accident.photos', 'Fotky')}
            </Text>
            <Text className="text-lg font-semibold text-gray-900">
              {photos.length} {t('accident.photosCount', 'fotiek')}
            </Text>
          </View>
          
          <View>
            <Text className="text-sm text-gray-500">
              {t('accident.description', 'Popis')}
            </Text>
            <Text className="text-gray-900">
              {description}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row space-x-3">
        <Button
          variant="outline"
          onPress={() => setStep('photos')}
          className="flex-1"
        >
          <Text className="text-gray-700">
            {t('common.back', 'Späť')}
          </Text>
        </Button>
        <Button
          onPress={submitReport}
          disabled={isSubmitting}
          className="flex-1"
        >
          <Text className="text-white font-semibold">
            {isSubmitting 
              ? t('common.submitting', 'Odosiela sa...') 
              : t('accident.submit', 'Odoslať hlásenie')
            }
          </Text>
        </Button>
      </View>
    </ScrollView>
  );

  return (
    <Modal isVisible={isVisible} onClose={onClose}>
      <View className="bg-white rounded-t-3xl flex-1 mt-16">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <Button
            variant="ghost"
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </Button>
          
          {/* Step Indicator */}
          <View className="flex-row space-x-2">
            {['details', 'photos', 'review'].map((stepName) => (
              <View
                key={stepName}
                className={`w-3 h-3 rounded-full ${
                  step === stepName ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </View>
          
          <View className="w-6" />
        </View>

        {/* Content */}
        {step === 'details' && renderDetailsStep()}
        {step === 'photos' && renderPhotosStep()}
        {step === 'review' && renderReviewStep()}
      </View>
    </Modal>
  );
}
