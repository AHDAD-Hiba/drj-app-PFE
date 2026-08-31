import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { PdfReportData } from './generatePdfHelper';

// يلا بغيتي تدعم العربية، خصك تزيد شي فونت كيدعمها بحال هكا (اختياري حاليا)
// Font.register({ family: 'Cairo', src: '/fonts/Cairo-Regular.ttf' });

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    // fontFamily: 'Cairo', // حيد الكومونتير يلا زدتي الفونت
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottom: '2px solid #1e3a8a',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 5,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  kpiBox: {
    width: '30%',
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 5,
    textAlign: 'center',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#475569',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 5,
  },
  chartImage: {
    width: '100%',
    height: 'auto',
    marginVertical: 15,
  }
});

interface RegionalReportPDFProps {
  data: PdfReportData;
  lang: string;
}

export const RegionalReportPDF: React.FC<RegionalReportPDFProps> = ({ data, lang }) => {
  const isAr = lang === 'ar';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* --- الهيدر --- */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isAr ? 'التقرير الجهوي الشامل' : 'Rapport Régional Global'}
          </Text>
          <Text style={styles.subtitle}>
            {isAr ? `السنة: ${data.annee} - الفصل: ${data.trimestre}` : `Année: ${data.annee} - Trimestre: ${data.trimestre}`}
          </Text>
        </View>

        {/* --- الأرقام المهمة (KPIs) --- */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>{isAr ? 'المستفيدين' : 'Bénéficiaires'}</Text>
            <Text style={styles.kpiValue}>{data.kpis.totalBeneficiaires}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>{isAr ? 'الأنشطة' : 'Activités'}</Text>
            <Text style={styles.kpiValue}>{data.kpis.totalActivites}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>{isAr ? 'الجمعيات' : 'Associations'}</Text>
            <Text style={styles.kpiValue}>{data.kpis.totalAssociations}</Text>
          </View>
        </View>

        {/* --- المبيانات (Charts) --- */}
        {data.chartsImages?.barChart && (
          <View style={styles.section}>
            <Text style={{ fontSize: 16, marginBottom: 10 }}>
              {isAr ? 'توزيع الأنشطة حسب المديريات' : 'Répartition des activités par direction'}
            </Text>
            <Image src={data.chartsImages.barChart} style={styles.chartImage} />
          </View>
        )}

      </Page>
    </Document>
  );
};