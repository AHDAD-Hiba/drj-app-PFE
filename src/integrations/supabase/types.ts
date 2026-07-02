export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activites: {
        Row: {
          activites_culturelles: number | null
          activites_educatives: number | null
          activites_sportives: number | null
          created_at: string | null
          id: string
          nombre_associations: number | null
          nombre_clubs: number | null
          nombre_conventions: number | null
          rapport_id: string | null
          renforcement_capacites: number | null
          type_activite: Database["public"]["Enums"]["type_activite_enum"]
          updated_at: string | null
        }
        Insert: {
          activites_culturelles?: number | null
          activites_educatives?: number | null
          activites_sportives?: number | null
          created_at?: string | null
          id?: string
          nombre_associations?: number | null
          nombre_clubs?: number | null
          nombre_conventions?: number | null
          rapport_id?: string | null
          renforcement_capacites?: number | null
          type_activite: Database["public"]["Enums"]["type_activite_enum"]
          updated_at?: string | null
        }
        Update: {
          activites_culturelles?: number | null
          activites_educatives?: number | null
          activites_sportives?: number | null
          created_at?: string | null
          id?: string
          nombre_associations?: number | null
          nombre_clubs?: number | null
          nombre_conventions?: number | null
          rapport_id?: string | null
          renforcement_capacites?: number | null
          type_activite?: Database["public"]["Enums"]["type_activite_enum"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activites_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activites_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section2"
            referencedColumns: ["rapport_id"]
          },
          {
            foreignKeyName: "activites_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section5"
            referencedColumns: ["rapport_id"]
          },
        ]
      }
      activites_insertion: {
        Row: {
          autre_partenaire: string | null
          duree_valeur: number | null
          id: string
          rapport_id: string | null
          sujet: string | null
          type_partenaire_id: string | null
          unite_duree: Database["public"]["Enums"]["unite_duree_enum"] | null
        }
        Insert: {
          autre_partenaire?: string | null
          duree_valeur?: number | null
          id?: string
          rapport_id?: string | null
          sujet?: string | null
          type_partenaire_id?: string | null
          unite_duree?: Database["public"]["Enums"]["unite_duree_enum"] | null
        }
        Update: {
          autre_partenaire?: string | null
          duree_valeur?: number | null
          id?: string
          rapport_id?: string | null
          sujet?: string | null
          type_partenaire_id?: string | null
          unite_duree?: Database["public"]["Enums"]["unite_duree_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "activites_insertion_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activites_insertion_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section2"
            referencedColumns: ["rapport_id"]
          },
          {
            foreignKeyName: "activites_insertion_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section5"
            referencedColumns: ["rapport_id"]
          },
          {
            foreignKeyName: "activites_insertion_type_partenaire_id_fkey"
            columns: ["type_partenaire_id"]
            isOneToOne: false
            referencedRelation: "types_partenaires"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action_enum"]
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          utilisateur_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action_enum"]
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          utilisateur_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action_enum"]
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          utilisateur_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_utilisateur_id_fkey"
            columns: ["utilisateur_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      categories_associations: {
        Row: {
          id: string
          nom: string
          nom_ar: string | null
        }
        Insert: {
          id?: string
          nom: string
          nom_ar?: string | null
        }
        Update: {
          id?: string
          nom?: string
          nom_ar?: string | null
        }
        Relationships: []
      }
      demographie: {
        Row: {
          annee: number
          direction_id: string | null
          id: string
          population_jeune: number
          population_totale: number
        }
        Insert: {
          annee: number
          direction_id?: string | null
          id?: string
          population_jeune: number
          population_totale: number
        }
        Update: {
          annee?: number
          direction_id?: string | null
          id?: string
          population_jeune?: number
          population_totale?: number
        }
        Relationships: [
          {
            foreignKeyName: "demographie_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
        ]
      }
      directions: {
        Row: {
          adresse: string
          code: string | null
          email: string
          id: string
          nom_ar: string
          nom_fr: string
          region: string | null
          telephone: string | null
        }
        Insert: {
          adresse: string
          code?: string | null
          email: string
          id?: string
          nom_ar: string
          nom_fr: string
          region?: string | null
          telephone?: string | null
        }
        Update: {
          adresse?: string
          code?: string | null
          email?: string
          id?: string
          nom_ar?: string
          nom_fr?: string
          region?: string | null
          telephone?: string | null
        }
        Relationships: []
      }
      domaines: {
        Row: {
          code: string
          id: string
          nom_ar: string | null
          nom_fr: string
        }
        Insert: {
          code: string
          id?: string
          nom_ar?: string | null
          nom_fr: string
        }
        Update: {
          code?: string
          id?: string
          nom_ar?: string | null
          nom_fr?: string
        }
        Relationships: []
      }
      encadrements: {
        Row: {
          autre_niveau_formation: string | null
          created_at: string | null
          id: string
          niveau_formation_id: string | null
          nombre_femmes: number | null
          nombre_hommes: number | null
          programme_id: string | null
          rapport_id: string | null
          updated_at: string | null
        }
        Insert: {
          autre_niveau_formation?: string | null
          created_at?: string | null
          id?: string
          niveau_formation_id?: string | null
          nombre_femmes?: number | null
          nombre_hommes?: number | null
          programme_id?: string | null
          rapport_id?: string | null
          updated_at?: string | null
        }
        Update: {
          autre_niveau_formation?: string | null
          created_at?: string | null
          id?: string
          niveau_formation_id?: string | null
          nombre_femmes?: number | null
          nombre_hommes?: number | null
          programme_id?: string | null
          rapport_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encadrements_niveau_formation_id_fkey"
            columns: ["niveau_formation_id"]
            isOneToOne: false
            referencedRelation: "niveaux_formation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encadrements_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes_camping"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encadrements_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encadrements_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section2"
            referencedColumns: ["rapport_id"]
          },
          {
            foreignKeyName: "encadrements_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section5"
            referencedColumns: ["rapport_id"]
          },
        ]
      }
      etablissements: {
        Row: {
          direction_id: string | null
          est_actif: boolean | null
          id: string
          nom: string
        }
        Insert: {
          direction_id?: string | null
          est_actif?: boolean | null
          id?: string
          nom: string
        }
        Update: {
          direction_id?: string | null
          est_actif?: boolean | null
          id?: string
          nom?: string
        }
        Relationships: [
          {
            foreignKeyName: "etablissements_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
        ]
      }
      fermetures: {
        Row: {
          autre_precision: string | null
          etablissement_id: string | null
          id: string
          rapport_id: string | null
          type_fermeture_id: string | null
        }
        Insert: {
          autre_precision?: string | null
          etablissement_id?: string | null
          id?: string
          rapport_id?: string | null
          type_fermeture_id?: string | null
        }
        Update: {
          autre_precision?: string | null
          etablissement_id?: string | null
          id?: string
          rapport_id?: string | null
          type_fermeture_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fermetures_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fermetures_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fermetures_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section2"
            referencedColumns: ["rapport_id"]
          },
          {
            foreignKeyName: "fermetures_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section5"
            referencedColumns: ["rapport_id"]
          },
          {
            foreignKeyName: "fermetures_type_fermeture_id_fkey"
            columns: ["type_fermeture_id"]
            isOneToOne: false
            referencedRelation: "types_fermeture"
            referencedColumns: ["id"]
          },
        ]
      }
      festivals: {
        Row: {
          created_at: string | null
          id: string
          nom: string
          rapport_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nom: string
          rapport_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nom?: string
          rapport_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "festivals_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "festivals_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section2"
            referencedColumns: ["rapport_id"]
          },
          {
            foreignKeyName: "festivals_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section5"
            referencedColumns: ["rapport_id"]
          },
        ]
      }
      formations: {
        Row: {
          centre: string | null
          created_at: string | null
          id: string
          numero_session: number | null
          rapport_id: string | null
          updated_at: string | null
        }
        Insert: {
          centre?: string | null
          created_at?: string | null
          id?: string
          numero_session?: number | null
          rapport_id?: string | null
          updated_at?: string | null
        }
        Update: {
          centre?: string | null
          created_at?: string | null
          id?: string
          numero_session?: number | null
          rapport_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formations_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formations_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section2"
            referencedColumns: ["rapport_id"]
          },
          {
            foreignKeyName: "formations_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section5"
            referencedColumns: ["rapport_id"]
          },
        ]
      }
      mouvements_associations: {
        Row: {
          beneficiaires: number | null
          created_at: string | null
          date_mouvement: string
          id: string
          nom_association: string
          rapport_id: string | null
          type_mouvement: Database["public"]["Enums"]["type_mouvement_enum"]
          updated_at: string | null
        }
        Insert: {
          beneficiaires?: number | null
          created_at?: string | null
          date_mouvement: string
          id?: string
          nom_association: string
          rapport_id?: string | null
          type_mouvement: Database["public"]["Enums"]["type_mouvement_enum"]
          updated_at?: string | null
        }
        Update: {
          beneficiaires?: number | null
          created_at?: string | null
          date_mouvement?: string
          id?: string
          nom_association?: string
          rapport_id?: string | null
          type_mouvement?: Database["public"]["Enums"]["type_mouvement_enum"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mouvements_associations_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_associations_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section2"
            referencedColumns: ["rapport_id"]
          },
          {
            foreignKeyName: "mouvements_associations_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section5"
            referencedColumns: ["rapport_id"]
          },
        ]
      }
      niveaux_formation: {
        Row: {
          id: string
          nom: string
          nom_ar: string | null
        }
        Insert: {
          id?: string
          nom: string
          nom_ar?: string | null
        }
        Update: {
          id?: string
          nom?: string
          nom_ar?: string | null
        }
        Relationships: []
      }
      partenariats: {
        Row: {
          autre_partenaire: string | null
          created_at: string | null
          id: string
          nombre_conventions: number | null
          rapport_id: string | null
          type_partenaire_id: string | null
          updated_at: string | null
        }
        Insert: {
          autre_partenaire?: string | null
          created_at?: string | null
          id?: string
          nombre_conventions?: number | null
          rapport_id?: string | null
          type_partenaire_id?: string | null
          updated_at?: string | null
        }
        Update: {
          autre_partenaire?: string | null
          created_at?: string | null
          id?: string
          nombre_conventions?: number | null
          rapport_id?: string | null
          type_partenaire_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partenariats_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partenariats_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section2"
            referencedColumns: ["rapport_id"]
          },
          {
            foreignKeyName: "partenariats_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section5"
            referencedColumns: ["rapport_id"]
          },
          {
            foreignKeyName: "partenariats_type_partenaire_id_fkey"
            columns: ["type_partenaire_id"]
            isOneToOne: false
            referencedRelation: "types_partenaires"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          autre_programme: string | null
          besoins_specifiques: number | null
          created_at: string | null
          enfants_marocains_etranger: number | null
          femmes: number | null
          hommes: number | null
          id: string
          milieu_rural: number | null
          milieu_urbain: number | null
          programme_id: string | null
          rapport_id: string | null
          updated_at: string | null
        }
        Insert: {
          autre_programme?: string | null
          besoins_specifiques?: number | null
          created_at?: string | null
          enfants_marocains_etranger?: number | null
          femmes?: number | null
          hommes?: number | null
          id?: string
          milieu_rural?: number | null
          milieu_urbain?: number | null
          programme_id?: string | null
          rapport_id?: string | null
          updated_at?: string | null
        }
        Update: {
          autre_programme?: string | null
          besoins_specifiques?: number | null
          created_at?: string | null
          enfants_marocains_etranger?: number | null
          femmes?: number | null
          hommes?: number | null
          id?: string
          milieu_rural?: number | null
          milieu_urbain?: number | null
          programme_id?: string | null
          rapport_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "programmes_camping"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section2"
            referencedColumns: ["rapport_id"]
          },
          {
            foreignKeyName: "participants_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section5"
            referencedColumns: ["rapport_id"]
          },
        ]
      }
      programmes_camping: {
        Row: {
          id: string
          nom: string
          nom_ar: string | null
        }
        Insert: {
          id?: string
          nom: string
          nom_ar?: string | null
        }
        Update: {
          id?: string
          nom?: string
          nom_ar?: string | null
        }
        Relationships: []
      }
      rapports: {
        Row: {
          annee: number
          commentaire_validation: string | null
          created_at: string | null
          date_soumission: string | null
          date_validation: string | null
          direction_id: string | null
          id: string
          statut_rapport: Database["public"]["Enums"]["statut_rapport_enum"]
          trimestre: Database["public"]["Enums"]["trimestre_enum"] | null
          updated_at: string | null
          validateur_id: string | null
        }
        Insert: {
          annee: number
          commentaire_validation?: string | null
          created_at?: string | null
          date_soumission?: string | null
          date_validation?: string | null
          direction_id?: string | null
          id?: string
          statut_rapport?: Database["public"]["Enums"]["statut_rapport_enum"]
          trimestre?: Database["public"]["Enums"]["trimestre_enum"] | null
          updated_at?: string | null
          validateur_id?: string | null
        }
        Update: {
          annee?: number
          commentaire_validation?: string | null
          created_at?: string | null
          date_soumission?: string | null
          date_validation?: string | null
          direction_id?: string | null
          id?: string
          statut_rapport?: Database["public"]["Enums"]["statut_rapport_enum"]
          trimestre?: Database["public"]["Enums"]["trimestre_enum"] | null
          updated_at?: string | null
          validateur_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rapports_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapports_validateur_id_fkey"
            columns: ["validateur_id"]
            isOneToOne: false
            referencedRelation: "utilisateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      statistiques_festivals: {
        Row: {
          festival_id: string | null
          id: string
          nbr_participants_qualifies: number | null
          nbr_provinces_participantes: number | null
          nbr_rural: number | null
          nbr_urbain: number | null
          nombre_femmes: number | null
          nombre_hommes: number | null
        }
        Insert: {
          festival_id?: string | null
          id?: string
          nbr_participants_qualifies?: number | null
          nbr_provinces_participantes?: number | null
          nbr_rural?: number | null
          nbr_urbain?: number | null
          nombre_femmes?: number | null
          nombre_hommes?: number | null
        }
        Update: {
          festival_id?: string | null
          id?: string
          nbr_participants_qualifies?: number | null
          nbr_provinces_participantes?: number | null
          nbr_rural?: number | null
          nbr_urbain?: number | null
          nombre_femmes?: number | null
          nombre_hommes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "statistiques_festivals_festival_id_fkey"
            columns: ["festival_id"]
            isOneToOne: true
            referencedRelation: "festivals"
            referencedColumns: ["id"]
          },
        ]
      }
      statistiques_formation: {
        Row: {
          formation_id: string | null
          id: string
          nombre_beneficiaires_femmes: number | null
          nombre_beneficiaires_hommes: number | null
          nombre_formateurs_femmes: number | null
          nombre_formateurs_hommes: number | null
        }
        Insert: {
          formation_id?: string | null
          id?: string
          nombre_beneficiaires_femmes?: number | null
          nombre_beneficiaires_hommes?: number | null
          nombre_formateurs_femmes?: number | null
          nombre_formateurs_hommes?: number | null
        }
        Update: {
          formation_id?: string | null
          id?: string
          nombre_beneficiaires_femmes?: number | null
          nombre_beneficiaires_hommes?: number | null
          nombre_formateurs_femmes?: number | null
          nombre_formateurs_hommes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "statistiques_formation_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: true
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      stats_insertion: {
        Row: {
          activite_id: string | null
          femmes: number | null
          hommes: number | null
          id: string
          nbr_rural: number | null
          nbr_urbain: number | null
        }
        Insert: {
          activite_id?: string | null
          femmes?: number | null
          hommes?: number | null
          id?: string
          nbr_rural?: number | null
          nbr_urbain?: number | null
        }
        Update: {
          activite_id?: string | null
          femmes?: number | null
          hommes?: number | null
          id?: string
          nbr_rural?: number | null
          nbr_urbain?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stats_insertion_activite_id_fkey"
            columns: ["activite_id"]
            isOneToOne: true
            referencedRelation: "activites_insertion"
            referencedColumns: ["id"]
          },
        ]
      }
      suivi_projets: {
        Row: {
          created_at: string | null
          etablissement_id: string | null
          id: string
          rapport_id: string | null
          statut: Database["public"]["Enums"]["statut_projet_enum"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          etablissement_id?: string | null
          id?: string
          rapport_id?: string | null
          statut?: Database["public"]["Enums"]["statut_projet_enum"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          etablissement_id?: string | null
          id?: string
          rapport_id?: string | null
          statut?: Database["public"]["Enums"]["statut_projet_enum"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suivi_projets_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suivi_projets_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suivi_projets_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section2"
            referencedColumns: ["rapport_id"]
          },
          {
            foreignKeyName: "suivi_projets_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section5"
            referencedColumns: ["rapport_id"]
          },
        ]
      }
      suivi_remplissage: {
        Row: {
          direction_id: string | null
          domaine_id: string | null
          id: string
          progression_pourcentage: number | null
          rapport_id: string | null
          statut: Database["public"]["Enums"]["statut_remplissage_enum"]
          updated_at: string | null
        }
        Insert: {
          direction_id?: string | null
          domaine_id?: string | null
          id?: string
          progression_pourcentage?: number | null
          rapport_id?: string | null
          statut?: Database["public"]["Enums"]["statut_remplissage_enum"]
          updated_at?: string | null
        }
        Update: {
          direction_id?: string | null
          domaine_id?: string | null
          id?: string
          progression_pourcentage?: number | null
          rapport_id?: string | null
          statut?: Database["public"]["Enums"]["statut_remplissage_enum"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suivi_remplissage_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suivi_remplissage_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suivi_remplissage_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suivi_remplissage_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section2"
            referencedColumns: ["rapport_id"]
          },
          {
            foreignKeyName: "suivi_remplissage_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section5"
            referencedColumns: ["rapport_id"]
          },
        ]
      }
      types_fermeture: {
        Row: {
          id: string
          nom: string
          nom_ar: string | null
        }
        Insert: {
          id?: string
          nom: string
          nom_ar?: string | null
        }
        Update: {
          id?: string
          nom?: string
          nom_ar?: string | null
        }
        Relationships: []
      }
      types_partenaires: {
        Row: {
          id: string
          nom: string
          nom_ar: string | null
        }
        Insert: {
          id?: string
          nom: string
          nom_ar?: string | null
        }
        Update: {
          id?: string
          nom?: string
          nom_ar?: string | null
        }
        Relationships: []
      }
      utilisateurs: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          direction_id: string | null
          email: string
          id: string
          nom: string
          role: Database["public"]["Enums"]["role_enum"]
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          direction_id?: string | null
          email: string
          id?: string
          nom: string
          role: Database["public"]["Enums"]["role_enum"]
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          direction_id?: string | null
          email?: string
          id?: string
          nom?: string
          role?: Database["public"]["Enums"]["role_enum"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "utilisateurs_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
        ]
      }
      valeurs_associations: {
        Row: {
          categorie_association_id: string | null
          id: string
          nombre_associations: number | null
          rapport_id: string | null
        }
        Insert: {
          categorie_association_id?: string | null
          id?: string
          nombre_associations?: number | null
          rapport_id?: string | null
        }
        Update: {
          categorie_association_id?: string | null
          id?: string
          nombre_associations?: number | null
          rapport_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "valeurs_associations_categorie_association_id_fkey"
            columns: ["categorie_association_id"]
            isOneToOne: false
            referencedRelation: "categories_associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valeurs_associations_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valeurs_associations_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section2"
            referencedColumns: ["rapport_id"]
          },
          {
            foreignKeyName: "valeurs_associations_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section5"
            referencedColumns: ["rapport_id"]
          },
        ]
      }
    }
    Views: {
      v_dashboard_pref_score_jeunesse: {
        Row: {
          annee: number | null
          direction_id: string | null
          pref_etablissements_actifs: number | null
          pref_taux_couverture: number | null
          pref_taux_feminisation: number | null
          pref_total_activites: number | null
          pref_total_beneficiaires: number | null
          pref_total_partenariats: number | null
          rang_regional: number | null
          reg_etablissements_actifs: number | null
          reg_taux_couverture: number | null
          reg_taux_feminisation: number | null
          reg_total_activites: number | null
          reg_total_beneficiaires: number | null
          reg_total_partenariats: number | null
          region: string | null
          score_activites: number | null
          score_beneficiaires: number | null
          score_couverture: number | null
          score_etablissements: number | null
          score_feminisation: number | null
          score_jeunesse: number | null
          score_partenariats: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rapports_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
        ]
      }
      v_dashboard_pref_section1: {
        Row: {
          annee: number | null
          derniere_mise_a_jour: string | null
          direction_id: string | null
          domaine_id: string | null
          domaine_nom: string | null
          id: string | null
          progression_pourcentage: number | null
          rapport_id: string | null
          statut: Database["public"]["Enums"]["statut_remplissage_enum"] | null
          trimestre: Database["public"]["Enums"]["trimestre_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "rapports_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suivi_remplissage_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suivi_remplissage_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "rapports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suivi_remplissage_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section2"
            referencedColumns: ["rapport_id"]
          },
          {
            foreignKeyName: "suivi_remplissage_rapport_id_fkey"
            columns: ["rapport_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_pref_section5"
            referencedColumns: ["rapport_id"]
          },
        ]
      }
      v_dashboard_pref_section2: {
        Row: {
          etablissements_actifs: number | null
          rapport_id: string | null
          taux_couverture: number | null
          taux_feminisation: number | null
          taux_ruralite: number | null
          total_activites: number | null
          total_beneficiaires: number | null
          total_partenariats: number | null
        }
        Relationships: []
      }
      v_dashboard_pref_section2_annuel: {
        Row: {
          annee: number | null
          direction_id: string | null
          etablissements_actifs: number | null
          taux_couverture: number | null
          taux_feminisation: number | null
          taux_ruralite: number | null
          total_activites: number | null
          total_beneficiaires: number | null
          total_partenariats: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rapports_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
        ]
      }
      v_dashboard_pref_section3: {
        Row: {
          femmesPct: number | null
          hommesPct: number | null
          name: string | null
          rapport_id: string | null
          ruralPct: number | null
          total: number | null
          urbainPct: number | null
        }
        Relationships: []
      }
      v_dashboard_pref_section3_annuel: {
        Row: {
          annee: number | null
          direction_id: string | null
          femmesPct: number | null
          hommesPct: number | null
          name: string | null
          ruralPct: number | null
          total: number | null
          urbainPct: number | null
        }
        Relationships: []
      }
      v_dashboard_pref_section4: {
        Row: {
          annee: number | null
          Camping: number | null
          direction_id: string | null
          Festivals: number | null
          Formation: number | null
          Insertion: number | null
          name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rapports_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
        ]
      }
      v_dashboard_pref_section5: {
        Row: {
          annee: number | null
          direction_id: string | null
          pref_etablissements_actifs: number | null
          pref_taux_couverture: number | null
          pref_taux_feminisation: number | null
          pref_taux_ruralite: number | null
          pref_total_activites: number | null
          pref_total_beneficiaires: number | null
          pref_total_partenariats: number | null
          rapport_id: string | null
          reg_etablissements_actifs: number | null
          reg_taux_couverture: number | null
          reg_taux_feminisation: number | null
          reg_taux_ruralite: number | null
          reg_total_activites: number | null
          reg_total_beneficiaires: number | null
          reg_total_partenariats: number | null
          region: string | null
          trimestre: Database["public"]["Enums"]["trimestre_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "rapports_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
        ]
      }
      v_dashboard_pref_section5_annuel: {
        Row: {
          annee: number | null
          direction_id: string | null
          pref_etablissements_actifs: number | null
          pref_taux_couverture: number | null
          pref_taux_feminisation: number | null
          pref_taux_ruralite: number | null
          pref_total_activites: number | null
          pref_total_beneficiaires: number | null
          pref_total_partenariats: number | null
          reg_etablissements_actifs: number | null
          reg_taux_couverture: number | null
          reg_taux_feminisation: number | null
          reg_taux_ruralite: number | null
          reg_total_activites: number | null
          reg_total_beneficiaires: number | null
          reg_total_partenariats: number | null
          region: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rapports_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
        ]
      }
      v_dashboard_pref_section6_annuel: {
        Row: {
          act_assocs: number | null
          act_clubs: number | null
          act_conventions: number | null
          act_cult: number | null
          act_educ: number | null
          act_renf: number | null
          act_sport: number | null
          annee: number | null
          assoc_entrants: number | null
          assoc_sortants: number | null
          benef_entrants: number | null
          benef_sortants: number | null
          camp_benef_total: number | null
          camp_besoins_spec: number | null
          camp_mre: number | null
          camp_staff_f: number | null
          camp_staff_h: number | null
          camp_staff_total: number | null
          causes_fermeture_json: Json | null
          conv_total_global: number | null
          conv_types_distincts: number | null
          direction_id: string | null
          etab_en_cours: number | null
          etab_nouvel: number | null
          etab_total_fermes: number | null
          fest_femmes: number | null
          fest_hommes: number | null
          fest_provinces: number | null
          fest_qualifies: number | null
          fest_rural: number | null
          fest_total: number | null
          fest_urbain: number | null
          form_beneficiaires: number | null
          form_total_sessions: number | null
          ins_femmes: number | null
          ins_hommes: number | null
          ins_partenaires_actifs: number | null
          ins_rural: number | null
          ins_total_activites: number | null
          ins_urbain: number | null
          ins_volume_h: number | null
          repartition_partenaires_json: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "rapports_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
        ]
      }
      v_dashboard_reg_section1_annuel: {
        Row: {
          annee: number | null
          derniere_mise_a_jour: string | null
          direction_id: string | null
          domaine_id: string | null
          domaine_nom: string | null
          progression_pourcentage: number | null
          region: string | null
          statut: Database["public"]["Enums"]["statut_remplissage_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "rapports_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suivi_remplissage_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines"
            referencedColumns: ["id"]
          },
        ]
      }
      v_dashboard_reg_section2_annuel: {
        Row: {
          annee: number | null
          etablissements_actifs: number | null
          taux_couverture: number | null
          taux_feminisation: number | null
          total_activites: number | null
          total_beneficiaires: number | null
          total_partenariats: number | null
        }
        Relationships: []
      }
      v_dashboard_reg_section3_annuel: {
        Row: {
          act_culturelles: number | null
          act_educatives: number | null
          act_renforcement: number | null
          act_sportives: number | null
          annee: number | null
          total_femmes: number | null
          total_hommes: number | null
          total_rural: number | null
          total_urbain: number | null
        }
        Relationships: []
      }
      v_dashboard_reg_section4_trimestriel: {
        Row: {
          annee: number | null
          fermes: number | null
          fonctionnels: number | null
          nom_trimestre: string | null
          total_activites: number | null
          travaux: number | null
          trimestre: Database["public"]["Enums"]["trimestre_enum"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_create_next_report: {
        Args: {
          p_annee: number
          p_direction_id: string
          p_trimestre: Database["public"]["Enums"]["trimestre_enum"]
        }
        Returns: boolean
      }
      can_submit_report: {
        Args: { p_rapport_id: string }
        Returns: {
          can_submit: boolean
          domaines_termines: number
          total_domaines: number
        }[]
      }
      get_current_user: {
        Args: never
        Returns: {
          direction_id: string
          role: Database["public"]["Enums"]["role_enum"]
        }[]
      }
    }
    Enums: {
      audit_action_enum: "INSERT" | "UPDATE" | "DELETE"
      role_enum: "admin" | "directeur_prefectoral" | "directeur_regional"
      statut_projet_enum: "nouvel" | "en_cours" | "ferme"
      statut_rapport_enum:
        | "NON_COMMENCE"
        | "EN_COURS"
        | "SOUMIS"
        | "RETOUR_CORRECTION"
        | "VALIDE"
      statut_remplissage_enum: "NON_COMMENCE" | "EN_COURS" | "TERMINE"
      trimestre_enum: "t1" | "t2" | "t3" | "t4"
      type_activite_enum: "permanente" | "rayonnante"
      type_mouvement_enum: "entrante" | "sortante"
      unite_duree_enum: "heure" | "jour" | "semaine" | "mois"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      audit_action_enum: ["INSERT", "UPDATE", "DELETE"],
      role_enum: ["admin", "directeur_prefectoral", "directeur_regional"],
      statut_projet_enum: ["nouvel", "en_cours", "ferme"],
      statut_rapport_enum: [
        "NON_COMMENCE",
        "EN_COURS",
        "SOUMIS",
        "RETOUR_CORRECTION",
        "VALIDE",
      ],
      statut_remplissage_enum: ["NON_COMMENCE", "EN_COURS", "TERMINE"],
      trimestre_enum: ["t1", "t2", "t3", "t4"],
      type_activite_enum: ["permanente", "rayonnante"],
      type_mouvement_enum: ["entrante", "sortante"],
      unite_duree_enum: ["heure", "jour", "semaine", "mois"],
    },
  },
} as const