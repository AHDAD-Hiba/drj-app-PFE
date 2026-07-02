// lib/generatePdfHelper.ts
import html2canvas from 'html2canvas';
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { RegionalReportPDF } from './RegionalReportPDF';
// غنزيدو الإقليمي من بعد، خليتو كومونتير باش مايعطيكش إيرور دابا
// import { PrefecturalReportPDF } from './PrefecturalReportPDF'; 

export interface PdfReportData {
  type: 'REGIONAL' | 'PREFECTURAL';
  annee: number;
  trimestre: string;
  directionName?: string;
  kpis: {
    totalBeneficiaires: number;
    totalActivites: number;
    totalAssociations: number;
    projetsEnCours?: number;
  };
  chartsImages: {
    barChart?: string | null;
    pieChart?: string | null;
  };
}

const captureChartAsImage = async (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) return null;
  
  try {
    const canvas = await html2canvas(element, { 
      scale: 2,
      useCORS: true,
      logging: false
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error(`Erreur capture chart ${elementId}:`, error);
    return null;
  }
};

export const handleExportToPDF = async (
  reportData: Omit<PdfReportData, 'chartsImages'>, 
  lang: string,
  chartIds: { bar?: string, pie?: string } = {}
) => {
  try {
    const barChartImg = chartIds.bar ? await captureChartAsImage(chartIds.bar) : null;
    const pieChartImg = chartIds.pie ? await captureChartAsImage(chartIds.pie) : null;

    const fullData: PdfReportData = {
      ...reportData,
      chartsImages: { barChart: barChartImg, pieChart: pieChartImg }
    };

    // ملي نصاوبو التقرير الإقليمي غنبدلو هاد الكونديسيون
    const DocumentComponent = RegionalReportPDF; 
    /* const DocumentComponent = fullData.type === 'REGIONAL' 
      ? RegionalReportPDF 
      : PrefecturalReportPDF;
    */

      const doc = React.createElement(DocumentComponent, { data: fullData, lang });
      const asPdf = pdf(doc as any); // كنعطيوها الدوكيمون نيشان هنا
      const blob = await asPdf.toBlob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const fileName = fullData.type === 'REGIONAL'
      ? (lang === 'ar' ? `Rapport_Regional_${fullData.trimestre}_${fullData.annee}.pdf` : `Rapport_Regional_${fullData.trimestre}_${fullData.annee}.pdf`)
      : `Rapport_${fullData.directionName}_${fullData.trimestre}_${fullData.annee}.pdf`;
      
    link.download = fileName;
    link.click();
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Erreur générale export PDF:", error);
  }
};