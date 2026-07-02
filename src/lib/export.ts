import { supabase } from '@/integrations/supabase/client';
import { exportRawDataToExcel } from './excelExport';
import i18n from '@/i18n';


export const handleExportExcel = async () => {
    try {
      const { data, error } = await supabase
        .from('directions')
        .select(`
          nom_ar,
          nom_fr,
          rapports (
            trimestre, 
            activites (
              type_activite,
              nombre_associations,
              nombre_conventions,
              nombre_clubs,
              activites_educatives,
              activites_culturelles,
              activites_sportives,
              renforcement_capacites
            ),
            suivi_projets (
              statut,
              etablissement_id,
              created_at, 
              updated_at, 
              etablissements ( nom )
            ),
            fermetures (
              etablissement_id,
              autre_precision,
              types_fermeture ( * ) 
            ),
            participants (
              hommes,
              femmes,
              milieu_urbain,
              milieu_rural,
              enfants_marocains_etranger,
              besoins_specifiques,
              autre_programme,
              programmes_camping ( nom, nom_ar )
            ),
            encadrements (
              nombre_hommes,
              nombre_femmes,
              autre_niveau_formation,
              programmes_camping ( nom, nom_ar ),
              niveaux_formation ( nom, nom_ar )
            ),
            mouvements_associations (
              nom_association,
              type_mouvement,
              date_mouvement,
              beneficiaires
            ),
            formations (
              numero_session,
              centre,
              statistiques_formation (
                nombre_formateurs_hommes,
                nombre_formateurs_femmes,
                nombre_beneficiaires_hommes,
                nombre_beneficiaires_femmes
              )
            ),
            partenariats (
              nombre_conventions,
              autre_partenaire,
              types_partenaires ( nom )
            ),
            festivals (
            nom,
            statistiques_festivals (
              nombre_hommes,
              nombre_femmes,
              nbr_urbain,
              nbr_rural,
              nbr_participants_qualifies,
              nbr_provinces_participantes
            )
          ),
            activites_insertion (
              sujet,
              duree_valeur,
              unite_duree,
              types_partenaires (nom),
              stats_insertion (
                hommes,
                femmes,
                nbr_urbain,
                nbr_rural
              )
        )
    )
`)
        .order('nom_ar', { ascending: true });
  
      if (error) throw error;
      if (!data) return;
  
      const formattedData: any[] = []; 
      const trimestresList = ['t1', 't2', 't3', 't4'];
      const isAr = i18n.language === 'ar';
  
      data.forEach((dir: any) => {
        const baseDirName = isAr ? dir.nom_ar : dir.nom_fr;
        
        let totalPerm = { ass: 0, conv: 0, clubs: 0, edu: 0, cult: 0, sport: 0, renf: 0 };
        let totalRayon = { ass: 0, conv: 0, clubs: 0, edu: 0, cult: 0, sport: 0, renf: 0 };
  
        // Structures for aggregate total across all trimestres for this direction
        const globalProgObj: { [key: string]: any } = {};
        const globalFormations: any[] = [];
        const globalMouvements: any[] = [];
        const globalPartenariats: any[] = []; 
        const globalFestivals: any[] = [];
        const globalInsertion: any[] = [];
  
        trimestresList.forEach((trim) => {
          const rapport = dir.rapports?.find((r: any) => String(r.trimestre).trim().toLowerCase() === trim.toLowerCase());
          
          let actPermData = { ass: 0, conv: 0, clubs: 0, edu: 0, cult: 0, sport: 0, renf: 0 };
          let actRayonData = { ass: 0, conv: 0, clubs: 0, edu: 0, cult: 0, sport: 0, renf: 0 };
          const etablissementsData: any[] = []; 
  
          // Structure for current trimestre
          const currentProgObj: { [key: string]: any } = {};
          const currentMouvements: any[] = [];
          const currentFormations: any[] = [];
          const currentPartenariatsData: any[] = []; 
          const currentFestivals: any[] = [];
          const currentInsertion: any[] = [];
  
          if (rapport) {
            if (rapport.activites) {
              const actPerm = rapport.activites.find((a: any) => String(a.type_activite).trim().toLowerCase() === 'permanente');
              if (actPerm) {
                actPermData = { ass: actPerm.nombre_associations || 0, conv: actPerm.nombre_conventions || 0, clubs: actPerm.nombre_clubs || 0, edu: actPerm.activites_educatives || 0, cult: actPerm.activites_culturelles || 0, sport: actPerm.activites_sportives || 0, renf: actPerm.renforcement_capacites || 0 };
                totalPerm.ass += actPermData.ass; totalPerm.conv += actPermData.conv; totalPerm.clubs += actPermData.clubs; totalPerm.edu += actPermData.edu; totalPerm.cult += actPermData.cult; totalPerm.sport += actPermData.sport; totalPerm.renf += actPermData.renf;
              }
  
              const actRayon = rapport.activites.find((a: any) => String(a.type_activite).trim().toLowerCase() === 'rayonnante');
              if (actRayon) {
                actRayonData = { ass: actRayon.nombre_associations || 0, conv: actRayon.nombre_conventions || 0, clubs: actRayon.nombre_clubs || 0, edu: actRayon.activites_educatives || 0, cult: actRayon.activites_culturelles || 0, sport: actRayon.activites_sportives || 0, renf: actRayon.renforcement_capacites || 0 };
                totalRayon.ass += actRayonData.ass; totalRayon.conv += actRayonData.conv; totalRayon.clubs += actRayonData.clubs; totalRayon.edu += actRayonData.edu; totalRayon.cult += actRayonData.cult; totalRayon.sport += actRayonData.sport; totalRayon.renf += actRayonData.renf;
              }
            }
  
            if (rapport.suivi_projets && rapport.suivi_projets.length > 0) {
              const latestProjetsObj: { [key: string]: any } = {};
  
              rapport.suivi_projets.forEach((sp: any) => {
                const etabNameKey = String(sp.etablissements?.nom || '').trim().toLowerCase();
                if (!etabNameKey || etabNameKey === '-') return;
  
                const existingSp = latestProjetsObj[etabNameKey];
                const spDate = new Date(sp.updated_at || sp.created_at || 0).getTime();
                const existingDate = existingSp ? new Date(existingSp.updated_at || existingSp.created_at || 0).getTime() : 0;
  
                if (!existingSp || spDate >= existingDate) {
                  latestProjetsObj[etabNameKey] = sp;
                }
              });
  
              Object.values(latestProjetsObj).forEach((sp: any) => {
                const nomEtab = sp.etablissements?.nom || '-';
                let causeFermeture = '-';
                let autrePrecision = '-';
                
                if (sp.statut === 'ferme' && rapport.fermetures) {
                  const fermeture = rapport.fermetures.find((f: any) => f.etablissement_id === sp.etablissement_id);
                  
                  if (fermeture) {
                    if (fermeture.types_fermeture) {
                      causeFermeture = isAr 
                        ? (fermeture.types_fermeture.nom_ar || fermeture.types_fermeture.nom || 'سبب غير محدد')
                        : (fermeture.types_fermeture.nom_fr || fermeture.types_fermeture.nom || 'Cause non spécifiée');
                    }
  
                    if (fermeture.autre_precision !== undefined && fermeture.autre_precision !== null) {
                      autrePrecision = fermeture.autre_precision;
                    }
                  }
                }
  
                etablissementsData.push({ nom: nomEtab, statut: sp.statut, cause: causeFermeture, autre_precision: autrePrecision});
              });
            }
  
            // Processing Camping: Participants
            if (rapport.participants) {
              rapport.participants.forEach((p: any) => {
                const progName = isAr 
                  ? (p.programmes_camping?.nom_ar || p.programmes_camping?.nom || '-') 
                  : (p.programmes_camping?.nom || p.programmes_camping?.nom_ar || '-');
                
                [currentProgObj, globalProgObj].forEach((obj) => {
                  if (!obj[progName]) {
                    obj[progName] = { 
                      nom: progName, 
                      // autre_programme (initialization)
                      part: { hommes: 0, femmes: 0, urbain: 0, rural: 0, mre: 0, besoins: 0, autre_programme: "" }, 
                      encad: { hommes: 0, femmes: 0, autre_niveau_formation: "" } 
                    };
                  }
                  obj[progName].part.hommes += p.hommes || 0;
                  obj[progName].part.femmes += p.femmes || 0;
                  obj[progName].part.urbain += p.milieu_urbain || 0;
                  obj[progName].part.rural += p.milieu_rural || 0;
                  obj[progName].part.mre += p.enfants_marocains_etranger || 0;
                  obj[progName].part.besoins += p.besoins_specifiques || 0;
                  
                  // stockage: autre_programme
                  if (p.autre_programme) {
                    if (!obj[progName].part.autre_programme) {
                      obj[progName].part.autre_programme = p.autre_programme;
                    } else if (!obj[progName].part.autre_programme.includes(p.autre_programme)) {
                      obj[progName].part.autre_programme += ` / ${p.autre_programme}`;
                    }
                  }
                });
              });
            }
  
            //  Processing Camping: Encadrements
            if (rapport.encadrements) {
              rapport.encadrements.forEach((e: any) => {
                const progName = isAr 
                  ? (e.programmes_camping?.nom_ar || e.programmes_camping?.nom || '-') 
                  : (e.programmes_camping?.nom || e.programmes_camping?.nom_ar || '-');
  
                [currentProgObj, globalProgObj].forEach((obj) => {
                  if (!obj[progName]) {
                    obj[progName] = { 
                      nom: progName, 
                      part: { hommes: 0, femmes: 0, urbain: 0, rural: 0, mre: 0, besoins: 0, autre_programme: "" }, 
                      encad: { hommes: 0, femmes: 0, autre_niveau_formation: "" } 
                    };
                  }
                  obj[progName].encad.hommes += e.nombre_hommes || 0;
                  obj[progName].encad.femmes += e.nombre_femmes || 0;

                  if (e.autre_niveau_formation) {
                    if (!obj[progName].encad.autre_niveau_formation) {
                      obj[progName].encad.autre_niveau_formation = e.autre_niveau_formation;
                    } else if (!obj[progName].encad.autre_niveau_formation.includes(e.autre_niveau_formation)) {
                      obj[progName].encad.autre_niveau_formation += ` / ${e.autre_niveau_formation}`;
                    }
                  }
                });
              });
            }
  
            //  Processing Camping: Mouvements Associations
            if (rapport.mouvements_associations) {
              rapport.mouvements_associations.forEach((m: any) => {
                const movItem = {
                  nom: m.nom_association || '-',
                  type: m.type_mouvement || '-',
                  date: m.date_mouvement ? new Date(m.date_mouvement).toLocaleDateString() : '-',
                  beneficiaires: m.beneficiaires || 0
                };
                currentMouvements.push(movItem);
                globalMouvements.push(movItem);
              });
            }
  
            //  Processing Camping: Formations
            if (rapport.formations) {
              rapport.formations.forEach((f: any) => {
                const stats = f.statistiques_formation || {};
                const formItem = {
                  session: f.numero_session || 0,
                  centre: f.centre || '-',
                  formateurs_h: stats.nombre_formateurs_hommes || 0,
                  formateurs_f: stats.nombre_formateurs_femmes || 0,
                  benef_h: stats.nombre_beneficiaires_hommes || 0,
                  benef_f: stats.nombre_beneficiaires_femmes || 0
                };
                currentFormations.push(formItem);
                globalFormations.push(formItem);
              });
            }
  
            // Processing Partenariats / Conventions 
            if (rapport.partenariats && rapport.partenariats.length > 0) {
              rapport.partenariats.forEach((p: any) => {
                const partItem = {
                  nombre_conventions: p.nombre_conventions || 0,
                  type_partenaire: { nom: p.types_partenaires?.nom || '-' },
                  autre_partenaire: p.autre_partenaire || null
                };
                currentPartenariatsData.push(partItem);
                globalPartenariats.push(partItem);
              });
            }

            
            // Processing Festivals
            if (rapport.festivals && rapport.festivals.length > 0) {
              rapport.festivals.forEach((f: any) => {
                const s = f.statistiques_festivals || {};
                const festItem = {
                  nom: f.nom || '-',
                  hommes: s.nombre_hommes || 0,
                  femmes: s.nombre_femmes || 0,
                  total: (s.nombre_hommes || 0) + (s.nombre_femmes || 0), 
                  urbain: s.nbr_urbain || 0,
                  rural: s.nbr_rural || 0,
                  qualifies: s.nbr_participants_qualifies || 0,
                  provinces: s.nbr_provinces_participantes || 0
                };
                currentFestivals.push(festItem);
                globalFestivals.push(festItem);
              });
            }

            // Processing Activités d'insertion
            if (rapport.activites_insertion) {
              rapport.activites_insertion.forEach((a: any) => {
                const s = a.stats_insertion || {};
                const insItem = {
                  sujet: a.sujet || '-',
                  partenaire: a.types_partenaires?.nom || '-',
                  autre_partenaire: a.autre_partenaire || null,
                  duree: `${a.duree_valeur || 0} ${a.unite_duree || ''}`,
                  hommes: s.hommes || 0,
                  femmes: s.femmes || 0,
                  total: (s.hommes || 0) + (s.femmes || 0),
                  urbain: s.nbr_urbain || 0,
                  rural: s.nbr_rural || 0
                };
                currentInsertion.push(insItem);
                globalInsertion.push(insItem);
              });
}
          }
  
          formattedData.push({
            directionName: baseDirName,
            trimestre: trim.toUpperCase(),
            activites: [
              { type_activite: 'permanente', nombre_associations: actPermData.ass, nombre_conventions: actPermData.conv, nombre_clubs: actPermData.clubs, activites_educatives: actPermData.edu, activites_culturelles: actPermData.cult, activites_sportives: actPermData.sport, renforcement_capacites: actPermData.renf },
              { type_activite: 'rayonnante', nombre_associations: actRayonData.ass, nombre_conventions: actRayonData.conv, nombre_clubs: actRayonData.clubs, activites_educatives: actRayonData.edu, activites_culturelles: actRayonData.cult, activites_sportives: actRayonData.sport, renforcement_capacites: actRayonData.renf }
            ],
            etablissements: etablissementsData,
            camping: {
              programmes: Object.values(currentProgObj),
              mouvements: currentMouvements,
              formations: currentFormations
            },
            partenariats: currentPartenariatsData,
            festivals: currentFestivals,
            insertion: currentInsertion
          });
        });
  
        // Push total object for this direction
        formattedData.push({
          directionName: baseDirName,
          trimestre: isAr ? 'المجموع' : 'Total',
          activites: [
            { type_activite: 'permanente', nombre_associations: totalPerm.ass, nombre_conventions: totalPerm.conv, nombre_clubs: totalPerm.clubs, activites_educatives: totalPerm.edu, activites_culturelles: totalPerm.cult, activites_sportives: totalPerm.sport, renforcement_capacites: totalPerm.renf },
            { type_activite: 'rayonnante', nombre_associations: totalRayon.ass, nombre_conventions: totalRayon.conv, nombre_clubs: totalRayon.clubs, activites_educatives: totalRayon.edu, activites_culturelles: totalRayon.cult, activites_sportives: totalRayon.sport, renforcement_capacites: totalRayon.renf }
          ],
          etablissements: [],
          camping: {
            programmes: Object.values(globalProgObj),
            mouvements: globalMouvements,
            formations: globalFormations
          },
          partenariats: globalPartenariats,
          festivals: globalFestivals,
          insertion: globalInsertion
        });
      });
  
      exportRawDataToExcel(formattedData, i18n.language);
  
    } catch (error) {
      console.error("Erreur lors de l'exportation:", error);
    }
  };
