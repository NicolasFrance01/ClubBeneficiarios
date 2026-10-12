/**
 * Utility functions for calculating Referent commissions and Atlascore net margin.
 */

export const calculateReferralDeductions = (beneficiaries = [], transactions = [], referents = [], plans = []) => {
  // Lookup map for referents by normalized name
  const refMap = new Map();
  referents.forEach(r => {
    if (r.name) refMap.set(r.name.trim().toLowerCase(), r);
  });

  // Group transactions of type 'ingreso' by beneficiary, ordered chronologically
  const txsByBeneficiary = new Map();
  transactions
    .filter(tx => tx.type === 'ingreso')
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach(tx => {
      const bName = (tx.beneficiary || '').trim().toLowerCase();
      if (!txsByBeneficiary.has(bName)) {
        txsByBeneficiary.set(bName, []);
      }
      txsByBeneficiary.get(bName).push(tx);
    });

  const items = [];
  let totalReferentPayout = 0;

  // Structure per referent
  const referentSummary = {};
  referents.forEach(r => {
    referentSummary[r.id] = {
      referent: r,
      totalCommissions: 0,
      qualifiedPaymentsCount: 0,
      expiredPaymentsCount: 0,
      beneficiariesCount: 0,
      beneficiaryNames: new Set()
    };
  });

  beneficiaries.forEach(b => {
    const refName = (b.referente || b.referredBy || '').trim();
    const referent = refName ? refMap.get(refName.toLowerCase()) : null;
    const bTxs = txsByBeneficiary.get(b.name.trim().toLowerCase()) || [];
    const plan = plans.find(p => p.id === b.plan);
    const planComm = plan ? (Number(plan.commission) || 0) : 5000;

    if (referent && referentSummary[referent.id]) {
      referentSummary[referent.id].beneficiaryNames.add(b.name);
    }

    if (bTxs.length > 0) {
      // Evaluate each registered payment transaction
      bTxs.forEach((tx, idx) => {
        let isEligible = false;
        const periodLabel = idx === 0 ? 'Ingreso' : `Mes ${idx}`;
        let ruleLabel = 'Sin Referente';
        let commAmount = 0;

        if (referent) {
          const type = referent.commissionType || 'ingreso';
          const months = Number(referent.commissionMonths) || 1;
          commAmount = Number(referent.commissionAmount) || 2500;

          if (type === 'ingreso') {
            ruleLabel = 'Solo Ingreso';
            isEligible = (idx === 0);
          } else if (type === 'meses') {
            ruleLabel = `Ingreso + ${months} ${months === 1 ? 'Mes' : 'Meses'}`;
            // If months = 1: idx 0 (Ingreso) and idx 1 (Mes 1) qualify
            isEligible = (idx <= months);
          } else if (type === 'siempre') {
            ruleLabel = 'Por Siempre';
            isEligible = true;
          }

          if (isEligible) {
            const actualDeduction = Math.min(commAmount, planComm);
            totalReferentPayout += actualDeduction;
            if (referentSummary[referent.id]) {
              referentSummary[referent.id].totalCommissions += actualDeduction;
              referentSummary[referent.id].qualifiedPaymentsCount += 1;
            }
          } else {
            if (referentSummary[referent.id]) {
              referentSummary[referent.id].expiredPaymentsCount += 1;
            }
          }
        }

        const deduction = isEligible ? Math.min(commAmount, planComm) : 0;
        const atlasNet = Math.max(0, planComm - deduction);

        items.push({
          id: `${b.id}-${tx.id || idx}`,
          txId: tx.id,
          txDate: tx.date,
          beneficiaryName: b.name,
          beneficiaryDoc: b.doc,
          planName: plan ? plan.name : b.plan,
          paymentMethod: tx.method || b.paymentMethod,
          period: periodLabel,
          periodIndex: idx,
          referentName: referent ? referent.name : (refName || 'Ninguno'),
          referentRule: ruleLabel,
          isEligible,
          atlasGross: planComm,
          referentDeduction: deduction,
          atlasNet: atlasNet
        });
      });
    } else if (b.status === 'activo') {
      // Fallback if active beneficiary hasn't registered a transaction in the table yet
      let isEligible = false;
      const periodLabel = 'Ingreso (Mes 1)';
      let ruleLabel = 'Sin Referente';
      let commAmount = 0;

      if (referent) {
        commAmount = Number(referent.commissionAmount) || 2500;
        ruleLabel = referent.commissionType === 'ingreso' ? 'Solo Ingreso' : (referent.commissionType === 'meses' ? `Ingreso + ${referent.commissionMonths} Meses` : 'Por Siempre');
        isEligible = true; // Initial month is eligible
        const actualDeduction = Math.min(commAmount, planComm);
        totalReferentPayout += actualDeduction;
        if (referentSummary[referent.id]) {
          referentSummary[referent.id].totalCommissions += actualDeduction;
          referentSummary[referent.id].qualifiedPaymentsCount += 1;
        }
      }

      const deduction = isEligible ? Math.min(commAmount, planComm) : 0;
      const atlasNet = Math.max(0, planComm - deduction);

      items.push({
        id: `proj-${b.id}`,
        txId: null,
        txDate: b.date || 'Ciclo Actual',
        beneficiaryName: b.name,
        beneficiaryDoc: b.doc,
        planName: plan ? plan.name : b.plan,
        paymentMethod: b.paymentMethod,
        period: periodLabel,
        periodIndex: 0,
        referentName: referent ? referent.name : (refName || 'Ninguno'),
        referentRule: ruleLabel,
        isEligible,
        atlasGross: planComm,
        referentDeduction: deduction,
        atlasNet: atlasNet
      });
    }
  });

  return {
    items,
    totalReferentPayout,
    referentSummary
  };
};
