import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
} from '@mui/material';
import {
  Clear as ClearIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';

interface SignaturePadProps {
  onSave: (signature: {
    id: string;
    signature: string;
    signerName: string;
    signerRole: 'customer' | 'employee';
    timestamp: Date;
    location: string;
    ipAddress?: string;
  }) => void;
  onCancel: () => void;
  signerName: string;
  signerRole: 'customer' | 'employee';
  location: string;
}

export default function SignaturePad({ onSave, onCancel, signerName, signerRole, location }: SignaturePadProps) {
  const { state } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [editableSignerName, setEditableSignerName] = useState(signerName);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Nastav veľkosť canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Nastav štýl kreslenia
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const loadSignatureTemplate = () => {
    if (signerRole !== 'employee' || !state.user?.signatureTemplate) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setHasSignature(true);
    };
    img.src = state.user.signatureTemplate;
  };

  // Automatické načítanie signature template pre zamestnancov
  useEffect(() => {
    console.log('🔍 SignaturePad useEffect:', {
      signerRole,
      hasSignatureTemplate: !!state.user?.signatureTemplate,
      hasSignature,
      userSignatureTemplate: state.user?.signatureTemplate?.substring(0, 50) + '...'
    });
    
    if (signerRole === 'employee' && state.user?.signatureTemplate && !hasSignature) {
      console.log('✅ Automaticky načítavam signature template');
      loadSignatureTemplate();
    }
  }, [signerRole, state.user?.signatureTemplate, hasSignature]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const dataUrl = canvas.toDataURL('image/png');
    
    // Vytvor kompletný signature objekt s timestampom
    const signatureData = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      signature: dataUrl,
      signerName: editableSignerName,
      signerRole,
      timestamp: new Date(),
      location,
      ipAddress: undefined // Môžeme pridať neskôr ak potrebujeme
    };
    
    onSave(signatureData);
  };

  const handleSaveAsTemplate = async () => {
    if (signerRole !== 'employee' || !hasSignature) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // TypeScript fix: explicit null check
    const dataUrl = canvas?.toDataURL('image/png');
    if (!dataUrl) return;
    
    try {
      // TypeScript fix: explicit type assertion
      await apiService.updateSignatureTemplate(dataUrl as string);
      alert('✅ Váš podpis bol úspešne uložený ako template pre budúce protokoly!');
    } catch (error) {
      console.error('Error saving signature template:', error);
      alert('❌ Chyba pri ukladaní signature template. Skúste to znovu.');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Elektronický podpis s časovou pečiatkou
      </Typography>
      
      {/* Editable signer name */}
      <TextField
        label="Meno podpisujúceho"
        value={editableSignerName}
        onChange={(e) => setEditableSignerName(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
        helperText={
          signerRole === 'customer' 
            ? 'Meno zákazníka z prenájmu (môžete upraviť ak je potrebné)' 
            : 'Meno zamestnanca'
        }
        placeholder={
          signerRole === 'customer' 
            ? 'Zadajte meno zákazníka...' 
            : 'Zadajte meno zamestnanca...'
        }
      />
      
      <Paper 
        elevation={3} 
        sx={{ 
          border: '2px dashed #ccc',
          borderRadius: 1,
          p: 2,
          mb: 2
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: 200,
            border: '1px solid #ddd',
            borderRadius: 4,
            cursor: 'crosshair',
            touchAction: 'none', // Dôležité pre touch devices
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        {/* Template buttons for employees */}
        {signerRole === 'employee' && (
          <>
            {state.user?.signatureTemplate && (
              <Button
                variant="outlined"
                onClick={loadSignatureTemplate}
                color="secondary"
              >
                Načítať môj podpis
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={handleSaveAsTemplate}
              disabled={!hasSignature}
              color="info"
            >
              Uložiť ako môj podpis
            </Button>
          </>
        )}
        
        <Button
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={clearCanvas}
          disabled={!hasSignature}
        >
          Vymazať
        </Button>
        <Button
          variant="outlined"
          onClick={onCancel}
        >
          Zrušiť
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!hasSignature || !editableSignerName.trim()}
        >
          Uložiť podpis s pečiatkou
        </Button>
      </Box>
    </Box>
  );
} 