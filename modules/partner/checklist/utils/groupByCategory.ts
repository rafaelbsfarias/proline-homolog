export type ItemWithEvidences = {
  id: string;
  item_key: string;
  item_status: string;
  item_notes: string | null;
  evidences: Array<{
    id: string;
    media_url: string;
    description: string;
  }>;
};

const categoryMap: Record<string, string> = {
  // Motor
  engineOil: 'Motor',
  oilFilter: 'Motor',
  airFilter: 'Motor',
  fuelFilter: 'Motor',
  sparkPlugs: 'Motor',
  belts: 'Motor',
  radiator: 'Motor',
  battery: 'Motor',

  // Transmissão
  clutch: 'Transmissão',
  gearbox: 'Transmissão',

  // Suspensão
  shockAbsorbers: 'Suspensão',
  springs: 'Suspensão',
  ballJoints: 'Suspensão',

  // Freios
  brakePads: 'Freios',
  brakeDiscs: 'Freios',
  brakeFluid: 'Freios',

  // Direção
  steeringWheel: 'Direção',
  powerSteering: 'Direção',

  // Pneus
  tires: 'Pneus',
  tireAlignment: 'Pneus',

  // Elétrica
  lights: 'Sistema Elétrico',
  wipers: 'Sistema Elétrico',
  horn: 'Sistema Elétrico',

  // Outros
  exhaust: 'Escapamento',
  bodywork: 'Carroceria',
};

export function groupItemsByCategory(
  items: ItemWithEvidences[]
): Record<string, ItemWithEvidences[]> {
  const grouped: Record<string, ItemWithEvidences[]> = {};
  items.forEach(item => {
    const category = categoryMap[item.item_key] || 'Outros';
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(item);
  });
  return grouped;
}
