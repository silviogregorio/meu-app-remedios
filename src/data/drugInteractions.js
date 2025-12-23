
/**
 * DATABASE DE INTERAÇÕES MEDICAMENTOSAS
 * Foco: Geriatria e Segurança do Paciente
 * 
 * Estrutura:
 * - groups: Agrupa medicamentos similares para evitar cadastrar centenas de pares.
 * - conflicts: Define a regra de conflito entre grupos ou medicamentos específicos.
 */

export const DRUG_GROUPS = {
    ANTICOAGULANTES: ['Varfarina', 'Warfarin', 'Rivaroxabana', 'Xarelto', 'Apixabana', 'Eliquis', 'Dabigratana', 'Pradaxa', 'Marevan', 'Coumadin'],
    AINES: ['Aspirina', 'AAS', 'Ibuprofeno', 'Advil', 'Alivium', 'Naproxeno', 'Flanax', 'Diclofenaco', 'Voltaren', 'Cataflam', 'Cetoprofeno', 'Nimesulida', 'Celecoxibe'],
    IECAS_BRA: ['Enalapril', 'Captopril', 'Lisinopril', 'Ramipril', 'Losartana', 'Valsartana', 'Candesartana', 'Olmesartana'],
    DIURETICOS_POUPADORES_K: ['Espironolactona', 'Aldactone', 'Amilorida', 'Triantereno'],
    SAIS_POTASSIO: ['Cloreto de Potássio', 'Slow-K', 'K-Citrat'],
    DIGITALICOS: ['Digoxina', 'Digox'],
    ANTIARRITMICOS: ['Amiodarona', 'Ancoron', 'Verapamil', 'Diltiazem'],
    ANTIBIOTICOS_QUINO: ['Ciprofloxacino', 'Cipro', 'Levofloxacino', 'Levaquin', 'Norfloxacino'],
    BENZODIAZEPINICOS: ['Diazepam', 'Valium', 'Alprazolam', 'Frontal', 'Clonazepam', 'Rivotril', 'Lorazepam', 'Lorax', 'Midazolam'],
    OPIOIDES: ['Tramadol', 'Tramal', 'Codeína', 'Tylex', 'Morfina', 'Dimorf', 'Fentanil', 'Oxicodona'],
    ESTATINAS: ['Sinvastatina', 'Zocor', 'Atorvastatina', 'Lipitor', 'Rosuvastatina', 'Crestor'],
    FIBRATOS: ['Gemfibrozila', 'Lopid', 'Fenofibrato', 'Lipidil'],
    ANTIPROCINETICOS: ['Metoclopramida', 'Plasil', 'Domperidona', 'Motilium'],
    ANTIPSICOTICOS: ['Haloperidol', 'Haldol', 'Risperidona', 'Quetiapina', 'Seroquel', 'Olanzapina'],
    SSRI_ANTIDEPRESSIVOS: ['Fluoxetina', 'Prozac', 'Sertralina', 'Zoloft', 'Paroxetina', 'Escitalopram', 'Lexapro', 'Citalopram'],
    ANTIDIABETICOS_ORAL: ['Metformina', 'Glifage', 'Glibenclamida', 'Gliclazida'],
    NITRATOS: ['Isossorbida', 'Isordil', 'Nitroglicerina', 'Nitronal'],
    PDE5_INIBIDORES: ['Sildenafila', 'Viagra', 'Tadalafila', 'Cialis'],
    BIFOSFONATOS: ['Alendronato', 'Fosamax', 'Risedronato', 'Actonel'],
    SUPLEMENTOS_MINERAIS: ['Cálcio', 'Ferro', 'Magnésio', 'Multivitamínico'],
    ANTIHISTAMINICOS: ['Difidramina', 'Hidroxizina', 'Fenergan', 'Prometazina'],
    BETA_BLOQUEADORES: ['Atenolol', 'Metoprolol', 'Seloken', 'Bisoprolol', 'Concor', 'Carvedilol', 'Dilatrend', 'Propranolol'],
    BLOQUEADORES_CALCIO: ['Anlodipino', 'Norvasc', 'Nifedipino', 'Adalat', 'Verapamil', 'Dilacor', 'Diltiazem'],
    ANTICOLINERGICOS: ['Biperideno', 'Akineton', 'Escopolamina', 'Buscopan', 'Amitriptilina', 'Nortriptilina', 'Pamelor'],
    DIURETICOS_ALCA: ['Furosemida', 'Lasix', 'Bumetanida'],
    ANTIEPILEPTICOS: ['Fenitoína', 'Hidantal', 'Carbamazepina', 'Tegretol', 'Valproato', 'Depakene', 'Fenobarbital', 'Gardenal'],
    ANTIFUNGICOS_AZOIS: ['Cetoconazol', 'Itraconazol', 'Fluconazol'],
    MACROLIDEOS: ['Claritromicina', 'Klaricid', 'Eritromicina']
};

export const DRUG_CONFLICTS = [
    {
        group1: 'ANTICOAGULANTES',
        group2: 'AINES',
        severity: 'high',
        message: 'Risco muito alto de sangramento gástrico e hemorragias. A combinação de anticoagulantes com anti-inflamatórios é perigosa para idosos.',
    },
    {
        group1: 'ANTICOAGULANTES',
        group2: 'ANTIBIOTICOS_QUINO',
        severity: 'medium',
        message: 'O antibiótico pode aumentar o efeito do anticoagulante, elevando o risco de sangramento. Requer monitoramento do tempo de coagulação (TAP/INR).',
    },
    {
        group1: 'ANTICOAGULANTES',
        group2: 'ANTIARRITMICOS',
        severity: 'high',
        message: 'A amiodarona ou verapamil podem elevar drasticamente os níveis do anticoagulante no sangue.',
    },
    {
        group1: 'ANTICOAGULANTES',
        group2: 'ANTIFUNGICOS_AZOIS',
        severity: 'high',
        message: 'Antifúngicos (Fluconazol/Cetoconazol) aumentam drasticamente o efeito de anticoagulantes, com risco de sangramentos sérios.',
    },
    {
        group1: 'ANTICOAGULANTES',
        group2: 'ANTIEPILEPTICOS',
        severity: 'medium',
        message: 'Certos antiepilépticos (Carbamazepina/Fenobarbital) podem reduzir o efeito do anticoagulante, aumentando o risco de trombose.',
    },
    {
        group1: 'IECAS_BRA',
        group2: 'DIURETICOS_POUPADORES_K',
        severity: 'medium',
        message: 'Risco de Hipercalemia (excesso de potássio no sangue), que pode afetar o ritmo cardíaco.',
    },
    {
        group1: 'IECAS_BRA',
        group2: 'SAIS_POTASSIO',
        severity: 'high',
        message: 'Combinação perigosa que pode levar a níveis fatais de potássio no sangue em idosos.',
    },
    {
        group1: 'BETA_BLOQUEADORES',
        group2: 'BLOQUEADORES_CALCIO',
        severity: 'high',
        message: 'Risco de bradicardia severa (coração muito lento) e insuficiência cardíaca. Especial atenção ao Verapamil e Diltiazem.',
    },
    {
        group1: 'DIGITALICOS',
        group2: 'ANTIARRITMICOS',
        severity: 'high',
        message: 'Risco de toxicidade por Digoxina. Pode causar arritmias graves, náuseas e visão colorida.',
    },
    {
        group1: 'DIGITALICOS',
        group2: 'DIURETICOS_ALCA',
        severity: 'medium',
        message: 'A perda de potássio causada pelo diurético (Lasix) aumenta o risco de intoxicação por Digoxina.',
    },
    {
        group1: 'BENZODIAZEPINICOS',
        group2: 'OPIOIDES',
        severity: 'high',
        message: 'Risco crítico de sedação excessiva, parada respiratória e quedas. Evite combinar calmantes com analgésicos fortes.',
    },
    {
        group1: 'ESTATINAS',
        group2: 'FIBRATOS',
        severity: 'medium',
        message: 'Risco aumentado de miopatia (dor muscular grave) e lesão renal (rabdomiólise).',
    },
    {
        group1: 'ESTATINAS',
        group2: 'MACROLIDEOS',
        severity: 'high',
        message: 'Antibióticos como Claritromicina aumentam muito o risco de lesão muscular grave por estatinas.',
    },
    {
        group1: 'NITRATOS',
        group2: 'PDE5_INIBIDORES',
        severity: 'high',
        message: 'Risco de queda fatal da pressão arterial (hipotensão severa). Nunca use medicamentos para disfunção erétil com remédios para o coração (nitratos).',
    },
    {
        group1: 'SSRI_ANTIDEPRESSIVOS',
        group2: 'OPIOIDES',
        severity: 'medium',
        message: 'Risco de Síndrome Serotoninérgica (confusão, tremores, febre). Especial atenção com Tramadol.',
    },
    {
        group1: 'SSRI_ANTIDEPRESSIVOS',
        group2: 'AINES',
        severity: 'medium',
        message: 'Aumenta o risco de sangramento digestivo, especialmente se houver histórico de gastrite.',
    },
    {
        group1: 'ANTIBIOTICOS_QUINO',
        group2: 'SUPLEMENTOS_MINERAIS',
        severity: 'low',
        message: 'Minerais (Cálcio, Ferro, Magnésio) reduzem a absorção do antibiótico. Tome com intervalo de pelo menos 2 horas.',
    },
    {
        group1: 'ANTIPSICOTICOS',
        group2: 'BENZODIAZEPINICOS',
        severity: 'high',
        message: 'Sedação profunda e risco aumentado de pneumonia por aspiração e quedas em idosos.',
    },
    {
        group1: 'ANTIPSICOTICOS',
        group2: 'ANTICOLINERGICOS',
        severity: 'high',
        message: 'Risco altíssimo de confusão mental aguda (delirium), boca seca extrema, constipação e retenção urinária em idosos.',
    },
    {
        group1: 'ANTIPROCINETICOS',
        group2: 'ANTIPSICOTICOS',
        severity: 'medium',
        message: 'Risco de sintomas extrapiramidais (tremores, rigidez muscular similar ao Parkinson).',
    },
    {
        group1: 'DIURETICOS_POUPADORES_K',
        group2: 'AINES',
        severity: 'medium',
        message: 'Aumenta o risco de insuficiência renal aguda e reduz o efeito do diurético.',
    },
    {
        group1: 'DIURETICOS_ALCA',
        group2: 'AINES',
        severity: 'medium',
        message: 'O anti-inflamatório reduz o efeito do diurético e aumenta o risco de sobrecarga renal.',
    }
];

/**
 * Função utilitária para verificar interações
 */
export const checkInteractions = (selectedMedName, currentMeds) => {
    if (!selectedMedName || !currentMeds || currentMeds.length === 0) return null;

    const findGroups = (name) => {
        const groups = [];
        const nameLower = name.toLowerCase();
        for (const [groupName, meds] of Object.entries(DRUG_GROUPS)) {
            if (meds.some(m => nameLower.includes(m.toLowerCase()))) {
                groups.push(groupName);
            }
        }
        return groups;
    };

    const targetGroups = findGroups(selectedMedName);
    if (targetGroups.length === 0) return null;

    const discoveredConflicts = [];

    for (const currentMed of currentMeds) {
        const currentMedGroups = findGroups(currentMed.name);

        for (const tGroup of targetGroups) {
            for (const cGroup of currentMedGroups) {
                const conflict = DRUG_CONFLICTS.find(conf =>
                    (conf.group1 === tGroup && conf.group2 === cGroup) ||
                    (conf.group1 === cGroup && conf.group2 === tGroup)
                );

                if (conflict) {
                    discoveredConflicts.push({
                        ...conflict,
                        offendingMed: currentMed.name
                    });
                }
            }
        }
    }

    return discoveredConflicts.length > 0 ? discoveredConflicts : null;
};
