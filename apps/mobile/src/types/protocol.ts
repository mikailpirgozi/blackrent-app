/**
 * Protocol Types
 * Type definitions for vehicle handover and return protocols
 */

export interface ProtocolPhoto {
  id: string;
  uri: string;
  type: 'front' | 'back' | 'left' | 'right' | 'interior' | 'odometer' | 'damage' | 'other';
  description?: string;
  timestamp: Date;
}

export interface VehicleDamage {
  id: string;
  location: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
  photos: string[]; // Photo IDs
}

export interface VehicleCondition {
  odometer: number;
  fuelLevel: number; // 0-100%
  cleanlinessLevel: 'excellent' | 'good' | 'fair' | 'poor';
  damages: VehicleDamage[];
  additionalNotes?: string;
}

export interface ProtocolSignature {
  customerSignature: string; // Base64 image
  employeeSignature?: string; // Base64 image
  signedAt: Date;
}

export interface HandoverProtocol {
  id: string;
  rentalId: string;
  vehicleId: string;
  customerId: string;
  employeeId?: string;
  
  // Vehicle condition at handover
  condition: VehicleCondition;
  
  // Photos
  photos: ProtocolPhoto[];
  
  // Signatures
  signatures: ProtocolSignature;
  
  // Checklist
  checklist: {
    spareTire: boolean;
    jack: boolean;
    triangleWarning: boolean;
    firstAidKit: boolean;
    fireExtinguisher: boolean;
    reflectiveVest: boolean;
    vehicleDocuments: boolean;
    keys: number; // Number of keys
  };
  
  // Metadata
  createdAt: Date;
  location?: string;
  status: 'pending' | 'completed' | 'signed';
}

export interface ReturnProtocol extends HandoverProtocol {
  // Additional fields for return
  returnOdometer: number;
  returnFuelLevel: number;
  newDamages: VehicleDamage[];
  additionalCharges?: {
    description: string;
    amount: number;
  }[];
}

export type ProtocolType = 'handover' | 'return';

export interface ProtocolFormData {
  odometer: string;
  fuelLevel: number;
  cleanlinessLevel: 'excellent' | 'good' | 'fair' | 'poor';
  damages: VehicleDamage[];
  notes: string;
  checklist: {
    spareTire: boolean;
    jack: boolean;
    triangleWarning: boolean;
    firstAidKit: boolean;
    fireExtinguisher: boolean;
    reflectiveVest: boolean;
    vehicleDocuments: boolean;
    keys: number;
  };
}

