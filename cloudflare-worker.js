// 🚀 Cloudflare Worker pre R2 Upload Proxy
// Riešenie CORS problému pri signed URL upload

export default {
  async fetch(request, env) {
    // CORS headers pre všetky requesty
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Alebo tvoja doména
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Len POST requesty pre upload
    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    try {
      // Parsovanie request body
      const formData = await request.formData();
      const file = formData.get('file');
      const protocolId = formData.get('protocolId');
      const protocolType = formData.get('protocolType');
      const mediaType = formData.get('mediaType');
      const label = formData.get('label');

      // Validácia
      if (!file || !protocolId || !protocolType || !mediaType) {
        return new Response('Missing required fields', {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Validácia typu súboru
      if (!file.type.startsWith('image/')) {
        return new Response('Only images are allowed', {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Validácia veľkosti (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return new Response('File too large (max 10MB)', {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Generovanie file key
      const today = new Date().toISOString().split('T')[0];
      const fileKey = `protocols/${protocolType}/${today}/${protocolId}/${file.name}`;

      // Upload do R2
      const r2Object = await env.R2_BUCKET.put(fileKey, file.stream(), {
        httpMetadata: {
          contentType: file.type,
        },
        customMetadata: {
          original_name: file.name,
          uploaded_at: new Date().toISOString(),
          protocol_id: protocolId,
          protocol_type: protocolType,
          media_type: mediaType,
          label: label || file.name,
        },
      });

      // Vytvorenie public URL (používame backend proxy kvôli R2 SSL problému)
      const publicUrl = `https://blackrent-app-production-4d6f.up.railway.app/api/files/proxy/${encodeURIComponent(fileKey)}`;

      // Vytvorenie photo objektu
      const photoObject = {
        id: crypto.randomUUID(),
        url: publicUrl,
        type: mediaType,
        description: label || file.name,
        timestamp: new Date().toISOString(),
        compressed: false,
        originalSize: file.size,
        compressedSize: file.size,
        filename: file.name,
      };

      // Response
      return new Response(JSON.stringify({
        success: true,
        photo: photoObject,
        url: publicUrl,
        key: fileKey,
        filename: file.name,
        size: file.size,
        mimetype: file.type,
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });

    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Upload failed',
        details: error.message,
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  },
}; 