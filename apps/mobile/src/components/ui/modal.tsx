import React from 'react';
import { Modal as RNModal, View, Pressable, StatusBar } from 'react-native';
// Temporarily disabled Reanimated - using simple View instead
const Animated = { View };

interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: 'slide' | 'fade';
  transparent?: boolean;
  className?: string;
}

export function Modal({
  isVisible,
  onClose,
  children,
  animationType = 'slide',
  transparent = true,
  className = '',
}: ModalProps) {
  return (
    <RNModal
      visible={isVisible}
      transparent={transparent}
      animationType="none" // We'll handle animations with Reanimated
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
      
      {/* Backdrop */}
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        
        {/* Modal Content */}
        <View className={`bg-white ${className}`}>
          {children}
        </View>
      </View>
    </RNModal>
  );
}
