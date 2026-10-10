export const initialData = {
  commission: 5000,
  iva: 0.21,
  plans: [
    { id: 'silver', name: 'Plan Silver', basePrice: 29000, description: 'Acondicionamiento base y clases grupales', includes: 'Musculación, Funcional, Zumba, Gap', sedes: 'Red Manantial, Fitship, MG Fitness, Start Fit' },
    { id: 'gold', name: 'Plan Gold', basePrice: 42000, description: 'Entrenamiento de alta intensidad y especialidades', includes: 'Crossfit, Boxeo, Hyrox, Rehabilitación Deportiva', sedes: 'Rusia Gym, Kaizen, Charly Box, Arena Training, Otb Training' },
    { id: 'platinum', name: 'Plan Platinum', basePrice: 60000, description: 'Experiencia Premium, Acuática y Bienestar Integral', includes: 'Pileta Libre, Natación, Aquagym, PoleSport, Yoga', sedes: 'Manantial Swim, Red Deporbas, La Rufina, El Club, Acro Flow Studio' }
  ],
  beneficiaries: [
    { id: 1, name: 'Juan Perez', doc: '38123456', email: 'juan@example.com', phone: '1123456789', plan: 'gold', paymentMethod: 'efectivo', status: 'activo', referredBy: 'Nicolas', date: '2026-10-01' },
    { id: 2, name: 'Maria Gomez', doc: '40987654', email: 'maria@example.com', phone: '1198765432', plan: 'silver', paymentMethod: 'transferencia', status: 'activo', referredBy: 'Nicolas', date: '2026-10-05' }
  ],
  users: [
    { id: 1, name: 'Nicolas France', role: 'Fundador', email: 'admin@atlascore.com', password: 'admin', needsPasswordChange: false }
  ]
};

// Helper functions to calculate prices
export const calculateFinalPrice = (basePrice, paymentMethod, commission, iva) => {
  if (paymentMethod === 'transferencia') {
    return basePrice + (basePrice * iva) + commission;
  }
  return basePrice + commission;
};

export const calculateFitnessGroupCut = (basePrice, paymentMethod, iva) => {
  if (paymentMethod === 'transferencia') {
    return basePrice + (basePrice * iva);
  }
  return basePrice;
};
