import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useRef, useState } from "react";

export function useInfraPartenariats(rapportId: string | null, options?: { enabled?: boolean }) {
  const [conventions, setConventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const enabled = options?.enabled ?? true;

  const isInitialLoad = useRef(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. CHARGEMENT : Regroupement des projets par "sujet_convention"
  const fetchItems = useCallback(async () => {
    if (!enabled || !rapportId) {
      setConventions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    isInitialLoad.current = true;

    try {
      const { data, error } = await supabase
        .from("infra_projets_partenariat")
        .select("*")
        .eq("rapport_id", rapportId);

      if (error) throw error;

      const grouped = (data || []).reduce((acc: any[], row: any) => {
        let conv = acc.find((c) => c.sujet_convention === row.sujet_convention);

        if (!conv) {
          conv = {
            local_id: crypto.randomUUID(),
            sujet_convention: row.sujet_convention || "",
            projets: [],
          };
          acc.push(conv);
        }

        conv.projets.push({
          local_id: row.id,
          db_id: row.id,
          sujet_projet: row.sujet_projet || "",
          types_etablissements: row.types_etablissements || [],
          etablissement_id: row.etablissement_id || "",
          maitre_ouvrage_delegue: row.maitre_ouvrage_delegue || "",
          phase_projet: row.phase_projet || "",
          taux_avancement: Number(row.taux_avancement) || 0,
          observations: row.observations || "",
        });

        return acc;
      }, []);

      setConventions(grouped);
    } catch (err) {
      console.error("Erreur de récupération des partenariats :", err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 500);
    }
  }, [rapportId, enabled]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems, enabled]);

  // 2. SAUVEGARDE SÉCURISÉE : Séparation claire entre insertion et mise à jour
  const saveItems = useCallback(
    async (dataToSave: any[]) => {
      if (!rapportId) return;

      try {
        const toInsert: any[] = [];
        const toUpdate: any[] = [];
        const currentDbIds: string[] = [];

        dataToSave.forEach((conv) => {
          const sujetConv = conv.sujet_convention?.trim() || "Sans titre";

          (conv.projets || []).forEach((proj: any) => {
            const row: any = {
              rapport_id: rapportId,
              sujet_convention: sujetConv,
              sujet_projet: proj.sujet_projet?.trim() || "Nouveau projet",
              types_etablissements: proj.types_etablissements || [],
              etablissement_id:
                proj.etablissement_id && proj.etablissement_id !== "none"
                  ? proj.etablissement_id
                  : null,
              maitre_ouvrage_delegue: proj.maitre_ouvrage_delegue?.trim() || "",
              phase_projet:
                proj.phase_projet && proj.phase_projet !== "none" ? proj.phase_projet : null,
              taux_avancement: Number(proj.taux_avancement) || 0,
              observations: proj.observations?.trim() || "",
            };

            // Séparation : mise à jour pour les projets existants, insertion pour les nouveaux
            if (proj.db_id) {
              row.id = proj.db_id;
              currentDbIds.push(proj.db_id);
              toUpdate.push(row);
            } else {
              toInsert.push({ ...row, _temp_local_id: proj.local_id });
            }
          });
        });

        // Étape A : Supprimer les projets retirés de l'interface
        const { data: existingInDb } = await supabase
          .from("infra_projets_partenariat")
          .select("id")
          .eq("rapport_id", rapportId);

        if (existingInDb && existingInDb.length > 0) {
          const idsToDelete = existingInDb
            .map((item) => item.id)
            .filter((id) => !currentDbIds.includes(id));

          if (idsToDelete.length > 0) {
            await supabase.from("infra_projets_partenariat").delete().in("id", idsToDelete);
          }
        }

        // Étape B : Mettre à jour les projets existants (possédant déjà un ID)
        if (toUpdate.length > 0) {
          const { error: updateError } = await supabase
            .from("infra_projets_partenariat")
            .upsert(toUpdate, { onConflict: "id" });

          if (updateError) throw updateError;
        }

        // Étape C : Insérer les nouveaux projets sans fournir d'ID (génération automatique par PostgreSQL)
        if (toInsert.length > 0) {
          const payloadInsert = toInsert.map(({ _temp_local_id, ...rest }) => rest);
          const { data: insertedData, error: insertError } = await supabase
            .from("infra_projets_partenariat")
            .insert(payloadInsert)
            .select("id, sujet_convention, sujet_projet");

          if (insertError) throw insertError;

          // Étape D : Réassigner les identifiants générés à l'état local
          if (insertedData && insertedData.length > 0) {
            setConventions((prev) =>
              prev.map((c) => ({
                ...c,
                projets: c.projets.map((p) => {
                  if (p.db_id) return p;
                  const matched = insertedData.find(
                    (s) =>
                      s.sujet_convention === c.sujet_convention &&
                      s.sujet_projet === p.sujet_projet,
                  );
                  return matched ? { ...p, db_id: matched.id, local_id: matched.id } : p;
                }),
              })),
            );
          }
        }
      } catch (err) {
        console.error("Erreur lors de l'enregistrement des partenariats :", err);
      }
    },
    [rapportId],
  );

  // 3. AUTO-SAVE AVEC DÉBOUNCE (1.5s)
  useEffect(() => {
    if (isInitialLoad.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      void saveItems(conventions);
    }, 1500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [conventions, saveItems]);

  return { conventions, setConventions, loading };
}