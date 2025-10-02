/**
 * 🤖 Voice Input Component
 * Speech-to-text input for chatbot
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onClose: () => void;
  onRecordingChange?: (isRecording: boolean) => void;
  language?: string;
}

const { width, height } = Dimensions.get('window');

export function VoiceInput({ 
  onTranscript, 
  onClose, 
  onRecordingChange,
  language = 'sk' 
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Show modal animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();

    return () => {
      // Cleanup any recording
      stopRecording();
    };
  }, []);

  useEffect(() => {
    onRecordingChange?.(isRecording);
  }, [isRecording, onRecordingChange]);

  useEffect(() => {
    if (isRecording) {
      // Start pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    }
  }, [isRecording, pulseAnim]);

  /**
   * Start recording
   */
  const startRecording = async () => {
    try {
      // Request microphone permissions
      // Note: In a real app, you'd use expo-av or react-native-voice
      // For now, we'll simulate the recording process
      
      setIsRecording(true);
      setTranscript('');
      
      // Simulate recording for demo purposes
      setTimeout(() => {
        simulateVoiceRecognition();
      }, 3000);

    } catch (error) {
            Alert.alert('Chyba', 'Nepodarilo sa spustiť nahrávanie.');
    }
  };

  /**
   * Stop recording
   */
  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);

      // In a real app, you'd process the audio here
      // For demo, we'll use the simulated transcript
      
      setTimeout(() => {
        setIsProcessing(false);
        if (transcript) {
          onTranscript(transcript);
        }
      }, 1000);

    } catch (error) {
            setIsRecording(false);
      setIsProcessing(false);
    }
  };

  /**
   * Simulate voice recognition (for demo)
   */
  const simulateVoiceRecognition = () => {
    const sampleTranscripts = {
      'sk': [
        'Chcem si rezervovať auto na víkend',
        'Aké máte dostupné vozidlá v Bratislave?',
        'Koľko stojí prenájom BMW na týždeň?',
        'Potrebujem pomoc s mojou rezerváciou',
        'Kde si môžem prevziať vozidlo?'
      ],
      'cs': [
        'Chci si rezervovat auto na víkend',
        'Jaká máte dostupná vozidla v Praze?',
        'Kolik stojí pronájem BMW na týden?',
        'Potřebuji pomoc s mojí rezervací',
        'Kde si mohu převzít vozidlo?'
      ],
      'de': [
        'Ich möchte ein Auto für das Wochenende reservieren',
        'Welche Fahrzeuge haben Sie in Wien verfügbar?',
        'Was kostet die BMW-Miete für eine Woche?',
        'Ich brauche Hilfe bei meiner Reservierung',
        'Wo kann ich das Fahrzeug abholen?'
      ],
      'hu': [
        'Autót szeretnék bérelni hétvégére',
        'Milyen járművek érhetők el Budapesten?',
        'Mennyibe kerül egy BMW bérlése egy hétre?',
        'Segítségre van szükségem a foglalásommal',
        'Hol vehetem át a járművet?'
      ],
      'en': [
        'I want to rent a car for the weekend',
        'What vehicles do you have available in the city?',
        'How much does it cost to rent a BMW for a week?',
        'I need help with my reservation',
        'Where can I pick up the vehicle?'
      ]
    };

    const transcripts = sampleTranscripts[language as keyof typeof sampleTranscripts] || sampleTranscripts.sk;
    const randomTranscript = transcripts[Math.floor(Math.random() * transcripts.length)];
    
    setTranscript(randomTranscript);
    stopRecording();
  };

  /**
   * Close modal with animation
   */
  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
    });
  };

  const getStatusText = (): string => {
    if (isProcessing) {
      const processingTexts = {
        'sk': 'Spracovávam...',
        'cs': 'Zpracovávám...',
        'de': 'Verarbeitung...',
        'hu': 'Feldolgozás...',
        'en': 'Processing...'
      };
      return processingTexts[language as keyof typeof processingTexts] || processingTexts.sk;
    }

    if (isRecording) {
      const recordingTexts = {
        'sk': 'Počúvam... Hovorte teraz',
        'cs': 'Poslouchám... Mluvte nyní',
        'de': 'Ich höre... Sprechen Sie jetzt',
        'hu': 'Hallgatok... Beszéljen most',
        'en': 'Listening... Speak now'
      };
      return recordingTexts[language as keyof typeof recordingTexts] || recordingTexts.sk;
    }

    const readyTexts = {
      'sk': 'Stlačte a podržte pre nahrávanie',
      'cs': 'Stiskněte a podržte pro nahrávání',
      'de': 'Drücken und halten zum Aufnehmen',
      'hu': 'Nyomja meg és tartsa a felvételhez',
      'en': 'Press and hold to record'
    };
    return readyTexts[language as keyof typeof readyTexts] || readyTexts.sk;
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="none"
      onRequestClose={closeModal}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: fadeAnim,
        }}
      >
        <Animated.View
          style={{
            backgroundColor: theme.colors.systemBackground,
            borderRadius: 24,
            padding: 32,
            alignItems: 'center',
            width: width * 0.85,
            maxWidth: 350,
            transform: [{ scale: scaleAnim }],
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              marginBottom: 32,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: theme.colors.label,
              }}
            >
              🎤 Hlasové zadanie
            </Text>
            
            <TouchableOpacity
              onPress={closeModal}
              style={{
                padding: 4,
              }}
            >
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.secondaryLabel}
              />
            </TouchableOpacity>
          </View>

          {/* Recording button */}
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }],
              marginBottom: 24,
            }}
          >
            <TouchableOpacity
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: isRecording ? '#FF3B30' : theme.brand.primary,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={48}
                color="white"
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Status text */}
          <Text
            style={{
              fontSize: 16,
              color: theme.colors.secondaryLabel,
              textAlign: 'center',
              marginBottom: 16,
              fontWeight: '500',
            }}
          >
            {getStatusText()}
          </Text>

          {/* Transcript preview */}
          {transcript && (
            <View
              style={{
                backgroundColor: theme.colors.secondarySystemFill,
                borderRadius: 12,
                padding: 16,
                width: '100%',
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.label,
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                "{transcript}"
              </Text>
            </View>
          )}

          {/* Action buttons */}
          {transcript && !isRecording && !isProcessing && (
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                width: '100%',
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setTranscript('');
                  startRecording();
                }}
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.secondarySystemFill,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: theme.colors.secondaryLabel,
                  }}
                >
                  🔄 Znovu
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onTranscript(transcript)}
                style={{
                  flex: 1,
                  backgroundColor: theme.brand.primary,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: 'white',
                  }}
                >
                  ✓ Použiť
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
