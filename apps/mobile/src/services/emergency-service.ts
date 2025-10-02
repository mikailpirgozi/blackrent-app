import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  type: 'police' | 'medical' | 'fire' | 'roadside' | 'blackrent' | 'personal';
  priority: number;
}

export interface EmergencyAlert {
  id: string;
  type: 'accident' | 'breakdown' | 'panic' | 'medical' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  userId: string;
  vehicleId?: string;
  bookingId?: string;
  description?: string;
  photos?: string[];
  status: 'active' | 'dispatched' | 'resolved' | 'false_alarm';
  responseTime?: Date;
  resolvedTime?: Date;
}

export interface EmergencyResponse {
  alertId: string;
  responderType: 'police' | 'medical' | 'fire' | 'roadside' | 'blackrent';
  estimatedArrival: Date;
  contactNumber: string;
  instructions: string;
}

class EmergencyService {
  private static instance: EmergencyService;
  private activeAlerts: Map<string, EmergencyAlert> = new Map();
  private emergencyContacts: EmergencyContact[] = [
    {
      id: 'police-sk',
      name: 'Polícia SR',
      phone: '158',
      type: 'police',
      priority: 1
    },
    {
      id: 'medical-sk',
      name: 'Záchranná služba',
      phone: '155',
      type: 'medical',
      priority: 1
    },
    {
      id: 'fire-sk',
      name: 'Hasiči',
      phone: '150',
      type: 'fire',
      priority: 1
    },
    {
      id: 'emergency-sk',
      name: 'Jednotné číslo tiesne',
      phone: '112',
      type: 'medical',
      priority: 0
    },
    {
      id: 'blackrent-support',
      name: 'BlackRent 24/7 Podpora',
      phone: '+421 911 000 000',
      type: 'blackrent',
      priority: 2
    },
    {
      id: 'roadside-assistance',
      name: 'Odťahová služba',
      phone: '+421 911 111 111',
      type: 'roadside',
      priority: 3
    }
  ];

  public static getInstance(): EmergencyService {
    if (!EmergencyService.instance) {
      EmergencyService.instance = new EmergencyService();
    }
    return EmergencyService.instance;
  }

  /**
   * Create and dispatch emergency alert
   */
  async createEmergencyAlert(
    type: EmergencyAlert['type'],
    severity: EmergencyAlert['severity'],
    userId: string,
    options: {
      vehicleId?: string;
      bookingId?: string;
      description?: string;
      photos?: string[];
      autoDispatch?: boolean;
    } = {}
  ): Promise<EmergencyAlert> {
    try {
      // Get current location
      const location = await this.getCurrentLocation();
      
      // Create alert
      const alert: EmergencyAlert = {
        id: `emergency_${Date.now()}`,
        type,
        severity,
        timestamp: new Date(),
        location,
        userId,
        vehicleId: options.vehicleId,
        bookingId: options.bookingId,
        description: options.description,
        photos: options.photos,
        status: 'active'
      };

      // Store alert
      this.activeAlerts.set(alert.id, alert);

      // Auto-dispatch for critical alerts
      if (severity === 'critical' || options.autoDispatch) {
        await this.dispatchEmergencyServices(alert);
      }

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Log alert (in production, send to backend)
      
      return alert;
    } catch (error) {
            throw new Error('Failed to create emergency alert');
    }
  }

  /**
   * Dispatch appropriate emergency services
   */
  private async dispatchEmergencyServices(alert: EmergencyAlert): Promise<void> {
    const _contacts = this.getRelevantContacts(alert.type, alert.severity);
    
    // Update alert status
    alert.status = 'dispatched';
    alert.responseTime = new Date();
    this.activeAlerts.set(alert.id, alert);

    // In production, this would call backend API to dispatch services
    // For now, we'll just log and prepare contact information
        
    // Send alert to BlackRent support immediately
    await this.notifyBlackRentSupport(alert);
  }

  /**
   * Get relevant emergency contacts based on alert type and severity
   */
  private getRelevantContacts(
    type: EmergencyAlert['type'], 
    severity: EmergencyAlert['severity']
  ): EmergencyContact[] {
    const contacts: EmergencyContact[] = [];

    // Always include BlackRent support
    contacts.push(...this.emergencyContacts.filter(c => c.type === 'blackrent'));

    switch (type) {
      case 'accident':
        if (severity === 'critical' || severity === 'high') {
          contacts.push(...this.emergencyContacts.filter(c => 
            c.type === 'medical' || c.type === 'police'
          ));
        }
        contacts.push(...this.emergencyContacts.filter(c => c.type === 'roadside'));
        break;

      case 'medical':
        contacts.push(...this.emergencyContacts.filter(c => c.type === 'medical'));
        break;

      case 'panic':
      case 'security':
        contacts.push(...this.emergencyContacts.filter(c => c.type === 'police'));
        break;

      case 'breakdown':
        contacts.push(...this.emergencyContacts.filter(c => c.type === 'roadside'));
        break;
    }

    // Sort by priority
    return contacts.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Make emergency call
   */
  async makeEmergencyCall(contactId: string): Promise<void> {
    const contact = this.emergencyContacts.find(c => c.id === contactId);
    if (!contact) {
      throw new Error('Emergency contact not found');
    }

    try {
      const phoneUrl = `tel:${contact.phone}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);
      
      if (canOpen) {
        await Linking.openURL(phoneUrl);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        throw new Error('Cannot make phone call');
      }
    } catch (error) {
            throw new Error('Failed to make emergency call');
    }
  }

  /**
   * Get current location with error handling
   */
  private async getCurrentLocation(): Promise<{
    latitude: number;
    longitude: number;
    address?: string;
  } | undefined> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
                return undefined;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      // Try to get address (optional)
      let address: string | undefined;
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          address = `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.city || ''}, ${addr.country || ''}`.trim();
        }
      } catch (geocodeError) {
              }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address,
      };
    } catch (error) {
            return undefined;
    }
  }

  /**
   * Notify BlackRent support about emergency
   */
  private async notifyBlackRentSupport(alert: EmergencyAlert): Promise<void> {
    // In production, this would send push notification to support team
    // and create support ticket with high priority
    
    const _supportData = {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      timestamp: alert.timestamp,
      location: alert.location,
      userId: alert.userId,
      vehicleId: alert.vehicleId,
      bookingId: alert.bookingId,
      description: alert.description,
    };

        
    // TODO: Implement actual API call to backend
    // await api.post('/emergency/notify-support', supportData);
  }

  /**
   * Resolve emergency alert
   */
  async resolveAlert(
    alertId: string, 
    status: 'resolved' | 'false_alarm',
    notes?: string
  ): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = status;
    alert.resolvedTime = new Date();
    
    this.activeAlerts.set(alertId, alert);

    // Notify support about resolution
        
    // TODO: Implement API call to update backend
    // await api.patch(`/emergency/alerts/${alertId}`, { status, notes });
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): EmergencyAlert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.status === 'active' || alert.status === 'dispatched')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get emergency contacts
   */
  getEmergencyContacts(): EmergencyContact[] {
    return [...this.emergencyContacts].sort((a, b) => a.priority - b.priority);
  }

  /**
   * Add custom emergency contact
   */
  addEmergencyContact(contact: Omit<EmergencyContact, 'id'>): void {
    const newContact: EmergencyContact = {
      ...contact,
      id: `custom_${Date.now()}`,
    };
    this.emergencyContacts.push(newContact);
  }

  /**
   * Remove custom emergency contact
   */
  removeEmergencyContact(contactId: string): void {
    this.emergencyContacts = this.emergencyContacts.filter(c => c.id !== contactId);
  }

  /**
   * Test emergency system (for development)
   */
  async testEmergencySystem(): Promise<void> {
        
    try {
      const testAlert = await this.createEmergencyAlert(
        'panic',
        'medium',
        'test_user_123',
        {
          description: 'Test emergency alert',
          autoDispatch: false,
        }
      );

            
      // Resolve test alert after 5 seconds
      setTimeout(() => {
        this.resolveAlert(testAlert.id, 'false_alarm', 'Test completed');
      }, 5000);
      
    } catch (error) {
          }
  }
}

export const emergencyService = EmergencyService.getInstance();
