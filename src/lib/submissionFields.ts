// src/lib/submissionFields.ts

export const SUBMISSION_NUMERIC_FIELDS = [
    // Section A
    'perm_associations', 'perm_conventions', 'perm_clubs', 'perm_educative',
    'perm_cultural', 'perm_sportive', 'perm_capacity',
    // Section B
    'outreach_educative', 'outreach_cultural', 'outreach_sportive', 'outreach_capacity',
    // Section C
    'camping_associations', 'camping_participants', 'camping_female', 'camping_male',
    'camping_rural', 'camping_urban', 'camping_facilitators', 'camping_trainings',
    // Section D
    'festivals_count', 'festivals_participants', 'festivals_qualified',
    // Section E
    'integration_trainings', 'integration_beneficiaries', 'integration_partners',
    // Section F
    'inst_updated', 'inst_in_progress', 'inst_dispute', 'inst_rehab_needs'
  ] as const;
  
  export type SubmissionNumericField = typeof SUBMISSION_NUMERIC_FIELDS[number];