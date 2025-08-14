/**
 * Data Transfer Object for creating a new client.
 * This ensures a clear contract between the API layer and the service layer.
 */
export interface CreateClientDTO {
  readonly name: string;
  readonly email: string;
  readonly document: string;
  readonly documentType: 'CPF' | 'CNPJ' | string;
  readonly phone: string;
  readonly parqueamento?: string;
  readonly quilometragem?: string;
  readonly percentualFipe?: number;
  readonly taxaOperacao?: number;
}
