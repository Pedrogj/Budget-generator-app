import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type {
  CompanyInfo,
  QuoteInfo,
  QuoteItem,
  QuoteTemplateId,
} from "../types/types";

interface Props {
  items: QuoteItem[];
  company: CompanyInfo;
  quote: QuoteInfo;
  templateId?: QuoteTemplateId;
}

const colors = {
  ink: "#111827",
  muted: "#6b7280",
  line: "#d1d5db",
  softLine: "#e5e7eb",
  panel: "#f8fafc",
  header: "#0f172a",
  accent: "#0284c7",
};

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: colors.ink,
    backgroundColor: "#ffffff",
  },
  topBar: {
    height: 5,
    marginBottom: 12,
    backgroundColor: colors.header,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 10,
  },
  companyHeader: {
    flexDirection: "row",
    gap: 9,
    flex: 1,
  },
  logoBox: {
    width: 54,
    height: 54,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  logoPlaceholder: {
    color: colors.muted,
    fontSize: 8,
    letterSpacing: 1,
  },
  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  companyInfo: {
    flex: 1,
    paddingTop: 0,
  },
  companyName: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 1,
  },
  metaText: {
    color: colors.muted,
    fontSize: 8,
    lineHeight: 1.05,
  },
  documentHeading: {
    width: 180,
    alignItems: "flex-end",
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.header,
    marginBottom: 4,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
    backgroundColor: "#e0f2fe",
    color: "#075985",
    fontSize: 8,
    fontWeight: "bold",
  },
  documentMeta: {
    color: colors.muted,
    fontSize: 8,
    lineHeight: 1.05,
    textAlign: "right",
  },
  detailGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  detailPanel: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.softLine,
    backgroundColor: colors.panel,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  panelTitle: {
    marginBottom: 3,
    color: colors.accent,
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 10,
    marginBottom: 0,
  },
  detailLabel: {
    width: 58,
    color: colors.muted,
    fontSize: 7,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  detailValue: {
    flex: 1,
    fontSize: 8,
    lineHeight: 1.05,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.header,
  },
  tableRow: {
    flexDirection: "row",
    minHeight: 24,
    borderTopWidth: 1,
    borderTopColor: colors.softLine,
  },
  tableRowAlt: {
    backgroundColor: "#fbfdff",
  },
  cell: {
    paddingHorizontal: 5,
    paddingVertical: 6,
    fontSize: 8,
    lineHeight: 1.25,
  },
  headerCell: {
    color: "#ffffff",
    fontSize: 7,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  colCode: { width: 52 },
  colUnit: { width: 42 },
  colDesc: { flex: 1.7 },
  colQty: { width: 40, textAlign: "right" },
  colSg: { width: 40 },
  colUnitPrice: { width: 76, textAlign: "right" },
  colTotal: { width: 80, textAlign: "right" },
  footerRow: {
    flexDirection: "row",
    gap: 18,
    marginTop: 18,
    alignItems: "flex-start",
  },
  notesPanel: {
    flex: 1,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    paddingLeft: 9,
    paddingTop: 2,
  },
  notesTitle: {
    marginBottom: 5,
    color: colors.muted,
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  noteText: {
    lineHeight: 1.35,
  },
  totalsPanel: {
    width: 190,
    borderWidth: 1,
    borderColor: colors.line,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.softLine,
  },
  totalLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 9,
    fontWeight: "bold",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.header,
  },
  grandTotalLabel: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "bold",
  },
  grandTotalValue: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },
});

const templateStyles: Record<
  QuoteTemplateId,
  {
    accent: string;
    header: string;
    panel: string;
    topBar: string;
    tableHeader: string;
    tableHeaderText: string;
    statusBackground: string;
    statusText: string;
    pagePadding: number;
    rowMinHeight: number;
    cellPadding: number;
    footerMarginTop: number;
    showTopBar: boolean;
  }
> = {
  professional: {
    accent: "#0284c7",
    header: "#0f172a",
    panel: "#f8fafc",
    topBar: "#0f172a",
    tableHeader: "#0f172a",
    tableHeaderText: "#ffffff",
    statusBackground: "#e0f2fe",
    statusText: "#075985",
    pagePadding: 24,
    rowMinHeight: 24,
    cellPadding: 6,
    footerMarginTop: 18,
    showTopBar: true,
  },
  classic: {
    accent: "#111827",
    header: "#111827",
    panel: "#ffffff",
    topBar: "#111827",
    tableHeader: "#e5e7eb",
    tableHeaderText: "#111827",
    statusBackground: "#ffffff",
    statusText: "#111827",
    pagePadding: 28,
    rowMinHeight: 24,
    cellPadding: 6,
    footerMarginTop: 18,
    showTopBar: false,
  },
  compact: {
    accent: "#0f766e",
    header: "#134e4a",
    panel: "#f0fdfa",
    topBar: "#0f766e",
    tableHeader: "#0f766e",
    tableHeaderText: "#ffffff",
    statusBackground: "#ccfbf1",
    statusText: "#134e4a",
    pagePadding: 18,
    rowMinHeight: 19,
    cellPadding: 4,
    footerMarginTop: 10,
    showTopBar: true,
  },
};

const formatMoney = (value: number, currency: "USD" | "CLP" = "USD") => {
  const locale = currency === "CLP" ? "es-CL" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "CLP" ? 0 : 2,
    maximumFractionDigits: currency === "CLP" ? 0 : 2,
  }).format(value);
};

const formatIssueDate = (value: string) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  return value;
};

export const QuotePdfDocument = ({
  company,
  quote,
  items,
  templateId = "professional",
}: Props) => {
  const template = templateStyles[templateId] ?? templateStyles.professional;
  const currency: "USD" | "CLP" =
    (quote.currency as "USD" | "CLP") ??
    (company.defaultCurrency as "USD" | "CLP") ??
    "USD";

  const subtotal = items.reduce(
    (acc, item) => acc + item.quantity * item.unitPrice,
    0,
  );
  const ivaRatePercent = company.ivaRate ?? 16;
  const iva = subtotal * (ivaRatePercent / 100);
  const total = subtotal + iva;
  const noteLines = (quote.notes ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <Document>
      <Page size="LETTER" style={[styles.page, { padding: template.pagePadding }]}>
        {template.showTopBar && (
          <View style={[styles.topBar, { backgroundColor: template.topBar }]} />
        )}

        <View style={styles.headerRow}>
          <View style={styles.companyHeader}>
            <View style={styles.logoBox}>
              {company.logoUrl ? (
                <Image src={company.logoUrl} style={styles.logoImage} />
              ) : (
                <Text style={styles.logoPlaceholder}>LOGO</Text>
              )}
            </View>

            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{company.name}</Text>
              <Text style={styles.metaText}>RIF/RUT: {company.rif}</Text>
              <Text style={styles.metaText}>Teléfono: {company.phone}</Text>
              <Text style={styles.metaText}>
                Dirección: {company.addressLines}
              </Text>
            </View>
          </View>

          <View style={styles.documentHeading}>
            <Text style={[styles.documentTitle, { color: template.header }]}>
              PRESUPUESTO
            </Text>
            <Text
              style={[
                styles.statusPill,
                {
                  backgroundColor: template.statusBackground,
                  color: template.statusText,
                },
              ]}
            >
              {currency}
            </Text>
            <Text style={styles.documentMeta}>
              Fecha emisión: {formatIssueDate(quote.issueDate)}
            </Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={[styles.detailPanel, { backgroundColor: template.panel }]}>
            <Text style={[styles.panelTitle, { color: template.accent }]}>
              Datos del cliente
            </Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cliente</Text>
              <Text style={styles.detailValue}>{quote.client}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>RIF/RUT</Text>
              <Text style={styles.detailValue}>{quote.clientRif}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dirección</Text>
              <Text style={styles.detailValue}>{quote.clientAddress}</Text>
            </View>
          </View>

          <View style={[styles.detailPanel, { backgroundColor: template.panel }]}>
            <Text style={[styles.panelTitle, { color: template.accent }]}>
              Detalle del trabajo
            </Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Obra</Text>
              <Text style={styles.detailValue}>{quote.work}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ítems</Text>
              <Text style={styles.detailValue}>{items.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableHeader, { backgroundColor: template.tableHeader }]}>
            <Text
              style={[
                styles.cell,
                styles.headerCell,
                styles.colCode,
                { color: template.tableHeaderText },
              ]}
            >
              Código
            </Text>
            <Text
              style={[
                styles.cell,
                styles.headerCell,
                styles.colUnit,
                { color: template.tableHeaderText },
              ]}
            >
              UND
            </Text>
            <Text
              style={[
                styles.cell,
                styles.headerCell,
                styles.colDesc,
                { color: template.tableHeaderText },
              ]}
            >
              Descripción
            </Text>
            <Text
              style={[
                styles.cell,
                styles.headerCell,
                styles.colQty,
                { color: template.tableHeaderText },
              ]}
            >
              Cant.
            </Text>
            <Text
              style={[
                styles.cell,
                styles.headerCell,
                styles.colSg,
                { color: template.tableHeaderText },
              ]}
            >
              SG
            </Text>
            <Text
              style={[
                styles.cell,
                styles.headerCell,
                styles.colUnitPrice,
                { color: template.tableHeaderText },
              ]}
            >
              P/unitario
            </Text>
            <Text
              style={[
                styles.cell,
                styles.headerCell,
                styles.colTotal,
                { color: template.tableHeaderText },
              ]}
            >
              Total
            </Text>
          </View>

          {items.map((item, index) => {
            const lineTotal = item.quantity * item.unitPrice;
            return (
              <View
                key={`${item.description}-${index}`}
                style={
                  index % 2 === 1
                    ? [
                        styles.tableRow,
                        styles.tableRowAlt,
                        { minHeight: template.rowMinHeight },
                      ]
                    : [styles.tableRow, { minHeight: template.rowMinHeight }]
                }
              >
                <Text
                  style={[
                    styles.cell,
                    styles.colCode,
                    { paddingVertical: template.cellPadding },
                  ]}
                >
                  {item.code}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.colUnit,
                    { paddingVertical: template.cellPadding },
                  ]}
                >
                  {item.unit}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.colDesc,
                    { paddingVertical: template.cellPadding },
                  ]}
                >
                  {item.description}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.colQty,
                    { paddingVertical: template.cellPadding },
                  ]}
                >
                  {item.quantity}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.colSg,
                    { paddingVertical: template.cellPadding },
                  ]}
                >
                  {item.sg}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.colUnitPrice,
                    { paddingVertical: template.cellPadding },
                  ]}
                >
                  {formatMoney(item.unitPrice, currency)}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.colTotal,
                    { paddingVertical: template.cellPadding },
                  ]}
                >
                  {formatMoney(lineTotal, currency)}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.footerRow, { marginTop: template.footerMarginTop }]}>
          <View style={[styles.notesPanel, { borderLeftColor: template.accent }]}>
            {noteLines.length > 0 && (
              <>
                <Text style={styles.notesTitle}>Notas</Text>
                {noteLines.map((line, index) => (
                  <Text key={index} style={styles.noteText}>
                    {line}
                  </Text>
                ))}
              </>
            )}
          </View>

          <View style={styles.totalsPanel}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>SUBTOTAL</Text>
              <Text style={styles.totalValue}>
                {formatMoney(subtotal, currency)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IVA {ivaRatePercent}%</Text>
              <Text style={styles.totalValue}>
                {formatMoney(iva, currency)}
              </Text>
            </View>
            <View style={[styles.grandTotalRow, { backgroundColor: template.header }]}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>
                {formatMoney(total, currency)}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
