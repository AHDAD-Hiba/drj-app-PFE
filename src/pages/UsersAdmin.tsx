import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/hooks/common/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, Search, ShieldCheck, Mail, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';

export const UsersAdmin = () => {
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AppRole>('directeur_prefectoral');
  const [directionId, setDirectionId] = useState<string>('');

  const { data: utilisateurs = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin_utilisateurs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('*, direction:directions(nom_fr, nom_ar)')
        .neq('role', 'admin')
        .order('nom');
      if (error) throw error;
      return data;
    },
  });

  const { data: directions = [] } = useQuery({
    queryKey: ['directions_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('directions').select('id, nom_fr, nom_ar').order('nom_fr');
      if (error) throw error;
      return data;
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email,
          password,
          nom,
          role,
          direction_id: role === 'directeur_prefectoral' ? directionId : null,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success(isAr ? "تم إنشاء المستخدم بنجاح!" : "Utilisateur créé avec succès !");
      queryClient.invalidateQueries({ queryKey: ['admin_utilisateurs'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(isAr ? `فشل: ${err.message}` : `Échec : ${err.message}`),
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, est_actif }: { id: string, est_actif: boolean }) => {
      const { error } = await supabase
        .from('utilisateurs')
        .update({ est_actif: !est_actif })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(isAr ? "تم تحديث الحالة." : "Statut mis à jour.");
      queryClient.invalidateQueries({ queryKey: ['admin_utilisateurs'] });
    },
    onError: () => toast.error(isAr ? "خطأ في تعديل الحالة." : "Erreur de modification du statut."),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userEmail: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail);
      if (error) throw error;
    },
    onSuccess: () => toast.success(isAr ? "تم إرسال بريد إعادة التعيين." : "Email de réinitialisation envoyé."),
    onError: (err: any) => toast.error(isAr ? `خطأ: ${err.message}` : `Erreur : ${err.message}`),
  });

  const resetForm = () => {
    setNom(''); setEmail(''); setPassword(''); setRole('directeur_prefectoral'); setDirectionId('');
  };

  const filteredUsers = utilisateurs.filter(u => 
    u.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        
        <div className="relative overflow-hidden rounded-2xl gradient-hero p-6 sm:p-8 text-primary-foreground shadow-elegant mb-6 md:mb-8">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="text-xs sm:text-sm font-semibold tracking-wider opacity-80 uppercase mb-1">
                {isAr ? 'فضاء الإدارة' : 'Espace Administration'}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
                <ShieldCheck className="h-7 w-7" />
                {isAr ? 'إدارة المستخدمين' : 'Gestion des Utilisateurs'}
              </h1>
              <p className="text-sm sm:text-base opacity-90 mt-1">
                {isAr ? 'إنشاء وإدارة حسابات المستخدمين وصلاحياتهم في المنصة.' : 'Créez, gérez et contrôlez les accès des directeurs et membres de la plateforme.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1.5 bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-sm font-bold transition-smooth"
                  >
                    <UserPlus className="h-4 w-4" />
                    {isAr ? 'مستخدم جديد' : 'Nouvel Utilisateur'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{isAr ? 'إضافة مستخدم' : 'Ajouter un utilisateur'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); createUserMutation.mutate(); }} className="space-y-4 py-2 text-start">
                    <div>
                      <label className="text-sm font-medium">{isAr ? 'الاسم الكامل' : 'Nom complet'}</label>
                      <Input value={nom} onChange={(e) => setNom(e.target.value)} required placeholder={isAr ? "أحمد بنعلي" : "Ex: Ahmed Benali"} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="ahmed@domaine.ma" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{isAr ? 'كلمة المرور المؤقتة' : 'Mot de passe temporaire'}</label>
                      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{isAr ? 'الصفة' : 'Rôle Métier'}</label>
                      <Select value={role} onValueChange={(val: AppRole) => setRole(val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="directeur_prefectoral">{isAr ? 'مدير إقليمي' : 'Directeur Préfectoral'}</SelectItem>
                          <SelectItem value="directeur_regional">{isAr ? 'مدير جهوي' : 'Directeur Régional'}</SelectItem>
                          <SelectItem value="equipe_regional">{isAr ? 'فريق جهوي' : 'Équipe Régionale'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {role === 'directeur_prefectoral' && (
                      <div>
                        <label className="text-sm font-medium">{isAr ? 'المديرية الإقليمية' : 'Direction Provinciale'}</label>
                        <Select value={directionId} onValueChange={setDirectionId} required>
                          <SelectTrigger><SelectValue placeholder={isAr ? 'اختر المديرية' : 'Sélectionner une direction'} /></SelectTrigger>
                          <SelectContent>
                            {directions.map((d) => (
                              <SelectItem key={d.id} value={d.id}>{isAr ? d.nom_ar : d.nom_fr}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button type="submit" className="w-full mt-4" disabled={createUserMutation.isPending}>
                      {createUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isAr ? 'إنشاء الحساب' : 'Créer le compte')}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="absolute -top-12 -end-12 w-48 h-48 rounded-full bg-secondary/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -start-8 w-40 h-40 rounded-full bg-primary-glow/40 blur-2xl pointer-events-none" />
        </div>

        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isAr ? 'البحث عن اسم أو بريد...' : 'Rechercher par nom ou email...'}
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/60">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={isAr ? 'text-right' : 'text-left'}>{isAr ? 'الاسم / البريد' : 'Nom / Email'}</TableHead>
                  <TableHead className={isAr ? 'text-right' : 'text-left'}>{isAr ? 'الصفة' : 'Rôle'}</TableHead>
                  <TableHead className={isAr ? 'text-right' : 'text-left'}>{isAr ? 'المديرية' : 'Direction'}</TableHead>
                  <TableHead className={isAr ? 'text-right' : 'text-left'}>{isAr ? 'الحالة' : 'Statut'}</TableHead>
                  <TableHead className={isAr ? 'text-left' : 'text-right'}>{isAr ? 'إجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                      {isAr ? 'لم يتم العثور على أي مستخدم.' : 'Aucun utilisateur trouvé.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u.id} className={`transition-colors hover:bg-muted/40 ${!u.est_actif ? 'opacity-60 bg-muted/20' : ''}`}>
                      <TableCell>
                        <div className="font-medium text-foreground">{u.nom}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'directeur_regional' ? 'default' : u.role === 'equipe_regional' ? 'secondary' : 'outline'}>
                          {u.role ? (isAr ? (u.role === 'directeur_prefectoral' ? 'مدير إقليمي' : u.role === 'directeur_regional' ? 'مدير جهوي' : 'فريق جهوي') : u.role.replace('_', ' ')) : 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {isAr ? (u.direction?.nom_ar || '—') : (u.direction?.nom_fr || '—')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.est_actif ? 'default' : 'destructive'} className={u.est_actif ? 'bg-emerald-600' : ''}>
                          {u.est_actif ? (isAr ? 'مفعل' : 'Actif') : (isAr ? 'معطل' : 'Désactivé')}
                        </Badge>
                      </TableCell>
                      <TableCell className={isAr ? 'text-left' : 'text-right'}>
                        <div className={`flex gap-1.5 ${isAr ? 'justify-start' : 'justify-end'}`}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            title={isAr ? "إرسال رابط إعادة التعيين" : "Envoyer lien de réinitialisation"}
                            onClick={() => resetPasswordMutation.mutate(u.email)}
                            disabled={resetPasswordMutation.isPending}
                          >
                            <Mail className="h-3.5 w-3.5 text-blue-600" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            title={u.est_actif ? (isAr ? "تعطيل الحساب" : "Désactiver le compte") : (isAr ? "تفعيل الحساب" : "Réactiver le compte")}
                            onClick={() => toggleUserStatusMutation.mutate({ id: u.id, est_actif: u.est_actif })}
                            disabled={toggleUserStatusMutation.isPending}
                          >
                            {u.est_actif ? <PowerOff className="h-3.5 w-3.5 text-red-600" /> : <Power className="h-3.5 w-3.5 text-emerald-600" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};
export default UsersAdmin;