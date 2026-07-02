import {
  computeCompleteness,
  countCompleted,
  hasPositiveNumber,
  hasText,
} from '@/lib/formSchema';

export interface JeunesseCompletenessData {
  permanenteData?: any;
  rayonanteData?: any;
  facilities: any[];
  camps: any[];
  partenaires: any[];
  festivals: any[];
  socios: any[];
  associationValues: any[];
  formations: any[];
}

export function computeJeunesseCompleteness(data: JeunesseCompletenessData): number {
  const {
    permanenteData,
    rayonanteData,
    facilities,
    camps,
    partenaires,
    festivals,
    socios,
    associationValues,
    formations,
  } = data;

  // Completion is based on meaningful filled data, not quantitative totals.
  const hasPartnershipConventions = partenaires.some((partenaire: any) =>
    hasPositiveNumber(partenaire.nombre_conventions)
  );

  const closedFacilities = facilities.filter((facility: any) => facility.project_status === 'ferme');

  const hasFacilityEntries = facilities.some((facility: any) =>
    hasText(facility.name) ||
    hasText(facility.project_status) ||
    hasText(facility.other_status) ||
    hasText(facility.closure_status)
  );

  const hasRequiredClosureDetails =
    hasFacilityEntries &&
    (closedFacilities.length === 0 || closedFacilities.some((facility: any) =>
      hasText(facility.other_status) || hasText(facility.closure_status)
    ));

  const hasCampingParticipants = camps.some((camp: any) =>
    hasText(camp.programme_id) ||
    hasPositiveNumber(camp.girls) ||
    hasPositiveNumber(camp.boys)
  );

  const hasCampingAssociations = associationValues.some((association: any) =>
    hasPositiveNumber(association.nombre_associations)
  );

  const hasCampingFormations = formations.some((formation: any) =>
    hasText(formation.centre) ||
    hasPositiveNumber(formation.beneficiaries_girls) ||
    hasPositiveNumber(formation.beneficiaries_boys) ||
    hasPositiveNumber(formation.trainers_girls) ||
    hasPositiveNumber(formation.trainers_boys)
  );

  const hasCampingEncadrement = camps
    .flatMap((camp: any) => camp.encadrements ?? [])
    .some((encadrement: any) =>
      hasText(encadrement.niveau_formation_id) ||
      hasPositiveNumber(encadrement.nombre_femmes) ||
      hasPositiveNumber(encadrement.nombre_hommes)
    );

  const hasFestivalEntries = festivals.some((festival: any) =>
    hasText(festival.name) ||
    hasPositiveNumber(festival.participants_qualifies) ||
    hasPositiveNumber(festival.provinces_participantes) ||
    hasPositiveNumber(festival.rural) ||
    hasPositiveNumber(festival.urbain) ||
    hasPositiveNumber(festival.femmes) ||
    hasPositiveNumber(festival.hommes)
  );

  const hasSocioEntries = socios.some((item: any) =>
    hasText(item.sujet) ||
    hasPositiveNumber(item.duree_valeur) ||
    hasText(item.unite_duree) ||
    hasText(item.type_partenaire_id) ||
    hasPositiveNumber(item.femmes) ||
    hasPositiveNumber(item.hommes) ||
    hasPositiveNumber(item.rural) ||
    hasPositiveNumber(item.urbain)
  );

  const stepCompletions = [
    // Step 1 - Activités permanentes
    countCompleted([
      hasPositiveNumber(permanenteData?.nombre_associations),
      hasPositiveNumber(permanenteData?.nombre_conventions) || hasPartnershipConventions,
      hasPositiveNumber(permanenteData?.nombre_clubs),
      hasPositiveNumber(permanenteData?.activites_educatives),
      hasPositiveNumber(permanenteData?.activites_culturelles),
      hasPositiveNumber(permanenteData?.activites_sportives),
      hasPositiveNumber(permanenteData?.renforcement_capacites),
    ]),

    // Step 2 - Activités rayonnantes
    countCompleted([
      hasPositiveNumber(rayonanteData?.activites_educatives),
      hasPositiveNumber(rayonanteData?.activites_culturelles),
      hasPositiveNumber(rayonanteData?.activites_sportives),
      hasPositiveNumber(rayonanteData?.renforcement_capacites),
    ]),

    // Step 3 - Établissements
    countCompleted([
      hasFacilityEntries,
      facilities.some((facility: any) => hasText(facility.name)),
      facilities.some((facility: any) => hasText(facility.project_status)),
      hasRequiredClosureDetails,
    ]),

    // Step 4 - Camping
    countCompleted([
      hasCampingParticipants,
      hasCampingAssociations,
      hasCampingFormations,
      hasCampingEncadrement,
    ]),

    // Step 5 - Conventions
    countCompleted([
      partenaires.some((partenaire: any) => hasText(partenaire.type_partenaire_id)),
      hasPartnershipConventions,
    ]),

    // Step 6 - Festivals
    countCompleted([
      hasFestivalEntries,
      festivals.some((festival: any) => hasText(festival.name)),
      festivals.some((festival: any) =>
        hasPositiveNumber(festival.femmes) ||
        hasPositiveNumber(festival.hommes) ||
        hasPositiveNumber(festival.rural) ||
        hasPositiveNumber(festival.urbain)
      ),
      festivals.some((festival: any) =>
        hasPositiveNumber(festival.participants_qualifies) ||
        hasPositiveNumber(festival.provinces_participantes)
      ),
    ]),

    // Step 7 - Intégration socio-économique
    countCompleted([
      hasSocioEntries,
      socios.some((item: any) => hasText(item.sujet) || hasPositiveNumber(item.duree_valeur)),
      socios.some((item: any) => hasText(item.type_partenaire_id)),
      socios.some((item: any) =>
        hasPositiveNumber(item.femmes) ||
        hasPositiveNumber(item.hommes) ||
        hasPositiveNumber(item.rural) ||
        hasPositiveNumber(item.urbain)
      ),
    ]),
  ];

  return computeCompleteness(stepCompletions);
}