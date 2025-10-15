/**
 * Protocol Service
 * API methods for handover and return protocols
 */

import api from '../../config/api';
import type { HandoverProtocol, ReturnProtocol, ProtocolPhoto } from '../../types/protocol';

interface CreateProtocolRequest {
  rentalId: string;
  vehicleId: string;
  odometer: number;
  fuelLevel: number;
  cleanlinessLevel: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
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
  photos: ProtocolPhoto[];
  customerSignature: string;
}

interface ProtocolResponse {
  success: boolean;
  data?: HandoverProtocol | ReturnProtocol;
  error?: string;
}

export const protocolService = {
  /**
   * Create handover protocol
   */
  createHandoverProtocol: async (data: CreateProtocolRequest): Promise<ProtocolResponse> => {
    try {
      const response = await api.post('/protocols/handover', data);
      return response.data;
    } catch (error) {
      console.error('Create handover protocol error:', error);
      throw error;
    }
  },

  /**
   * Create return protocol
   */
  createReturnProtocol: async (data: CreateProtocolRequest): Promise<ProtocolResponse> => {
    try {
      const response = await api.post('/protocols/return', data);
      return response.data;
    } catch (error) {
      console.error('Create return protocol error:', error);
      throw error;
    }
  },

  /**
   * Get protocol by ID
   */
  getProtocol: async (protocolId: string): Promise<ProtocolResponse> => {
    try {
      const response = await api.get(`/protocols/${protocolId}`);
      return response.data;
    } catch (error) {
      console.error('Get protocol error:', error);
      throw error;
    }
  },

  /**
   * Upload protocol photo
   */
  uploadPhoto: async (file: {
    uri: string;
    name: string;
    type: string;
  }): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as Blob);

      const response = await api.post('/protocols/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Upload photo error:', error);
      throw error;
    }
  },

  /**
   * Download protocol PDF
   */
  downloadProtocolPdf: async (protocolId: string): Promise<Blob> => {
    try {
      const response = await api.get(`/protocols/${protocolId}/pdf`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Download protocol PDF error:', error);
      throw error;
    }
  },
};

