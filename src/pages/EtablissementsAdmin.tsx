import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, Plus, Search, Edit2 } from "lucide-react";
import { toast } from "sonner";

type TypeEtablissement =
  | "maison_jeunes"
  | "club_feminin"
  | "ofppt"
  | "centre_socio_sportif"
  | "centre_protection_enfance"
  | "creche_publique";

export const EtablissementsAdmin = () => {
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [typeEtab, setTypeEtab] = useState<TypeEtablissement>("maison_jeunes");
  const [directionId, setDirectionId] = useState("");
  const [estActif, setEstActif] = useState<boolean>(true);

  const { data: etablissements = [], isLoading } = useQuery({
    queryKey: ["admin_etablissements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("etablissements")
        .select("*, direction:directions(nom_fr, nom_ar)")
        .order("nom");
      if (error) throw error;
      return data;
    },
  });

  const TYPE_ETAB_LABELS: Record<string, { fr: string; ar: string }> = {
    maison_jeunes: { fr: "Maison de Jeunes", ar: "دار الشباب" },
    club_feminin: { fr: "Club Féminin", ar: "النادي النسوي" },
    ofppt: { fr: "OFPPT", ar: "التكوين المهني (OFPPT)" },
    centre_socio_sportif: { fr: "Centre Socio-Sportif", ar: "المركز السوسيو رياضي" },
    centre_protection_enfance: { fr: "Centre Protection Enfance", ar: "مركز حماية الطفولة" },
    creche_publique: { fr: "Crèche Publique", ar: "روض الأطفال العمومي" },
  };

  const { data: directions = [] } = useQuery({
    queryKey: ["directions_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("directions")
        .select("id, nom_fr, nom_ar")
        .order("nom_fr");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nom,
        type_etablissement: typeEtab,
        direction_id: directionId || undefined,
        est_actif: estActif,
      };

      if (editingId) {
        const { error } = await supabase.from("etablissements").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("etablissements").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(
        editingId
          ? isAr
            ? "تم تعديل المؤسسة!"
            : "Établissement modifié !"
          : isAr
            ? "تم إنشاء المؤسسة!"
            : "Établissement créé !",
      );
      queryClient.invalidateQueries({ queryKey: ["admin_etablissements"] });
      handleCloseDialog();
    },
    onError: (err: any) => toast.error(isAr ? `خطأ: ${err.message}` : `Erreur : ${err.message}`),
  });

  const handleOpenEdit = (etab: any) => {
    setEditingId(etab.id);
    setNom(etab.nom);
    setTypeEtab(etab.type_etablissement || "maison_jeunes");
    setDirectionId(etab.direction_id || "");
    setEstActif(etab.est_actif ?? true);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setNom("");
    setTypeEtab("maison_jeunes");
    setDirectionId("");
    setEstActif(true);
  };

  const filtered = etablissements.filter(
    (e: any) =>
      e.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (isAr ? e.direction?.nom_ar : e.direction?.nom_fr)
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl gradient-hero p-6 sm:p-8 text-primary-foreground shadow-elegant">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="text-xs sm:text-sm font-semibold tracking-wider opacity-80 uppercase mb-1">
                {isAr ? "إدارة الشبكة" : "Gestion du Réseau"}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
                <Building2 className="h-7 w-7" />
                {isAr ? "إدارة المؤسسات" : "Gestion des Établissements"}
              </h1>
              <p className="text-sm sm:text-base opacity-90 mt-1">
                {isAr
                  ? "إضافة وتعديل المؤسسات التابعة للمديريات الإقليمية."
                  : "Configurez les maisons de jeunes, crèches et centres par direction."}
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  size="sm"
                  variant="secondary"
                  className="gap-1.5 bg-white/15 hover:bg-white/25 text-white font-bold border-0"
                >
                  <Plus className="h-4 w-4" /> {isAr ? "مؤسسة جديدة" : "Nouvel Établissement"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingId
                      ? isAr
                        ? "تعديل المؤسسة"
                        : "Modifier l'établissement"
                      : isAr
                        ? "إضافة مؤسسة"
                        : "Ajouter un établissement"}
                  </DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveMutation.mutate();
                  }}
                  className="space-y-4 py-2 text-start"
                >
                  <div>
                    <label className="text-sm font-medium">
                      {isAr ? "اسم المؤسسة" : "Nom de l'établissement"}
                    </label>
                    <Input
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      required
                      placeholder={isAr ? "مثال: دار الشباب أنفا" : "Ex: Maison de Jeunes Anfa"}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      {isAr ? "نوع المؤسسة" : "Type d'établissement"}
                    </label>
                    <Select
                      value={typeEtab}
                      onValueChange={(val: TypeEtablissement) => setTypeEtab(val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maison_jeunes">
                          {isAr ? "دار الشباب" : "Maison de Jeunes"}
                        </SelectItem>
                        <SelectItem value="club_feminin">
                          {isAr ? "النادي النسوي" : "Club Féminin"}
                        </SelectItem>
                        <SelectItem value="creche_publique">
                          {isAr ? "روض الأطفال العمومي" : "Crèche Publique"}
                        </SelectItem>
                        <SelectItem value="centre_protection_enfance">
                          {isAr ? "مركز حماية الطفولة" : "Centre Protection Enfance"}
                        </SelectItem>
                        <SelectItem value="centre_socio_sportif">
                          {isAr ? "المركز السوسيو رياضي" : "Centre Socio-Sportif"}
                        </SelectItem>
                        <SelectItem value="ofppt">
                          {isAr ? "التكوين المهني (OFPPT)" : "OFPPT"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      {isAr ? "المديرية الإقليمية" : "Direction Provinciale"}
                    </label>
                    <Select value={directionId} onValueChange={setDirectionId} required>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={isAr ? "اختر المديرية" : "Sélectionner la direction"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {directions.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>
                            {isAr ? d.nom_ar : d.nom_fr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      {isAr ? "الحالة في الشبكة" : "État dans le réseau"}
                    </label>
                    <Select
                      value={estActif ? "actif" : "inactif"}
                      onValueChange={(v) => setEstActif(v === "actif")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="actif">
                          {isAr ? "نشط (متاح في الشبكة)" : "Actif (Visible pour les saisies)"}
                        </SelectItem>
                        <SelectItem value="inactif">
                          {isAr ? "غير نشط / محذوف" : "Inactif / Supprimé du réseau"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full mt-4" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isAr ? (
                      "حفظ"
                    ) : (
                      "Enregistrer"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5">
            <div className="relative max-w-sm mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  isAr ? "البحث عن اسم أو مديرية..." : "Rechercher par nom ou direction..."
                }
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={isAr ? "text-right" : "text-left"}>
                    {isAr ? "الاسم" : "Nom"}
                  </TableHead>
                  <TableHead className={isAr ? "text-right" : "text-left"}>
                    {isAr ? "النوع" : "Type"}
                  </TableHead>
                  <TableHead className={isAr ? "text-right" : "text-left"}>
                    {isAr ? "المديرية" : "Direction"}
                  </TableHead>
                  <TableHead className={isAr ? "text-right" : "text-left"}>
                    {isAr ? "الحالة" : "Statut"}
                  </TableHead>
                  <TableHead className={isAr ? "text-left" : "text-right"}>
                    {isAr ? "إجراءات" : "Action"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {isAr ? "لم يتم العثور على أي مؤسسة." : "Aucun établissement trouvé."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nom}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.type_etablissement
                            ? (isAr
                                ? TYPE_ETAB_LABELS[item.type_etablissement]?.ar
                                : TYPE_ETAB_LABELS[item.type_etablissement]?.fr) ||
                              item.type_etablissement
                            : "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isAr ? item.direction?.nom_ar || "—" : item.direction?.nom_fr || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.est_actif ? "default" : "destructive"}
                          className={item.est_actif ? "bg-emerald-600" : ""}
                        >
                          {item.est_actif
                            ? isAr
                              ? "مفعل في الشبكة"
                              : "Actif dans le réseau"
                            : isAr
                              ? "غير مفعل"
                              : "Inactif / Retiré"}
                        </Badge>
                      </TableCell>
                      <TableCell className={isAr ? "text-left" : "text-right"}>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(item)}>
                          <Edit2 className="h-4 w-4 text-blue-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};
export default EtablissementsAdmin;
