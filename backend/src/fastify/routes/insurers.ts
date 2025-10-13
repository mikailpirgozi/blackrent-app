import type { FastifyInstance } from 'fastify';
import { authenticateFastify } from '../decorators/auth';
import { postgresDatabase } from '../../models/postgres-database';

interface InsurerParams {
  id: string;
}

interface InsurerBody {
  name: string;
}

export default async function insurersRoutes(fastify: FastifyInstance) {
  
  // GET /api/insurers - Získanie všetkých poisťovní
  fastify.get('/api/insurers', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const insurers = await postgresDatabase.getInsurers();
      return reply.send({
        success: true,
        data: insurers
      });
    } catch (error) {
      fastify.log.error(error, 'Get insurers error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri získavaní poisťovní'
      });
    }
  });

  // POST /api/insurers - Vytvorenie novej poisťovne
  fastify.post<{
    Body: InsurerBody;
  }>('/api/insurers', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { name } = request.body;

      if (!name) {
        return reply.status(400).send({
          success: false,
          error: 'Názov poisťovne je povinný'
        });
      }

      const createdInsurer = await postgresDatabase.createInsurer({ name });

      return reply.status(201).send({
        success: true,
        message: 'Poisťovňa úspešne vytvorená',
        data: createdInsurer
      });

    } catch (error) {
      fastify.log.error(error, 'Create insurer error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri vytváraní poisťovne'
      });
    }
  });

  // DELETE /api/insurers/:id - Vymazanie poisťovne
  fastify.delete<{
    Params: InsurerParams;
  }>('/api/insurers/:id', {
    preHandler: [authenticateFastify]
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      await postgresDatabase.deleteInsurer(id);

      return reply.send({
        success: true,
        message: 'Poisťovňa úspešne vymazaná'
      });

    } catch (error) {
      fastify.log.error(error, 'Delete insurer error');
      return reply.status(500).send({
        success: false,
        error: 'Chyba pri vymazávaní poisťovne'
      });
    }
  });

  fastify.log.info('✅ Insurers routes registered');
}

