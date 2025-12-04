import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import type { CompanyInfo, QuoteInfo, QuoteItem } from '../types/types';

interface Props {
  items: QuoteItem[];
  company: CompanyInfo;
  quote: QuoteInfo;
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  headerRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // LOGO
  logoWrapper: {
    flexDirection: 'row',
  },
  logoBox: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  companyInfo: {
    paddingTop: '20px',
    display: 'flex',
  },
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerTitleBlock: {
    width: 150,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    width: 60,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e6e6e6',
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  cell: {
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderColor: '#000',
  },
  colCode: { width: 45 },
  colUnit: { width: 40 },
  colDesc: { flex: 1 },
  colQty: { width: 40, textAlign: 'right' },
  colSg: { width: 40 },
  colUnitPrice: { width: 70, textAlign: 'right' },
  colTotal: { width: 70, textAlign: 'right' },
  totals: {
    marginTop: 50,
    alignItems: 'flex-end',
  },
});

const formatMoney = (value: number, currency: 'USD' | 'CLP' = 'USD') => {
  const locale = currency === 'CLP' ? 'es-CL' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'CLP' ? 0 : 2,
    maximumFractionDigits: currency === 'CLP' ? 0 : 2,
  }).format(value);
};

export const QuotePdfDocument = ({ company, quote, items }: Props) => {
  const currency: 'USD' | 'CLP' =
    (quote.currency as 'USD' | 'CLP') ??
    (company.defaultCurrency as 'USD' | 'CLP') ??
    'USD';

  const subtotal = items.reduce(
    (acc, it) => acc + it.quantity * it.unitPrice,
    0
  );

  const currencyLabel = currency === 'CLP' ? 'CLP' : 'USD';

  const formatIssueDate = (value: string) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-');
      return `${day}/${month}/${year}`;
    }
    return value;
  };

  const ivaRate = 0.16;
  const iva = subtotal * ivaRate;
  const total = subtotal + iva;

  return (
    <Document>
      <Page
        size="LETTER"
        style={styles.page}
      >
        {/* CABECERA CON LOGO */}
        <View style={styles.headerRow}>
          {/* IZQUIERDA: LOGO + DATOS EMPRESA */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoBox}>
              {company.logoUrl ? (
                <Image
                  src={company.logoUrl}
                  style={styles.logoImage}
                />
              ) : (
                <Text>LOGO</Text> // placeholder si no hay logo
              )}
            </View>
          </View>

          {/* DERECHA: TÍTULO Y FECHA */}
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>PRESUPUESTO</Text>
            <Text>Fecha emisión: {formatIssueDate(quote.issueDate)}</Text>
            <Text>Moneda: {currencyLabel}</Text>
          </View>
        </View>
        {/* Datos Empresa */}
        <View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text>RIF. : {company.rif}</Text>
            <Text>TELÉFONO : {company.phone}</Text>
            <Text>DIRECCIÓN : {company.addressLines}</Text>
          </View>
        </View>

        {/* DATOS OBRA / CLIENTE */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>OBRA :</Text>
            <Text style={styles.value}>{quote.work}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>CLIENTE :</Text>
            <Text style={styles.value}>{quote.client}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>RIF :</Text>
            <Text style={styles.value}>{quote.clientRif}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>DIRECCIÓN :</Text>
            <Text style={styles.value}>{quote.clientAddress}</Text>
          </View>
        </View>

        {/* TABLA */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.colCode]}>CÓDIGO</Text>
            <Text style={[styles.cell, styles.colUnit]}>UND</Text>
            <Text style={[styles.cell, styles.colDesc]}>DESCRIPCIÓN</Text>
            <Text style={[styles.cell, styles.colQty]}>CANT.</Text>
            <Text style={[styles.cell, styles.colSg]}>SG</Text>
            <Text style={[styles.cell, styles.colUnitPrice]}>P/UNITARIO</Text>
            <Text style={[styles.cell, styles.colTotal]}>PRECIO TOTAL</Text>
          </View>

          {items.map((item, idx) => {
            const lineTotal = item.quantity * item.unitPrice;
            return (
              <View
                key={idx}
                style={styles.tableRow}
              >
                <Text style={[styles.cell, styles.colCode]}>{item.code}</Text>
                <Text style={[styles.cell, styles.colUnit]}>{item.unit}</Text>
                <Text style={[styles.cell, styles.colDesc]}>
                  {item.description}
                </Text>
                <Text style={[styles.cell, styles.colQty]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.cell, styles.colSg]}>{item.sg}</Text>
                <Text style={[styles.cell, styles.colUnitPrice]}>
                  {formatMoney(item.unitPrice, currency)}
                </Text>
                <Text style={[styles.cell, styles.colTotal]}>
                  {formatMoney(lineTotal, currency)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* NOTA Y TOTALES */}
        <View style={styles.section}>
          <Text>
            Nota: El pago de los equipos electrónicos se realiza por adelantado.
          </Text>
          <Text>El precio puede variar según el tipo de cambio del dólar.</Text>
        </View>

        <View style={styles.totals}>
          <Text>SUB-TOTAL: {formatMoney(subtotal, quote.currency)}</Text>
          <Text>I.V.A. 16%: {formatMoney(iva, quote.currency)}</Text>
          <Text style={{ fontWeight: 'bold' }}>
            TOTAL: {formatMoney(total, quote.currency)}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
