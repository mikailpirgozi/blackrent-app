/**
 * 🏥 INSURANCE CLAIMS ROUTES - Fastify Migration
 * 
 * Migrated from: backend/src/routes/insurance-claims.ts
 * Purpose: Insurance claim management
 */

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticateFastify } from '../decorators/auth';
import { postgresDatabase } from '../../models/postgres-database';
import type { InsuranceClaim } from '../../types';

// Zod schemas
const GetClaimsQuerySchema = z.object({
  vehicleId: z.string().optional()
});

const CreateClaimSchema = z.object({
  vehicleId: z.string().min(1),
  insuranceId: z.string().optional(),
  incidentDate: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  incidentType: z.string().min(1),
  estimatedDamage: z.number().optional(),
  deductible: z.number().optional(),
  payoutAmount: z.number().optional(),
  status: z.string().optional(),
  claimNumber: z.string().optional(),
  filePaths: z.array(z.string()).optional(),
  policeReportNumber: z.string().optional(),
  otherPartyInfo: z.string().optional(),
  notes: z.string().optional()
});

const UpdateClaimSchema = CreateClaimSchema.partial().required({ vehicleId: true, incidentDate: true, description: true, incidentType: true });

const insuranceClaimsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/insurance-claims - Get all insurance claims
  fastify.get<{
    Querystring: z.infer<typeof GetClaimsQuerySchema>;
  }>('/', {
    onRequest: [authenticateFastify],
    schema: {
      querystring: GetClaimsQuerySchema
    }
  }, async (request, reply) => {
    try {
      const { vehicleId } = request.query;
      const claims = await postgresDatabase.getInsuranceClaims(vehicleId);

      return reply.send({
        success: true,
        data: claims
      });
    } catch (error) {
      request.log.error(error, 'Get insurance claims error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní poistných udalostí'
      });
    }
  });

  // POST /api/insurance-claims - Create new insurance claim
  fastify.post<{
    Body: z.infer<typeof CreateClaimSchema>;
  }>('/', {
    onRequest: [authenticateFastify],
    schema: {
      body: CreateClaimSchema
    }
  }, async (request, reply) => {
    try {
      const body = request.body;

      const createdClaim = await postgresDatabase.createInsuranceClaim({
        vehicleId: body.vehicleId,
        insuranceId: body.insuranceId,
        incidentDate: new Date(body.incidentDate),
        description: body.description,
        location: body.location,
        incidentType: body.incidentType,
        estimatedDamage: body.estimatedDamage,
        deductible: body.deductible,
        payoutAmount: body.payoutAmount,
        status: body.status,
        claimNumber: body.claimNumber,
        filePaths: body.filePaths,
        policeReportNumber: body.policeReportNumber,
        otherPartyInfo: body.otherPartyInfo,
        notes: body.notes
      });

      return reply.status(201).send({
        success: true,
        message: 'Poistná udalosť úspešne vytvorená',
        data: createdClaim
      });

    } catch (error) {
      request.log.error(error, 'Create insurance claim error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri vytváraní poistnej udalosti'
      });
    }
  });

  // PUT /api/insurance-claims/:id - Update insurance claim
  fastify.put<{
    Params: { id: string };
    Body: z.infer<typeof UpdateClaimSchema>;
  }>('/:id', {
    onRequest: [authenticateFastify],
    schema: {
      body: UpdateClaimSchema
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const body = request.body;

      const updatedClaim = await postgresDatabase.updateInsuranceClaim(id, {
        vehicleId: body.vehicleId!,
        insuranceId: body.insuranceId,
        incidentDate: new Date(body.incidentDate!),
        description: body.description!,
        location: body.location,
        incidentType: body.incidentType!,
        estimatedDamage: body.estimatedDamage,
        deductible: body.deductible,
        payoutAmount: body.payoutAmount,
        status: body.status,
        claimNumber: body.claimNumber,
        filePaths: body.filePaths,
        policeReportNumber: body.policeReportNumber,
        otherPartyInfo: body.otherPartyInfo,
        notes: body.notes
      });

      return reply.send({
        success: true,
        message: 'Poistná udalosť úspešne aktualizovaná',
        data: updatedClaim
      });

    } catch (error) {
      request.log.error(error, 'Update insurance claim error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri aktualizácii poistnej udalosti'
      });
    }
  });

  // DELETE /api/insurance-claims/:id - Delete insurance claim
  fastify.delete<{
    Params: { id: string };
  }>('/:id', {
    onRequest: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      await postgresDatabase.deleteInsuranceClaim(id);

      return reply.send({
        success: true,
        message: 'Poistná udalosť úspešne vymazaná'
      });

    } catch (error) {
      request.log.error(error, 'Delete insurance claim error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri vymazávaní poistnej udalosti'
      });
    }
  });
};

export default insuranceClaimsRoutes;

