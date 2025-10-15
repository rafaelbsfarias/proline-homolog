import { ServiceWithEvidences } from '../types';

export const useEvidenceManager = (
  setServices: React.Dispatch<React.SetStateAction<ServiceWithEvidences[]>>
) => {
  const addEvidence = (serviceId: string, imageUrl: string) => {
    setServices(prev =>
      prev.map(service =>
        service.id === serviceId
          ? {
              ...service,
              evidences: [
                ...service.evidences,
                {
                  quote_item_id: serviceId,
                  image_url: imageUrl,
                  description: '',
                },
              ],
            }
          : service
      )
    );
  };

  const removeEvidence = (serviceId: string, evidenceIndex: number) => {
    setServices(prev =>
      prev.map(service =>
        service.id === serviceId
          ? {
              ...service,
              evidences: service.evidences.filter((_, idx) => idx !== evidenceIndex),
            }
          : service
      )
    );
  };

  const updateEvidenceDescription = (
    serviceId: string,
    evidenceIndex: number,
    description: string
  ) => {
    setServices(prev =>
      prev.map(service =>
        service.id === serviceId
          ? {
              ...service,
              evidences: service.evidences.map((ev, idx) =>
                idx === evidenceIndex ? { ...ev, description } : ev
              ),
            }
          : service
      )
    );
  };

  return {
    addEvidence,
    removeEvidence,
    updateEvidenceDescription,
  };
};
