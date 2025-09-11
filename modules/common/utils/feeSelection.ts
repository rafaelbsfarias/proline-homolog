import { STATUS } from '@/modules/common/constants/status';

export async function selectFeeForAddress(
  admin: any,
  clientId: string,
  addressLabel: string
): Promise<{
  selectedFee: number | null;
  strategy: 'approved' | 'non_zero' | 'none';
  count: number;
}> {
  const { data: feeRows, error } = await admin
    .from('vehicle_collections')
    .select('collection_fee_per_vehicle, status, updated_at, created_at')
    .eq('client_id', clientId)
    .eq('collection_address', addressLabel)
    .in('status', [STATUS.REQUESTED, STATUS.APPROVED])
    .order('updated_at', { ascending: false });

  if (error) throw error;

  const latestApproved = (feeRows || []).find(
    (r: any) => String(r?.status) === STATUS.APPROVED && Number(r?.collection_fee_per_vehicle) > 0
  );
  const latestNonZero = (feeRows || []).find((r: any) => Number(r?.collection_fee_per_vehicle) > 0);
  const selectedFee =
    latestApproved?.collection_fee_per_vehicle ?? latestNonZero?.collection_fee_per_vehicle ?? null;
  const strategy = latestApproved ? 'approved' : latestNonZero ? 'non_zero' : 'none';
  return { selectedFee: selectedFee ?? null, strategy, count: feeRows?.length || 0 };
}
