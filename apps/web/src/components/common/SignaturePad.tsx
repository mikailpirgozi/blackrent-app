import { X as ClearIcon, Save as SaveIcon } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

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

export default function SignaturePad({
  onSave,
  onCancel,
  signerName,
  signerRole,
  location,
}: SignaturePadProps) {
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
      clientX = e.touches[0]?.clientX || 0;
      clientY = e.touches[0]?.clientY || 0;
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
      clientX = e.touches[0]?.clientX || 0;
      clientY = e.touches[0]?.clientY || 0;
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

  const loadSignatureTemplate = useCallback(() => {
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
  }, [signerRole, state.user?.signatureTemplate]);

  // Automatické načítanie signature template pre zamestnancov
  useEffect(() => {
    console.log('🔍 SignaturePad useEffect:', {
      signerRole,
      hasSignatureTemplate: !!state.user?.signatureTemplate,
      hasSignature,
      userSignatureTemplate:
        state.user?.signatureTemplate?.substring(0, 50) + '...',
    });

    if (
      signerRole === 'employee' &&
      state.user?.signatureTemplate &&
      !hasSignature
    ) {
      console.log('✅ Automaticky načítavam signature template');
      loadSignatureTemplate();
    }
  }, [
    signerRole,
    state.user?.signatureTemplate,
    hasSignature,
    loadSignatureTemplate,
  ]);

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
      // ipAddress: undefined, // Môžeme pridať neskôr ak potrebujeme
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
      alert(
        '✅ Váš podpis bol úspešne uložený ako template pre budúce protokoly!'
      );
    } catch (error) {
      console.error('Error saving signature template:', error);
      alert('❌ Chyba pri ukladaní signature template. Skúste to znovu.');
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">
        Elektronický podpis s časovou pečiatkou
      </h3>

      {/* Editable signer name */}
      <div className="mb-4">
        <Label htmlFor="signer-name" className="text-sm font-medium mb-2 block">
          Meno podpisujúceho
        </Label>
        <Input
          id="signer-name"
          value={editableSignerName}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditableSignerName(e.target.value)}
          className="w-full"
          placeholder={
            signerRole === 'customer'
              ? 'Zadajte meno zákazníka...'
              : 'Zadajte meno zamestnanca...'
          }
        />
        <p className="text-xs text-muted-foreground mt-1">
          {signerRole === 'customer'
            ? 'Meno zákazníka z prenájmu (môžete upraviť ak je potrebné)'
            : 'Meno zamestnanca'}
        </p>
      </div>

      <Card className="border-2 border-dashed border-gray-300 mb-4">
        <CardContent className="p-4">
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
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-center flex-wrap">
        {/* Template buttons for employees */}
        {signerRole === 'employee' && (
          <>
            {state.user?.signatureTemplate && (
              <Button
                variant="outline"
                onClick={loadSignatureTemplate}
                className="border-purple-500 text-purple-500 hover:bg-purple-50"
              >
                Načítať môj podpis
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleSaveAsTemplate}
              disabled={!hasSignature}
              className="border-blue-500 text-blue-500 hover:bg-blue-50"
            >
              Uložiť ako môj podpis
            </Button>
          </>
        )}

        <Button
          variant="outline"
          onClick={clearCanvas}
          disabled={!hasSignature}
          className="flex items-center gap-2"
        >
          <ClearIcon className="w-4 h-4" />
          Vymazať
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Zrušiť
        </Button>
        <Button
          variant="default"
          onClick={handleSave}
          disabled={!hasSignature || !editableSignerName.trim()}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          <SaveIcon className="w-4 h-4" />
          Uložiť podpis s pečiatkou
        </Button>
      </div>
    </div>
  );
}
