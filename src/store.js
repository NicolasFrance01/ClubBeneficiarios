export const initialData = {
  commission: 5000,
  iva: 0.21,
  plans: [
    { id: 'silver', name: 'Plan Silver', basePrice: 29000, description: 'Acondicionamiento base y clases grupales', includes: 'Musculación, Funcional, Zumba, Gap', sedes: 'Red Manantial, Fitship, MG Fitness, Start Fit' },
    { id: 'gold', name: 'Plan Gold', basePrice: 42000, description: 'Entrenamiento de alta intensidad y especialidades', includes: 'Crossfit, Boxeo, Hyrox, Rehabilitación Deportiva', sedes: 'Rusia Gym, Kaizen, Charly Box, Arena Training, Otb Training' },
    { id: 'platinum', name: 'Plan Platinum', basePrice: 60000, description: 'Experiencia Premium, Acuática y Bienestar Integral', includes: 'Pileta Libre, Natación, Aquagym, PoleSport, Yoga', sedes: 'Manantial Swim, Red Deporbas, La Rufina, El Club, Acro Flow Studio' }
  ],
  beneficiaries: [],
  transactions: [],
  users: [
    { id: 2, name: 'Nicolas France', role: 'Fundador', email: 'nfrance@atlascore.com', password: 'admin', needsPasswordChange: false }
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
