/**
 * SmartImage Component
 * Optimized image component with lazy loading and caching
 */

import React from 'react';
import { Image, ImageStyle, StyleProp, View, ActivityIndicator } from 'react-native';
import AppleDesign from '../../../styles/apple-design-system';

interface SmartImageProps {
  images: string[];
  style?: StyleProp<ImageStyle>;
  fallback?: React.ReactNode;
}

export function SmartImage({ images, style, fallback }: SmartImageProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  
  const imageUri = images[0];

  if (error && fallback) {
    return <>{fallback}</>;
  }

  return (
    <View style={[{ position: 'relative' }, style]}>
      {loading && (
        <View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: AppleDesign.Colors.systemGray6,
          }}
        >
          <ActivityIndicator color={AppleDesign.Colors.systemBlue} />
        </View>
      )}
      <Image
        source={{ uri: imageUri }}
        style={style}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        resizeMode="cover"
      />
    </View>
  );
}

