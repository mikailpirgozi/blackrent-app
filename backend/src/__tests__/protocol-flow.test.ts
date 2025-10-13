/**
 * 🧪 Protocol Flow Integration Test
 * 
 * Tests complete protocol flow after Fastify migration:
 * 1. Upload protocol image with compression
 * 2. Create protocol with uploaded images
 * 3. Verify images have pdfUrl for PDF generation
 * 4. Generate PDF and verify it uses compressed images
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildFastify } from '../fastify-app';
import type { FastifyInstance } from 'fastify';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

describe('Protocol Flow Integration Test', () => {
  let app: FastifyInstance;
  let testToken: string;
  let testRentalId: string;
  let uploadedImageUrl: string;
  let uploadedPdfUrl: string | null;

  beforeAll(async () => {
    // Initialize Fastify app
    app = await buildFastify();
    await app.ready();

    // Get auth token (assuming admin user exists)
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        username: 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      }
    });

    const loginData = JSON.parse(loginResponse.body);
    testToken = loginData.token;

    // Create a test rental
    const rentalResponse = await app.inject({
      method: 'POST',
      url: '/api/rentals',
      headers: {
        authorization: `Bearer ${testToken}`
      },
      payload: {
        vehicleId: '1', // Assuming test vehicle exists
        customerName: 'Test Customer',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        totalPrice: 100,
        paymentMethod: 'cash'
      }
    });

    const rentalData = JSON.parse(rentalResponse.body);
    testRentalId = rentalData.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should upload protocol image with pdfUrl', async () => {
    // Create a test image (1x1 pixel PNG)
    const testImagePath = path.join(__dirname, 'test-image.png');
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(testImagePath, testImageBuffer);

    const form = new FormData();
    form.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-vehicle-image.png',
      contentType: 'image/png'
    });
    form.append('type', 'protocol');
    form.append('entityId', testRentalId);
    form.append('mediaType', 'vehicle');
    form.append('protocolType', 'handover');

    const response = await app.inject({
      method: 'POST',
      url: '/api/files/upload',
      headers: {
        authorization: `Bearer ${testToken}`,
        ...form.getHeaders()
      },
      payload: form
    });

    expect(response.statusCode).toBe(200);
    
    const uploadResult = JSON.parse(response.body);
    expect(uploadResult.success).toBe(true);
    expect(uploadResult.url).toBeDefined();
    expect(typeof uploadResult.url).toBe('string');
    
    // Store for protocol creation
    uploadedImageUrl = uploadResult.url;
    
    // Clean up
    fs.unlinkSync(testImagePath);
  }, 30000);

  it('should upload PDF version of image', async () => {
    // Create a test compressed image (simulating frontend compression)
    const testPdfImagePath = path.join(__dirname, 'test-pdf-image.jpg');
    const testPdfImageBuffer = Buffer.from(
      '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==',
      'base64'
    );
    fs.writeFileSync(testPdfImagePath, testPdfImageBuffer);

    const form = new FormData();
    form.append('file', fs.createReadStream(testPdfImagePath), {
      filename: 'test-vehicle-image_pdf.jpg',
      contentType: 'image/jpeg'
    });
    form.append('type', 'protocol');
    form.append('entityId', testRentalId);
    form.append('mediaType', 'vehicle_pdf');
    form.append('protocolType', 'handover');

    const response = await app.inject({
      method: 'POST',
      url: '/api/files/upload',
      headers: {
        authorization: `Bearer ${testToken}`,
        ...form.getHeaders()
      },
      payload: form
    });

    expect(response.statusCode).toBe(200);
    
    const uploadResult = JSON.parse(response.body);
    expect(uploadResult.success).toBe(true);
    expect(uploadResult.url).toBeDefined();
    
    uploadedPdfUrl = uploadResult.url;
    
    // Clean up
    fs.unlinkSync(testPdfImagePath);
  }, 30000);

  it('should create handover protocol with images that have pdfUrl', async () => {
    const protocolData = {
      id: `test-${Date.now()}`,
      rentalId: testRentalId,
      location: 'Test Location',
      vehicleCondition: {
        odometer: 50000,
        fuelLevel: 100,
        fuelType: 'gasoline',
        exteriorCondition: 'Dobrý',
        interiorCondition: 'Dobrý',
        notes: 'Test protocol'
      },
      vehicleImages: [
        {
          id: `img-${Date.now()}`,
          url: uploadedImageUrl,
          originalUrl: uploadedImageUrl,
          pdfUrl: uploadedPdfUrl, // ✅ CRITICAL: pdfUrl from upload
          type: 'vehicle',
          description: 'Test vehicle image',
          timestamp: new Date().toISOString(),
          compressed: true
        }
      ],
      signatures: [],
      damages: [],
      rentalData: {
        vehicle: { brand: 'Test', model: 'Car', licensePlate: 'TEST123' },
        customer: { name: 'Test Customer', email: 'test@example.com' }
      },
      createdBy: 'test-user'
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/protocols/handover',
      headers: {
        authorization: `Bearer ${testToken}`,
        'content-type': 'application/json'
      },
      payload: protocolData
    });

    expect(response.statusCode).toBe(201);
    
    const result = JSON.parse(response.body);
    expect(result.success).toBe(true);
    expect(result.protocol).toBeDefined();
    expect(result.protocol.vehicleImages).toBeDefined();
    expect(result.protocol.vehicleImages.length).toBe(1);
    
    // ✅ VERIFY: vehicleImages have pdfUrl
    const firstImage = result.protocol.vehicleImages[0];
    expect(firstImage.pdfUrl).toBeDefined();
    expect(firstImage.pdfUrl).toBe(uploadedPdfUrl);
    
    console.log('✅ Protocol created with pdfUrl:', firstImage.pdfUrl);
  }, 30000);

  it('should generate PDF using compressed images', async () => {
    // Fetch protocol
    const protocolsResponse = await app.inject({
      method: 'GET',
      url: `/api/protocols/rental/${testRentalId}`,
      headers: {
        authorization: `Bearer ${testToken}`
      }
    });

    expect(protocolsResponse.statusCode).toBe(200);
    
    const protocolsData = JSON.parse(protocolsResponse.body);
    expect(protocolsData.handoverProtocols).toBeDefined();
    expect(protocolsData.handoverProtocols.length).toBeGreaterThan(0);
    
    const protocol = protocolsData.handoverProtocols[0];
    
    // Generate PDF
    const pdfResponse = await app.inject({
      method: 'GET',
      url: `/api/protocols/handover/${protocol.id}/pdf`,
      headers: {
        authorization: `Bearer ${testToken}`
      }
    });

    expect(pdfResponse.statusCode).toBe(200);
    expect(pdfResponse.headers['content-type']).toBe('application/pdf');
    expect(pdfResponse.rawPayload.length).toBeGreaterThan(0);
    
    console.log('✅ PDF generated successfully, size:', pdfResponse.rawPayload.length, 'bytes');
  }, 60000);
});

