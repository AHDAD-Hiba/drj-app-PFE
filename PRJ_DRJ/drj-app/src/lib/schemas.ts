import * as z from 'zod';

// Schema for 'activites' table - specifically for 'permanente' type
export const permanentActivitySchema = z.object({
  nombre_associations: z.number().int().min(0, { message: "Must be a non-negative number." }).default(0),
  nombre_conventions: z.number().int().min(0, { message: "Must be a non-negative number." }).default(0),
  nombre_clubs: z.number().int().min(0, { message: "Must be a non-negative number." }).default(0),
  activites_educatives: z.number().int().min(0, { message: "Must be a non-negative number." }).default(0),
  activites_culturelles: z.number().int().min(0, { message: "Must be a non-negative number." }).default(0),
  activites_sportives: z.number().int().min(0, { message: "Must be a non-negative number." }).default(0),
  renforcement_capacites: z.number().int().min(0, { message: "Must be a non-negative number." }).default(0),
});

export type PermanentActivityFormValues = z.infer<typeof permanentActivitySchema>;

// Schema for 'activites' table - specifically for 'rayonnante' type
export const rayonanteActivitySchema = z.object({
  nombre_associations: z.number().int().min(0, { message: "Must be a non-negative number." }).default(0),
  nombre_conventions: z.number().int().min(0, { message: "Must be a non-negative number." }).default(0),
  nombre_clubs: z.number().int().min(0, { message: "Must be a non-negative number." }).default(0),
  activites_educatives: z.number().int().min(0, { message: "Must be a non-negative number." }).default(0),
  activites_culturelles: z.number().int().min(0, { message: "Must be a non-negative number." }).default(0),
  activites_sportives: z.number().int().min(0, { message: "Must be a non-negative number." }).default(0),
  renforcement_capacites: z.number().int().min(0, { message: "Must be a non-negative number." }).default(0),
});

export type RayonanteActivityFormValues = z.infer<typeof rayonanteActivitySchema>;

// Schema for 'etablissements' table
export const etablissementSchema = z.object({
  id: z.string().optional(), // ID is optional for new entries
  nom: z.string().min(1, { message: "Nom de l'établissement est requis." }),
  direction_id: z.string(), // This will be set by the parent component
});

export type EtablissementFormValues = z.infer<typeof etablissementSchema>;

// Schema for 'suivi_projets' table
export const suiviProjetSchema = z.object({
  id: z.string().optional(), // ID is optional for new entries
  etablissement_id: z.string(), // Foreign key to etablissements
  rapport_id: z.string(), // Foreign key to rapports
  statut: z.enum(['nouvel', 'en_cours'], { message: "Statut du projet est requis." }), // Matches statut_projet_enum
});

export type SuiviProjetFormValues = z.infer<typeof suiviProjetSchema>;

// Combined schema for a single entry in Step3Etablissement, if they are managed together
export const etablissementProjectSchema = z.object({
  etablissement: etablissementSchema.omit({ direction_id: true }), // direction_id will be added during save
  suiviProjet: suiviProjetSchema.omit({ etablissement_id: true, rapport_id: true }), // These will be added during save
});

export type EtablissementProjectFormValues = z.infer<typeof etablissementProjectSchema>;

// Schema for 'types_fermeture' table (lookup)
export const typeFermetureSchema = z.object({
  id: z.string(),
  nom: z.string(),
});
export type TypeFermeture = z.infer<typeof typeFermetureSchema>;

// Schema for 'fermetures' table
export const fermetureSchema = z.object({
  id: z.string().optional(),
  etablissement_id: z.string(),
  rapport_id: z.string(),
  type_fermeture_id: z.string({ message: "Type de fermeture est requis." }),
});
export type FermetureFormValues = z.infer<typeof fermetureSchema>;

// Schema for 'programmes_camping' table (lookup)
export const programmeCampingSchema = z.object({
  id: z.string(),
  nom: z.string(),
});
export type ProgrammeCamping = z.infer<typeof programmeCampingSchema>;

// Schema for 'participants' table
export const participantSchema = z.object({
  id: z.string().optional(),
  rapport_id: z.string(),
  programme_id: z.string({ message: "Programme de camping est requis." }),
  hommes: z.number().int().min(0).default(0),
  femmes: z.number().int().min(0).default(0),
  besoins_specifiques: z.number().int().min(0).default(0),
  enfants_marocains_etranger: z.number().int().min(0).default(0),
  milieu_urbain: z.number().int().min(0).default(0),
  milieu_rural: z.number().int().min(0).default(0),
});
export type ParticipantFormValues = z.infer<typeof participantSchema>;

// Schema for 'niveaux_formation' table (lookup)
export const niveauFormationSchema = z.object({
  id: z.string(),
  nom: z.string(),
});
export type NiveauFormation = z.infer<typeof niveauFormationSchema>;

// Schema for 'encadrements' table
export const encadrementSchema = z.object({
  id: z.string().optional(),
  rapport_id: z.string(),
  programme_id: z.string({ message: "Programme de camping est requis." }),
  niveau_formation_id: z.string({ message: "Niveau de formation est requis." }),
  nombre_hommes: z.number().int().min(0).default(0),
  nombre_femmes: z.number().int().min(0).default(0),
});
export type EncadrementFormValues = z.infer<typeof encadrementSchema>;

// Schema for 'types_partenaires' table (lookup)
export const typePartenaireSchema = z.object({
  id: z.string(),
  nom: z.string(),
});
export type TypePartenaire = z.infer<typeof typePartenaireSchema>;

// Schema for 'partenariats' table
export const partenariatSchema = z.object({
  id: z.string().optional(),
  rapport_id: z.string(),
  type_partenaire_id: z.string({ message: "Type de partenaire est requis." }),
  nombre_conventions: z.number().int().min(0).default(0),
});
export type PartenariatFormValues = z.infer<typeof partenariatSchema>;

// Schema for 'festivals' table
export const festivalSchema = z.object({
  id: z.string().optional(),
  nom: z.string().min(1, { message: "Nom du festival est requis." }),
  rapport_id: z.string(),
});
export type FestivalFormValues = z.infer<typeof festivalSchema>;

// Schema for 'statistiques_festivals' table
export const statistiquesFestivalSchema = z.object({
  id: z.string().optional(),
  festival_id: z.string(), // Foreign key to festivals
  nombre_participants: z.number().int().min(0).default(0),
  nombre_hommes: z.number().int().min(0).default(0),
  nombre_femmes: z.number().int().min(0).default(0),
  nombre_regions: z.number().int().min(0).default(0),
  nbr_urbain: z.number().int().min(0).default(0),
  nbr_rural: z.number().int().min(0).default(0),
});
export type StatistiquesFestivalFormValues = z.infer<typeof statistiquesFestivalSchema>;

// Schema for 'activites_insertion' table
export const activiteInsertionSchema = z.object({
  id: z.string().optional(),
  rapport_id: z.string(),
  type_partenaire_id: z.string({ message: "Type de partenaire est requis." }).nullable(), // Can be nullable
  duree: z.string().optional().nullable(),
  sujet: z.string().optional().nullable(),
});
export type ActiviteInsertionFormValues = z.infer<typeof activiteInsertionSchema>;

// Schema for 'stats_insertion' table
export const statsInsertionSchema = z.object({
  id: z.string().optional(),
  activite_id: z.string(), // Foreign key to activites_insertion
  hommes: z.number().int().min(0).default(0),
  femmes: z.number().int().min(0).default(0),
  nbr_urbain: z.number().int().min(0).default(0),
  nbr_rural: z.number().int().min(0).default(0),
});
export type StatsInsertionFormValues = z.infer<typeof statsInsertionSchema>;

// Schema for 'categories_associations' table (lookup)
export const categorieAssociationSchema = z.object({
  id: z.string(),
  nom: z.string(),
});
export type CategorieAssociation = z.infer<typeof categorieAssociationSchema>;

// Schema for 'valeurs_associations' table
export const valeurAssociationSchema = z.object({
  id: z.string().optional(),
  rapport_id: z.string(),
  categorie_association_id: z.string({ message: "Catégorie d'association est requise." }),
  nombre_associations: z.number().int().min(0).default(0),
});
export type ValeurAssociationFormValues = z.infer<typeof valeurAssociationSchema>;

// Schema for 'mouvements_associations' table
export const mouvementAssociationSchema = z.object({
  id: z.string().optional(),
  rapport_id: z.string(),
  nom_association: z.string().min(1, { message: "Nom de l'association est requis." }),
  type_mouvement: z.enum(['entrante', 'sortante'], { message: "Type de mouvement est requis." }),
  date_mouvement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date doit être au format YYYY-MM-DD." }), // Assuming date string format
});
export type MouvementAssociationFormValues = z.infer<typeof mouvementAssociationSchema>;

// Schema for 'formations' table
export const formationSchema = z.object({
  id: z.string().optional(),
  rapport_id: z.string(),
  centre: z.string().min(1, { message: "Nom du centre est requis." }),
  numero_session: z.number().int().min(0).default(0),
});
export type FormationFormValues = z.infer<typeof formationSchema>;

// Schema for 'statistiques_formation' table
export const statistiquesFormationSchema = z.object({
  id: z.string().optional(),
  formation_id: z.string(), // Foreign key to formations
  nombre_beneficiaires_hommes: z.number().int().min(0).default(0),
  nombre_beneficiaires_femmes: z.number().int().min(0).default(0),
  nombre_formateurs_hommes: z.number().int().min(0).default(0),
  nombre_formateurs_femmes: z.number().int().min(0).default(0),
});
export type StatistiquesFormationFormValues = z.infer<typeof statistiquesFormationSchema>;

// Schema for 'suivi_remplissage' (used internally by useDraftSubmission)
export const suiviRemplissageSchema = z.object({
  id: z.string().optional(),
  rapport_id: z.string(),
  direction_id: z.string(),
  domaine_id: z.string(),
  statut: z.enum(['NON_COMMENCE', 'EN_COURS', 'TERMINE']),
});
export type SuiviRemplissageFormValues = z.infer<typeof suiviRemplissageSchema>;
