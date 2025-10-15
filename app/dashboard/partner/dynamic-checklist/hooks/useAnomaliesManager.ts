import { useState, useEffect } from 'react';
import { AnomalyEvidence } from '../types';

interface UseAnomaliesManagerProps {
  initialAnomalies: AnomalyEvidence[];
  loading: boolean;
}

export const useAnomaliesManager = ({ initialAnomalies, loading }: UseAnomaliesManagerProps) => {
  const [anomalies, setAnomalies] = useState<AnomalyEvidence[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Sincronizar apenas na primeira carga E quando initialAnomalies muda (após carregamento)
  useEffect(() => {
    if (!loading && (!hasInitialized || initialAnomalies.length > 0 || anomalies.length === 0)) {
      // Só sincronizar se:
      // 1. É a primeira inicialização, OU
      // 2. initialAnomalies tem dados E anomalies está vazio (dados carregados), OU
      // 3. initialAnomalies mudou e tem mais dados que o estado atual
      const shouldSync =
        !hasInitialized ||
        (initialAnomalies.length > 0 && anomalies.length === 0) ||
        initialAnomalies.length > anomalies.length;

      if (shouldSync) {
        setAnomalies(initialAnomalies);
        setHasInitialized(true);
      }
    }
  }, [initialAnomalies, loading, hasInitialized, anomalies.length]);

  const addAnomaly = () => {
    const newAnomaly: AnomalyEvidence = {
      id: Date.now().toString(),
      description: '',
      photos: [],
    };
    setAnomalies(prev => [...prev, newAnomaly]);
  };

  const removeAnomaly = (id: string) => {
    setAnomalies(prev => prev.filter(anomaly => anomaly.id !== id));
  };

  const updateDescription = (id: string, description: string) => {
    setAnomalies(prev =>
      prev.map(anomaly => (anomaly.id === id ? { ...anomaly, description } : anomaly))
    );
  };

  const addPhotos = (id: string, files: FileList) => {
    setAnomalies(prev =>
      prev.map(anomaly => {
        if (anomaly.id === id) {
          const existingUrls = anomaly.photos.filter(photo => typeof photo === 'string');
          const newFiles = Array.from(files);
          return { ...anomaly, photos: [...existingUrls, ...newFiles] };
        }
        return anomaly;
      })
    );
  };

  const removePhoto = (anomalyId: string, photoIndex: number) => {
    setAnomalies(prev =>
      prev.map(anomaly => {
        if (anomaly.id === anomalyId) {
          const updatedPhotos = anomaly.photos.filter((_, index) => index !== photoIndex);
          return { ...anomaly, photos: updatedPhotos };
        }
        return anomaly;
      })
    );
  };

  const updatePartRequest = (anomalyId: string, partRequest: AnomalyEvidence['partRequest']) => {
    setAnomalies(prev =>
      prev.map(anomaly => (anomaly.id === anomalyId ? { ...anomaly, partRequest } : anomaly))
    );
  };

  const removePartRequest = (anomalyId: string) => {
    setAnomalies(prev =>
      prev.map(anomaly =>
        anomaly.id === anomalyId ? { ...anomaly, partRequest: undefined } : anomaly
      )
    );
  };

  return {
    anomalies,
    addAnomaly,
    removeAnomaly,
    updateDescription,
    addPhotos,
    removePhoto,
    updatePartRequest,
    removePartRequest,
  };
};
