import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { Camera, Loader2, X } from 'lucide-react';
import Button from './Button';
import { useApp } from '../../context/AppContext';

const OCRButton = ({ onTextExtracted, type = 'medication' }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);
    const { showToast } = useApp();

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsProcessing(true);
        setProgress(0);

        try {
            const worker = await createWorker('por', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                }
            });

            const { data: { text } } = await worker.recognize(file);
            console.log('--- RAW OCR TEXT ---');
            console.log(text);
            console.log('--------------------');
            await worker.terminate();

            if (text.trim()) {
                onTextExtracted(text);
                showToast('Texto extraído com sucesso!', 'success');
            } else {
                showToast('Não foi possível identificar texto na imagem.', 'warning');
            }
        } catch (error) {
            console.error('Erro no OCR:', error);
            showToast('Erro ao processar imagem.', 'error');
        } finally {
            setIsProcessing(false);
            setProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="relative inline-block">
            <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-2 border-dashed border-teal-200 hover:border-teal-400 bg-teal-50/50"
            >
                {isProcessing ? (
                    <>
                        <Loader2 size={16} className="animate-spin text-teal-600" />
                        <span className="text-xs">{progress}%</span>
                    </>
                ) : (
                    <>
                        <Camera size={16} className="text-teal-600" />
                        <span className="text-xs">Escanear {type === 'medication' ? 'Remédio' : 'Receita'}</span>
                    </>
                )}
            </Button>
        </div>
    );
};

export default OCRButton;
