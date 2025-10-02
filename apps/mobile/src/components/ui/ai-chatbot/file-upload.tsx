/**
 * 🤖 File Upload Component
 * Handle file uploads for chatbot
 */

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { theme } from '../../../styles/theme';

interface FileUploadProps {
  onFileSelected: (file: {
    id: string;
    type: 'image' | 'document';
    url: string;
    name: string;
    size: number;
    mimeType: string;
  }) => void;
  maxSize?: number; // in MB
  allowedTypes?: ('image' | 'document')[];
}

export function FileUpload({ 
  onFileSelected, 
  maxSize = 10,
  allowedTypes = ['image', 'document']
}: FileUploadProps) {

  /**
   * Handle image selection
   */
  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Povolenie potrebné',
          'Pre zdieľanie obrázkov potrebujeme prístup k vašej galérii.'
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
        const asset = result.assets[0];
        
        // Check file size
        const fileSizeMB = (asset.fileSize || 0) / (1024 * 1024);
        if (fileSizeMB > maxSize) {
          Alert.alert(
            'Súbor je príliš veľký',
            `Maximálna veľkosť súboru je ${maxSize} MB. Váš súbor má ${fileSizeMB.toFixed(1)} MB.`
          );
          return;
        }

        const file = {
          id: `img_${Date.now()}`,
          type: 'image' as const,
          url: asset.uri,
          name: `image_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
          mimeType: 'image/jpeg'
        };

        onFileSelected(file);
      }
    } catch (error) {
            Alert.alert('Chyba', 'Nepodarilo sa vybrať obrázok.');
    }
  };

  /**
   * Handle document selection
   */
  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size
        const fileSizeMB = (asset.size || 0) / (1024 * 1024);
        if (fileSizeMB > maxSize) {
          Alert.alert(
            'Súbor je príliš veľký',
            `Maximálna veľkosť súboru je ${maxSize} MB. Váš súbor má ${fileSizeMB.toFixed(1)} MB.`
          );
          return;
        }

        const file = {
          id: `doc_${Date.now()}`,
          type: 'document' as const,
          url: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          mimeType: asset.mimeType || 'application/octet-stream'
        };

        onFileSelected(file);
      }
    } catch (error) {
            Alert.alert('Chyba', 'Nepodarilo sa vybrať dokument.');
    }
  };

  /**
   * Show file selection options
   */
  const showFileOptions = () => {
    const _options = [];
    
    if (allowedTypes.includes('image')) {
      options.push({ text: '📷 Obrázok', onPress: handleImagePicker });
    }
    
    if (allowedTypes.includes('document')) {
      options.push({ text: '📄 Dokument', onPress: handleDocumentPicker });
    }

    Alert.alert(
      'Priložiť súbor',
      'Vyberte typ súboru',
      [
        { text: 'Zrušiť', style: 'cancel' },
        ...options
      ]
    );
  };

  return (
    <TouchableOpacity
      onPress={showFileOptions}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.secondarySystemFill,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginVertical: 8,
      }}
      activeOpacity={0.7}
    >
      <Ionicons
        name="attach"
        size={20}
        color={theme.brand.primary}
      />
      <Text
        style={{
          marginLeft: 8,
          fontSize: 16,
          color: theme.brand.primary,
          fontWeight: '500',
        }}
      >
        Priložiť súbor
      </Text>
    </TouchableOpacity>
  );
}
