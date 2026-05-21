import * as XLSX from 'xlsx';

/** Liste ordonnée des champs numériques d'une submission. */
export const SUBMISSION_NUMERIC_FIELDS = [
  'perm_associations', 'perm_conventions', 'perm_clubs',
  'perm_educative', 'perm_cultural', 'perm_sportive', 'perm_capacity',
  'outreach_educative', 'outreach_cultural', 'outreach_sportive', 'outreach_capacity',
  'camping_associations', 'camping_participants', 'camping_female', 'camping_male',
  'camping_rural', 'camping_urban', 'camping_facilitators', 'camping_trainings',
  'festivals_count', 'festivals_participants', 'festivals_qualified',
  'integration_trainings', 'integration_beneficiaries', 'integration_partners',
  'inst_updated', 'inst_in_progress', 'inst_dispute', 'inst_rehab_needs',
] as const;

export type SubmissionNumericField = (typeof SUBMISSION_NUMERIC_FIELDS)[number];

export const FIELD_LABELS_FR: Record<string, string> = {
  perm_associations: 'Associations (permanent)',
  perm_conventions: 'Conventions signées',
  perm_clubs: 'Clubs actifs',
  perm_educative: 'Bénéficiaires activités éducatives (permanent)',
  perm_cultural: 'Bénéficiaires activités culturelles (permanent)',
  perm_sportive: 'Bénéficiaires activités sportives (permanent)',
  perm_capacity: 'Bénéficiaires renforcement capacités (permanent)',
  outreach_educative: 'Bénéficiaires éducatives (rayonnant)',
  outreach_cultural: 'Bénéficiaires culturelles (rayonnant)',
  outreach_sportive: 'Bénéficiaires sportives (rayonnant)',
  outreach_capacity: 'Bénéficiaires renforcement capacités (rayonnant)',
  camping_associations: 'Associations partenaires camping',
  camping_participants: 'Participants camping',
  camping_female: 'Participantes filles camping',
  camping_male: 'Participants garçons camping',
  camping_rural: 'Participants ruraux camping',
  camping_urban: 'Participants urbains camping',
  camping_facilitators: 'Encadrants camping',
  camping_trainings: 'Formations camping',
  festivals_count: 'Nombre de festivals',
  festivals_participants: 'Participants festivals',
  festivals_qualified: 'Jeunes qualifiés festivals',
  integration_trainings: 'Formations intégration',
  integration_beneficiaries: 'Bénéficiaires intégration',
  integration_partners: 'Partenaires intégration',
  inst_updated: 'Établissements mis à jour',
  inst_in_progress: 'Établissements en cours',
  inst_dispute: 'Établissements en litige',
  inst_rehab_needs: 'Besoins réhabilitation',
};

/** Génère un fichier modèle .xlsx vierge à remplir. */
export const generateImportTemplate = (
  prefectures: { code: string; name_fr: string }[],
  year: number,
) => {
  const wb = XLSX.utils.book_new();

  // Feuille 1 : données à remplir (un onglet par préfecture, ou un tableau simple)
  const headerRow = ['code_prefecture', 'name_prefecture', 'year', 'status',
    ...SUBMISSION_NUMERIC_FIELDS];
  const sample = prefectures.map(p => [
    p.code, p.name_fr, year, 'brouillon',
    ...SUBMISSION_NUMERIC_FIELDS.map(() => 0),
  ]);
  const wsData = [headerRow, ...sample];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 8 }, { wch: 32 }, { wch: 6 }, { wch: 12 },
    ...SUBMISSION_NUMERIC_FIELDS.map(() => ({ wch: 14 })),
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Données');

  // Feuille 2 : dictionnaire des champs
  const dict = [
    ['Champ', 'Libellé français', 'Type', 'Obligatoire'],
    ['code_prefecture', 'Code de la direction préfectorale', 'Texte (3 lettres)', 'Oui'],
    ['name_prefecture', 'Nom (informatif)', 'Texte', 'Non'],
    ['year', 'Année de référence', 'Entier (ex : 2026)', 'Oui'],
    ['status', 'Statut', 'brouillon | soumise | validee', 'Oui'],
    ...SUBMISSION_NUMERIC_FIELDS.map(f => [f, FIELD_LABELS_FR[f] ?? f, 'Entier ≥ 0', 'Non (par défaut 0)']),
  ];
  const wsDict = XLSX.utils.aoa_to_sheet(dict);
  wsDict['!cols'] = [{ wch: 26 }, { wch: 48 }, { wch: 28 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsDict, 'Dictionnaire');

  // Feuille 3 : codes des préfectures
  const codes = [['Code', 'Nom'], ...prefectures.map(p => [p.code, p.name_fr])];
  const wsCodes = XLSX.utils.aoa_to_sheet(codes);
  wsCodes['!cols'] = [{ wch: 8 }, { wch: 38 }];
  XLSX.utils.book_append_sheet(wb, wsCodes, 'Préfectures');

  XLSX.writeFile(wb, `drj-cs-modele-import-${year}.xlsx`);
};

/** Parse un fichier Excel et renvoie les lignes brutes. */
export const parseImportFile = async (
  file: File,
): Promise<Record<string, any>[]> => {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: null, raw: true });
};
