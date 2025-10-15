import React, { useRef, useState } from 'react';

interface PhotoUploadProps {
  itemKey: string;
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
  existingPhotos?: string[];
  disabled?: boolean;
}

/**
 * Componente de upload de fotos para itens do checklist
 * Permite upload múltiplo com preview
 */
export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onPhotosChange,
  maxPhotos = 5,
  existingPhotos = [],
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    processFiles(selectedFiles);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (disabled) return;

    const droppedFiles = Array.from(event.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const processFiles = (selectedFiles: File[]) => {
    setError(null);

    // Validar número de fotos
    const totalPhotos = files.length + existingPhotos.length + selectedFiles.length;
    if (totalPhotos > maxPhotos) {
      setError(`Máximo de ${maxPhotos} fotos por item`);
      return;
    }

    // Validar cada arquivo
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of selectedFiles) {
      // Validar tipo
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`Tipo de arquivo não permitido: ${file.name}`);
        continue;
      }

      // Validar tamanho
      if (file.size > MAX_FILE_SIZE) {
        setError(`Arquivo muito grande: ${file.name} (máx: 5MB)`);
        continue;
      }

      validFiles.push(file);

      // Criar preview
      const reader = new FileReader();
      reader.onload = e => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === validFiles.length) {
          setPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onPhotosChange(updatedFiles);
    }
  };

  const removePhoto = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    setFiles(newFiles);
    setPreviews(newPreviews);
    onPhotosChange(newFiles);
    setError(null);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const totalPhotos = files.length + existingPhotos.length;
  const canAddMore = totalPhotos < maxPhotos;

  return (
    <div className="space-y-2">
      {/* Upload Area */}
      {canAddMore && !disabled && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
          <div className="flex flex-col items-center gap-2">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600">Clique para adicionar</span> ou arraste
              fotos
            </div>
            <div className="text-xs text-gray-500">
              PNG, JPG, WEBP até 5MB ({totalPhotos}/{maxPhotos})
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Existing Photos Grid */}
      {existingPhotos.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-700 mb-2">Fotos Existentes:</div>
          <div className="grid grid-cols-3 gap-2">
            {existingPhotos.map((url, index) => (
              <div key={`existing-${index}`} className="relative group">
                <img
                  src={url}
                  alt={`Existente ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => window.open(url, '_blank')}
                    className="opacity-0 group-hover:opacity-100 bg-white rounded-full p-1 shadow-md"
                    title="Visualizar"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Photos Preview Grid */}
      {previews.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-700 mb-2">Novas Fotos:</div>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((preview, index) => (
              <div key={`preview-${index}`} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                    title="Remover"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-0.5 rounded">
                  {(files[index].size / 1024).toFixed(0)}KB
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
