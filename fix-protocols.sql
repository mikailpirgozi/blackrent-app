-- Oprava existujúcich protokolov - pridanie chýbajúcich stĺpcov
ALTER TABLE handover_protocols 
ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500);

ALTER TABLE handover_protocols 
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;

-- Aktualizácia existujúcich protokolov s pdfUrl
UPDATE handover_protocols 
SET pdf_url = 'https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev/protocols/' || id || '/' || 
    TO_CHAR(created_at, 'YYYY-MM-DD') || '/protokol_prevzatie_' || id || '_' || 
    TO_CHAR(created_at, 'YYYY-MM-DD') || '.pdf'
WHERE pdf_url IS NULL OR pdf_url = '';

-- Zobrazenie výsledkov
SELECT 
    id, 
    created_at, 
    pdf_url,
    CASE 
        WHEN pdf_url IS NOT NULL AND pdf_url != '' THEN '✅ Opravený'
        ELSE '❌ Chýba pdfUrl'
    END as status
FROM handover_protocols 
ORDER BY created_at DESC; 