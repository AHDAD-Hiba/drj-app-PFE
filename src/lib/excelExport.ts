import * as XLSX from 'xlsx-js-style';


export interface DashboardExportData {
  suivi: { completedCount: number; inProgressCount: number; notStartedCount: number; total: number };
  kpiData: { total_beneficiaires: number; total_activites: number; etablissements_actifs: number; total_partenariats: number; taux_feminisation: number; taux_couverture: number };
  section3Data: { domaine_educatif: number; domaine_culturel: number; domaine_sportif: number; domaine_capacite: number; femmes: number; hommes: number; rural: number; urbain: number };
  evolutionActivites: Array<{ trimestre: string | number; total_activites: number }>;
  evolutionEtablissements: Array<{ trimestre: string | number; fonctionnels: number; travaux: number; fermes: number }>;
  rankedDirections: Array<{ id?: string; rang?: number; name: string; score: number; statut: string }>;
}

export interface RawDashboardData {
  directionName: string;
  trimestre: string; 
  activites: {
    type_activite: string; 
    nombre_associations: number | null;
    nombre_conventions: number | null;
    nombre_clubs: number | null;
    activites_educatives: number | null;
    activites_culturelles: number | null;
    activites_sportives: number | null;
    renforcement_capacites: number | null;
  }[];
  etablissements?: {
    nom: string;
    statut: string;
    cause: string;
    autre_precision: string;
  }[];
  camping?: {
    programmes: {
      nom: string;
      part: { hommes: number; femmes: number; urbain: number; rural: number; mre: number; besoins: number; autre_programme?: string};
      encad: { hommes: number; femmes: number; autre_niveau_formation?: string};
    }[];
    mouvements: {
      nom: string;
      type: string;
      date: string;
      beneficiaires: number;
    }[];
    formations: {
      session: number;
      centre: string;
      formateurs_h: number;
      formateurs_f: number;
      benef_h: number;
      benef_f: number;
    }[];
  };
  partenariats?: {
    nombre_conventions: number | null;
    type_partenaire?: { nom: string } | string | null; 
    type?: string | null; 
    autre_partenaire?: string | null;
  }[];
  festivals?: {
    nom: string;
    hommes: number;
    femmes: number;
    total: number;
    urbain: number;
    rural: number;
    qualifies: number;
    provinces: number;
  }[];
  insertion?: {
    sujet: string;
    partenaire: string;
    autre_partenaire?: string | null;
    duree: string;
    hommes: number;
    femmes: number;
    total: number;
    urbain: number;
    rural: number;
  }[];
}



const createStyledSheet = (data: any[], lang: string, rowsPerBlock: number = 1) => {
  const ws = XLSX.utils.json_to_sheet(data);
  
  if (lang === 'ar') {
    ws['!dir'] = 'rtl';
    ws['!views'] = [{ RTL: true }];
  }

  if (!ws['!ref']) return ws;
  const range = XLSX.utils.decode_range(ws['!ref']);
  const colsWidth: { wch: number }[] = [];

  // Dynamic Block & Total Detection
  const rowProperties = new Map<number, { isTotal: boolean, blockIndex: number }>();
  let currentBlockIndex = 0;

  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    let isTotal = false;
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell && (String(cell.v).trim().toLowerCase() === 'total' || String(cell.v).trim() === 'المجموع')) {
        isTotal = true;
        break; 
      }
    }
    
    rowProperties.set(R, { isTotal, blockIndex: currentBlockIndex });
    
    if (isTotal) {
      currentBlockIndex++;
    }
  }

  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxWidth = 15; 
    
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellRef];
      if (!cell) continue;

      const textLength = cell.v ? String(cell.v).length : 0;
      if (textLength > maxWidth) maxWidth = textLength;

      if (R === 0) {
        cell.s = {
          fill: { fgColor: { rgb: "1E3A8A" } },
          font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11, name: "Segoe UI" },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: { bottom: { style: "medium", color: { rgb: "000000" } } }
        };
      } else {
        let bgColor = R % 2 === 0 ? "F8FAFC" : "FFFFFF"; 
        let isBold = false;
        let borderBottomStyle = "thin";
        let borderBottomColor = "E2E8F0";

        const rowProps = rowProperties.get(R);

        // Color-Banding 
        if (rowsPerBlock > 1) {
          bgColor = (rowProps?.blockIndex || 0) % 2 === 0 ? "FFFFFF" : "F4F6F8"; 
        }

        if (rowProps?.isTotal) {
          bgColor = "E2E8F0"; 
          isBold = true;      
          borderBottomStyle = "medium"; 
          borderBottomColor = "94A3B8";
        }

        cell.s = {
          font: { sz: 10, name: "Segoe UI", bold: isBold },
          alignment: { 
            horizontal: typeof cell.v === 'number' ? "center" : (lang === 'ar' ? "right" : "left"), 
            vertical: "center"
          },
          fill: { fgColor: { rgb: bgColor } },
          border: { bottom: { style: borderBottomStyle, color: { rgb: borderBottomColor } } }
        };
      }
    }
    colsWidth.push({ wch: lang === 'ar' ? maxWidth + 8 : maxWidth + 4 });
  }

  ws['!cols'] = colsWidth;
  
  const rows: { hpt: number }[] = [];
  for (let i = 0; i <= range.e.r; i++) {
    rows.push({ hpt: i === 0 ? 35 : 25 });
  }
  ws['!rows'] = rows;

  return ws;
};

export const exportRawDataToExcel = (data: RawDashboardData[], lang: string) => {
  const wb = XLSX.utils.book_new();
  const fileName = lang === 'ar' ? 'أنشطة_المديريات_الإقليمية.xlsx' : 'Activites_Directions_Provinciales.xlsx';
  const isAr = lang === 'ar';

  // ==========================================
  // (Permanentes)
  // ==========================================
  const step1DataFormatted = data.map((row, index) => {
    const actPermanentes = row.activites?.find(a => String(a.type_activite).trim().toLowerCase() === 'permanente');
    
    return {
      [isAr ? "المديرية الإقليمية" : "Direction Provinciale"]: row.directionName,
      [isAr ? "الفصل" : "Trimestre"]: row.trimestre,
      [isAr ? "عدد الجمعيات" : "Nombre d'associations"]: actPermanentes?.nombre_associations || 0,
      [isAr ? "عدد الاتفاقيات الموقعة" : "Conventions signées"]: actPermanentes?.nombre_conventions || 0,
      [isAr ? "عدد الأندية" : "Nombre de clubs"]: actPermanentes?.nombre_clubs || 0,
      [isAr ? "الأنشطة التربوية" : "Activités éducatives"]: actPermanentes?.activites_educatives || 0,
      [isAr ? "الأنشطة الثقافية والفنية" : "Activités culturelles"]: actPermanentes?.activites_culturelles || 0,
      [isAr ? "الأنشطة الترفيهية والبدنية" : "Activités sportives"]: actPermanentes?.activites_sportives || 0,
      [isAr ? "تقوية القدرات" : "Renforcement des capacités"]: actPermanentes?.renforcement_capacites || 0,
    };
  });

  const wsStep1 = createStyledSheet(step1DataFormatted, lang, 5); 
  XLSX.utils.book_append_sheet(wb, wsStep1, isAr ? "الأنشطة القارة" : "Activités Permanentes");

  // ==========================================
  // (Rayonnantes)
  // ==========================================
  const step2DataFormatted = data.map((row, index) => {
    const actRayonnantes = row.activites?.find(a => String(a.type_activite).trim().toLowerCase() === 'rayonnante');
    
    return {
      [isAr ? "المديرية الإقليمية" : "Direction Provinciale"]: row.directionName,
      [isAr ? "الفصل" : "Trimestre"]: row.trimestre,
      [isAr ? "الأنشطة التربوية" : "Activités éducatives"]: actRayonnantes?.activites_educatives || 0,
      [isAr ? "الأنشطة الثقافية والفنية" : "Activités culturelles"]: actRayonnantes?.activites_culturelles || 0,
      [isAr ? "الأنشطة الترفيهية والبدنية" : "Activités sportives"]: actRayonnantes?.activites_sportives || 0,
      [isAr ? "تقوية القدرات" : "Renforcement des capacités"]: actRayonnantes?.renforcement_capacites || 0,
    };
  });

  const wsStep2 = createStyledSheet(step2DataFormatted, lang, 5); 
  XLSX.utils.book_append_sheet(wb, wsStep2, isAr ? "الأنشطة الإشعاعية" : "Activités Rayonnantes");

  // ==========================================
  // (Statut des Établissements)
  // ==========================================
  const step3DataFormatted: any[] = [];

  data.forEach((row, index) => {
    if (row.trimestre === 'Total' || row.trimestre === 'المجموع') {
      if (index < data.length - 1) {
        step3DataFormatted.push({
          [isAr ? "المديرية الإقليمية" : "Direction Provinciale"]: "",
          [isAr ? "الفصل" : "Trimestre"]: "",
          [isAr ? "اسم المؤسسة" : "Établissement"]: "",
          [isAr ? "الوضعية" : "Statut"]: "",
          [isAr ? "سبب الإغلاق" : "Cause de fermeture"]: "",
          [isAr ? "تفاصيل أخرى" : "Autre précision"]: "",
        });
      }
      return; 
    }

    if (row.etablissements && row.etablissements.length > 0) {
      row.etablissements.forEach((etab) => {
        let statutTraduit = etab.statut;
        
        if (isAr) {
          if (etab.statut === 'nouvel') statutTraduit = 'مؤسسة جديدة';
          else if (etab.statut === 'en_cours') statutTraduit = 'في طور الإنجاز';
          else if (etab.statut === 'ferme') statutTraduit = 'مغلقة';
        } else {
          if (etab.statut === 'nouvel') statutTraduit = 'Nouvel';
          else if (etab.statut === 'en_cours') statutTraduit = 'En cours';
          else if (etab.statut === 'ferme') statutTraduit = 'Fermé';
        }

        step3DataFormatted.push({
          [isAr ? "المديرية الإقليمية" : "Direction Provinciale"]: row.directionName,
          [isAr ? "الفصل" : "Trimestre"]: row.trimestre,
          [isAr ? "اسم المؤسسة" : "Établissement"]: etab.nom,
          [isAr ? "الوضعية" : "Statut"]: statutTraduit || etab.statut,
          [isAr ? "سبب الإغلاق" : "Cause de fermeture"]: etab.statut === 'ferme' ? etab.cause : '-',
          [isAr ? "تفاصيل أخرى" : "Autre précision"]: etab.statut === 'ferme' && etab.autre_precision ? etab.autre_precision : '-',
        });
      });
    } else {
      step3DataFormatted.push({
        [isAr ? "المديرية الإقليمية" : "Direction Provinciale"]: row.directionName,
        [isAr ? "الفصل" : "Trimestre"]: row.trimestre,
        [isAr ? "اسم المؤسسة" : "Établissement"]: "-",
        [isAr ? "الوضعية" : "Statut"]: "-",
        [isAr ? "سبب الإغلاق" : "Cause de fermeture"]: "-",
        [isAr ? "تفاصيل أخرى" : "Autre précision"]: "-",
      });
    }
  });

  if (step3DataFormatted.length > 0) {
    const wsStep3 = createStyledSheet(step3DataFormatted, lang, 1); 
    XLSX.utils.book_append_sheet(wb, wsStep3, isAr ? "وضعية المؤسسات" : "Statut Établissements");
  }

 // ==========================================
  // (Camp Participants)
  // ==========================================
  const campPartDataFormatted: any[] = [];

  data.forEach((row) => {
    const isTotal = row.trimestre === 'Total' || row.trimestre === 'المجموع';
    
    const prog = row.camping?.programmes?.[0];

    campPartDataFormatted.push({
      [isAr ? "المديرية الإقليمية" : "Direction Provinciale"]: row.directionName,
      [isAr ? "الفصل" : "Trimestre"]: row.trimestre,
      [isAr ? "البرنامج" : "Programme"]: prog ? prog.nom : "-",
      [isAr ? "برنامج آخر" : "Autre programme"]: prog && prog.part.autre_programme ? prog.part.autre_programme : "-",
      [isAr ? "المستفيدون (ذكور)" : "Bénéficiaires (H)"]: prog ? prog.part.hommes : 0,
      [isAr ? "المستفيدون (إناث)" : "Bénéficiaires (F)"]: prog ? prog.part.femmes : 0,
      [isAr ? "الوسط الحضري" : "Milieu urbain"]: prog ? prog.part.urbain : 0,
      [isAr ? "الوسط القروي" : "Milieu rural"]: prog ? prog.part.rural : 0,
      [isAr ? "أبناء المهاجرين" : "Enfants des immigrés"]: prog ? prog.part.mre : 0,
      [isAr ? "احتياجات خاصة" : "Besoins spécifiques"]: prog ? prog.part.besoins : 0,
      [isAr ? "التأطير (ذكور)" : "Encadrement (H)"]: prog ? prog.encad.hommes : 0,
      [isAr ? "التأطير (إناث)" : "Encadrement (F)"]: prog ? prog.encad.femmes : 0,
      [isAr ? "مستوى تكوين آخر" : "Autre niveau formation"]: prog?.encad?.autre_niveau_formation || "-",
    });

  });

  const wsCampPart = createStyledSheet(campPartDataFormatted, lang, 5);
  if (isAr) wsCampPart['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsCampPart, isAr ? "تخييم - المشاركون" : "Camping - Participants");


  // ==========================================
  // (Camp Mouvements)
  // ==========================================
  const campMovDataFormatted: any[] = [];

  data.forEach((row) => {
    const isTotal = row.trimestre === 'Total' || row.trimestre === 'المجموع';
    const mov = row.camping?.mouvements?.[0];

    campMovDataFormatted.push({
      [isAr ? "المديرية الإقليمية" : "Direction Provinciale"]: row.directionName,
      [isAr ? "الفصل" : "Trimestre"]: row.trimestre,
      [isAr ? "اسم الجمعية" : "Nom de l'association"]: mov ? mov.nom : "-",
      [isAr ? "نوع الحركة" : "Type de mouvement"]: mov ? mov.type : "-",
      [isAr ? "تاريخ الحركة" : "Date de mouvement"]: mov ? mov.date : "-",
      [isAr ? "عدد المستفيدين" : "Nombre de bénéficiaires"]: mov ? mov.beneficiaires : 0,
    });

  });

  const wsCampMov = createStyledSheet(campMovDataFormatted, lang, 5);
  if (isAr) wsCampMov['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsCampMov, isAr ? "تخييم - حركية الجمعيات" : "Camping - Mouvements");


  // ==========================================
  //  (Camp Formations)
  // ==========================================
  const campFormDataFormatted: any[] = [];

  data.forEach((row) => {
    const isTotal = row.trimestre === 'Total' || row.trimestre === 'المجموع';
    const form = row.camping?.formations?.[0];

    campFormDataFormatted.push({
      [isAr ? "المديرية الإقليمية" : "Direction Provinciale"]: row.directionName,
      [isAr ? "الفصل" : "Trimestre"]: row.trimestre,
      [isAr ? "رقم الدورة" : "N° Session"]: form ? form.session : "-",
      [isAr ? "مركز التكوين" : "Centre de formation"]: form ? form.centre : "-",
      [isAr ? "المكونون (ذكور)" : "Formateurs (H)"]: form ? form.formateurs_h : 0,
      [isAr ? "المكونون (إناث)" : "Formateurs (F)"]: form ? form.formateurs_f : 0,
      [isAr ? "المستفيدون (ذكور)" : "Bénéficiaires (H)"]: form ? form.benef_h : 0,
      [isAr ? "المستفيدون (إناث)" : "Bénéficiaires (F)"]: form ? form.benef_f : 0,
    });

  });

  const wsCampForm = createStyledSheet(campFormDataFormatted, lang, 5);
  if (isAr) wsCampForm['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsCampForm, isAr ? "تخييم - التكوينات" : "Camping - Formations");

  // ==========================================
  // (Conventions & Partenariats)
  // ==========================================
  const conventionsDataFormatted: any[] = [];

  data.forEach((row, index) => {
    const isTotal = row.trimestre === 'Total' || row.trimestre === 'المجموع';

    if (isTotal) {
      let totalConv = 0;
      if (row.partenariats) {
        row.partenariats.forEach((p: any) => {
          totalConv += p.nombre_conventions || 0;
        });
      }

      // Total
      conventionsDataFormatted.push({
        [isAr ? "المديرية الإقليمية" : "Direction Provinciale"]: row.directionName,
        [isAr ? "الفصل" : "Trimestre"]: row.trimestre,
        [isAr ? "نوع الشريك" : "Type de partenaire"]: "-",
        [isAr ? "شريك آخر" : "Autre partenaire"]: "-",
        [isAr ? "عدد الاتفاقيات" : "Nombre de conventions"]: totalConv,
      });
      return; 
    }

    // T1, T2, T3, T4
    if (row.partenariats && row.partenariats.length > 0) {
      row.partenariats.forEach((part: any) => {
        const typePartenaire = part.type_partenaire?.nom || part.type_partenaire || part.type || "-";
        
        conventionsDataFormatted.push({
          [isAr ? "المديرية الإقليمية" : "Direction Provinciale"]: row.directionName,
          [isAr ? "الفصل" : "Trimestre"]: row.trimestre,
          [isAr ? "نوع الشريك" : "Type de partenaire"]: typePartenaire,
          [isAr ? "شريك آخر" : "Autre partenaire"]: part.autre_partenaire || "-",
          [isAr ? "عدد الاتفاقيات" : "Nombre de conventions"]: part.nombre_conventions || 0,
        });
      });
    } else {
      conventionsDataFormatted.push({
        [isAr ? "المديرية الإقليمية" : "Direction Provinciale"]: row.directionName,
        [isAr ? "الفصل" : "Trimestre"]: row.trimestre,
        [isAr ? "نوع الشريك" : "Type de partenaire"]: "-",
        [isAr ? "شريك آخر" : "Autre partenaire"]: "-",
        [isAr ? "عدد الاتفاقيات" : "Nombre de conventions"]: 0,
      });
    }
  });

  if (conventionsDataFormatted.length > 0) {
    const wsConventions = createStyledSheet(conventionsDataFormatted, lang, 5); 
    XLSX.utils.book_append_sheet(wb, wsConventions, isAr ? "الشراكات" : "Conventions");
  }

 // ==========================================
  // (Festivals)
  // ==========================================
  const festivalsDataFormatted = [];

  data.forEach((row) => {
    const isTotal = row.trimestre === 'Total' || row.trimestre === 'المجموع';
    
    if (isTotal) {
      let totalHommes = 0, totalFemmes = 0, totalGlobal = 0, totalUrbain = 0, totalRural = 0, totalQualifies = 0, totalProvinces = 0;

      if (row.festivals && row.festivals.length > 0) {
        totalHommes = row.festivals.reduce((acc, f) => acc + (f.hommes || 0), 0);
        totalFemmes = row.festivals.reduce((acc, f) => acc + (f.femmes || 0), 0);
        totalGlobal = totalHommes + totalFemmes;
        totalUrbain = row.festivals.reduce((acc, f) => acc + (f.urbain || 0), 0);
        totalRural = row.festivals.reduce((acc, f) => acc + (f.rural || 0), 0);
        totalQualifies = row.festivals.reduce((acc, f) => acc + (f.qualifies || 0), 0);
        totalProvinces = row.festivals.reduce((acc, f) => acc + (f.provinces || 0), 0);
      }

      festivalsDataFormatted.push({
        [isAr ? "المديرية" : "Direction"]: row.directionName,
        [isAr ? "الفصل" : "Trimestre"]: row.trimestre,
        [isAr ? "المهرجان" : "Festival"]: "-",
        [isAr ? "الذكور" : "Hommes"]: totalHommes,
        [isAr ? "الإناث" : "Femmes"]: totalFemmes,
        [isAr ? "المجموع" : "Total"]: totalGlobal,
        [isAr ? "الوسط الحضري" : "Urbain"]: totalUrbain,
        [isAr ? "الوسط القروي" : "Rural"]: totalRural,
        [isAr ? "المتأهلون" : "Qualifiés"]: totalQualifies,
        [isAr ? "عدد الأقاليم" : "Provinces"]: totalProvinces,
      });
      return;
    }

    // T1, T2, T3, T4
    if (row.festivals && row.festivals.length > 0) {
      row.festivals.forEach((f) => {
        festivalsDataFormatted.push({
          [isAr ? "المديرية" : "Direction"]: row.directionName,
          [isAr ? "الفصل" : "Trimestre"]: row.trimestre,
          [isAr ? "المهرجان" : "Festival"]: f.nom || "-",
          [isAr ? "الذكور" : "Hommes"]: f.hommes || 0,
          [isAr ? "الإناث" : "Femmes"]: f.femmes || 0,
          [isAr ? "المجموع" : "Total"]: f.total || 0,
          [isAr ? "الوسط الحضري" : "Urbain"]: f.urbain || 0,
          [isAr ? "الوسط القروي" : "Rural"]: f.rural || 0,
          [isAr ? "المتأهلون" : "Qualifiés"]: f.qualifies || 0,
          [isAr ? "عدد الأقاليم" : "Provinces"]: f.provinces || 0,
        });
      });
    } else {
      festivalsDataFormatted.push({
        [isAr ? "المديرية" : "Direction"]: row.directionName,
        [isAr ? "الفصل" : "Trimestre"]: row.trimestre,
        [isAr ? "المهرجان" : "Festival"]: "-",
        [isAr ? "الذكور" : "Hommes"]: 0,
        [isAr ? "الإناث" : "Femmes"]: 0,
        [isAr ? "المجموع" : "Total"]: 0,
        [isAr ? "الوسط الحضري" : "Urbain"]: 0,
        [isAr ? "الوسط القروي" : "Rural"]: 0,
        [isAr ? "المتأهلون" : "Qualifiés"]: 0,
        [isAr ? "عدد الأقاليم" : "Provinces"]: 0,
      });
    }
  });

  if (festivalsDataFormatted.length > 0) {
    const wsFestivals = createStyledSheet(festivalsDataFormatted, lang, 1); 
    XLSX.utils.book_append_sheet(wb, wsFestivals, isAr ? "المهرجانات" : "Festivals");
  }

  // ==========================================
  // (Activités d'insertion)
  // ==========================================
  const insertionDataFormatted = [];

  data.forEach((row) => {
    const isTotal = row.trimestre === 'Total' || row.trimestre === 'المجموع';
    
    if (isTotal) {
      let totalH = 0, totalF = 0, totalUrbain = 0, totalRural = 0;

      if (row.insertion && row.insertion.length > 0) {
        totalH = row.insertion.reduce((acc, i) => acc + (i.hommes || 0), 0);
        totalF = row.insertion.reduce((acc, i) => acc + (i.femmes || 0), 0);
        totalUrbain = row.insertion.reduce((acc, i) => acc + (i.urbain || 0), 0);
        totalRural = row.insertion.reduce((acc, i) => acc + (i.rural || 0), 0);
      }

      insertionDataFormatted.push({
        [isAr ? "المديرية" : "Direction"]: row.directionName,
        [isAr ? "الفصل" : "Trimestre"]: row.trimestre, 
        [isAr ? "الموضوع" : "Sujet"]: "-", 
        [isAr ? "الشريك" : "Partenaire"]: "-",
        [isAr ? "شريك آخر" : "Autre partenaire"]: "-",
        [isAr ? "المدة" : "Durée"]: "-",
        [isAr ? "الذكور" : "Hommes"]: totalH,
        [isAr ? "الإناث" : "Femmes"]: totalF,
        [isAr ? "المجموع" : "Total"]: totalH + totalF,
        [isAr ? "الوسط الحضري" : "Urbain"]: totalUrbain,
        [isAr ? "الوسط القروي" : "Rural"]: totalRural,
      });
      return;
    }

    if (row.insertion && row.insertion.length > 0) {
      row.insertion.forEach((i) => {
        insertionDataFormatted.push({
          [isAr ? "المديرية" : "Direction"]: row.directionName,
          [isAr ? "الفصل" : "Trimestre"]: row.trimestre,
          [isAr ? "الموضوع" : "Sujet"]: i.sujet,
          [isAr ? "الشريك" : "Partenaire"]: i.partenaire,
          [isAr ? "شريك آخر" : "Autre partenaire"]: i.autre_partenaire || "-",
          [isAr ? "المدة" : "Durée"]: i.duree,
          [isAr ? "الذكور" : "Hommes"]: i.hommes,
          [isAr ? "الإناث" : "Femmes"]: i.femmes,
          [isAr ? "المجموع" : "Total"]: i.total,
          [isAr ? "الوسط الحضري" : "Urbain"]: i.urbain,
          [isAr ? "الوسط القروي" : "Rural"]: i.rural,
        });
      });
    } else {
      insertionDataFormatted.push({
        [isAr ? "المديرية" : "Direction"]: row.directionName,
        [isAr ? "الفصل" : "Trimestre"]: row.trimestre,
        [isAr ? "الموضوع" : "Sujet"]: "-",
        [isAr ? "الشريك" : "Partenaire"]: "-",
        [isAr ? "شريك آخر" : "Autre partenaire"]: "-",
        [isAr ? "المدة" : "Durée"]: "-",
        [isAr ? "الذكور" : "Hommes"]: 0,
        [isAr ? "الإناث" : "Femmes"]: 0,
        [isAr ? "المجموع" : "Total"]: 0,
        [isAr ? "الوسط الحضري" : "Urbain"]: 0,
        [isAr ? "الوسط القروي" : "Rural"]: 0,
      });
    }
  });

  if (insertionDataFormatted.length > 0) {
    const wsIns = createStyledSheet(insertionDataFormatted, lang, 1); 
    XLSX.utils.book_append_sheet(wb, wsIns, isAr ? "أنشطة الإدماج" : "Insertion");
  }

  // ==========================================
  // Téléchargement
  // ==========================================
  XLSX.writeFile(wb, fileName);
};