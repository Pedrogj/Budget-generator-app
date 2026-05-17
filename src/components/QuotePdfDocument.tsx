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
    fontSize: 10,
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
    alignItems: "center",
    justifyContent: "center",
  },
  logoPlaceholder: {
    color: colors.muted,
    fontSize: 9,
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
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 1,
  },
  metaText: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 1.15,
  },
  documentHeading: {
    width: 180,
    alignItems: "flex-end",
  },
  documentTitle: {
    fontSize: 20,
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
    fontSize: 9,
    fontWeight: "bold",
  },
  documentMeta: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 1.15,
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
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    minHeight: 10,
    marginBottom: 0,
  },
  detailLabel: {
    width: 58,
    color: colors.muted,
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  detailValue: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.15,
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
    fontSize: 9,
    lineHeight: 1.25,
  },
  headerCell: {
    color: "#ffffff",
    fontSize: 8,
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
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  noteText: {
    fontSize: 9,
    lineHeight: 1.4,
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
    fontSize: 9,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 10,
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
    fontSize: 10,
    fontWeight: "bold",
  },
  grandTotalValue: {
    color: "#ffffff",
    fontSize: 12,
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
  bold: {
    accent: "#dc2626",
    header: "#dc2626",
    panel: "#fff5f5",
    topBar: "#111111",
    tableHeader: "#111111",
    tableHeaderText: "#ffffff",
    statusBackground: "#fee2e2",
    statusText: "#991b1b",
    pagePadding: 24,
    rowMinHeight: 24,
    cellPadding: 6,
    footerMarginTop: 18,
    showTopBar: true,
  },
  corporate: {
    accent: "#fbbf24",
    header: "#111111",
    panel: "#fff8e1",
    topBar: "#111111",
    tableHeader: "#fbbf24",
    tableHeaderText: "#111111",
    statusBackground: "#fef3c7",
    statusText: "#92400e",
    pagePadding: 0,
    rowMinHeight: 22,
    cellPadding: 5,
    footerMarginTop: 14,
    showTopBar: false,
  },
};

const corporateStyles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#111111",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    height: 92,
    marginBottom: 18,
  },
  headerDark: {
    width: "58%",
    paddingHorizontal: 30,
    paddingTop: 22,
    backgroundColor: "#111111",
  },
  headerAccent: {
    width: 10,
    backgroundColor: "#fbbf24",
  },
  headerLight: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 30,
    backgroundColor: "#ffffff",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  brandMark: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "bold",
  },
  brandName: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  brandMeta: {
    marginTop: 2,
    color: "#d1d5db",
    fontSize: 8,
  },
  documentTitle: {
    color: "#fbbf24",
    fontSize: 23,
    fontWeight: "bold",
    marginBottom: 6,
  },
  documentMeta: {
    color: "#111111",
    fontSize: 8,
    lineHeight: 1.25,
    textAlign: "right",
  },
  content: {
    paddingHorizontal: 30,
    flex: 1,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 24,
    marginBottom: 18,
  },
  infoBlock: {
    flex: 1,
  },
  infoBlockRight: {
    width: 190,
  },
  sectionTitle: {
    color: "#fbbf24",
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  clientName: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 2,
  },
  detailText: {
    color: "#4b5563",
    fontSize: 9,
    lineHeight: 1.25,
  },
  methodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 2,
  },
  methodLabel: {
    color: "#111111",
    fontSize: 8,
    fontWeight: "bold",
  },
  methodValue: {
    color: "#4b5563",
    fontSize: 8,
    textAlign: "right",
  },
  table: {
    overflow: "hidden",
    borderRadius: 10,
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#fbbf24",
  },
  tableRow: {
    flexDirection: "row",
    minHeight: 24,
    backgroundColor: "#ffffff",
  },
  tableRowAlt: {
    backgroundColor: "#eeeeee",
  },
  tableCell: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    fontSize: 8.5,
    lineHeight: 1.25,
  },
  tableHeadCell: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    color: "#111111",
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  corpCode: { width: 38, textAlign: "center" },
  corpDesc: { flex: 1.8 },
  corpPrice: { width: 78, textAlign: "right" },
  corpQty: { width: 46, textAlign: "right" },
  corpTotal: { width: 82, textAlign: "right" },
  bottomGrid: {
    flexDirection: "row",
    gap: 24,
    alignItems: "flex-start",
  },
  terms: {
    flex: 1,
  },
  termsText: {
    color: "#4b5563",
    fontSize: 8,
    lineHeight: 1.35,
  },
  totals: {
    width: 190,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalLabel: {
    color: "#4b5563",
    fontSize: 8,
  },
  totalValue: {
    color: "#111111",
    fontSize: 8.5,
    fontWeight: "bold",
  },
  totalPill: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    backgroundColor: "#fbbf24",
  },
  totalPillText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  thanks: {
    marginTop: 18,
    color: "#111111",
    fontSize: 10,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 54,
    marginTop: "auto",
  },
  footerDark: {
    flex: 1,
    height: 54,
    paddingHorizontal: 30,
    paddingVertical: 13,
    backgroundColor: "#111111",
  },
  footerAccent: {
    width: 150,
    height: 54,
    backgroundColor: "#fbbf24",
  },
  footerText: {
    color: "#ffffff",
    fontSize: 8,
    lineHeight: 1.35,
  },
});

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

const formatPdfText = (value: string | number | undefined, fallback = "") => {
  const text = String(value ?? fallback).trim() || fallback;

  return text
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part) || part.length <= 24) return part;

      return part.match(/.{1,24}/g)?.join(" ") ?? part;
    })
    .join("");
};

const getCompanyInitials = (name: string) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials || "CO";
};

const CorporateQuotePdfDocument = ({ company, quote, items }: Props) => {
  const taxIdLabel = company.taxIdLabel ?? "RIF";
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
      <Page size="LETTER" style={corporateStyles.page}>
        <View style={corporateStyles.header}>
          <View style={corporateStyles.headerDark}>
            <View style={corporateStyles.brandRow}>
              <View style={corporateStyles.brandMark}>
                {company.logoUrl ? (
                  <Image src={company.logoUrl} style={styles.logoImage} />
                ) : (
                  <Text style={corporateStyles.brandMarkText}>
                    {getCompanyInitials(formatPdfText(company.name))}
                  </Text>
                )}
              </View>
              <View>
                <Text style={corporateStyles.brandName}>
                  {formatPdfText(company.name, "Tu empresa")}
                </Text>
                <Text style={corporateStyles.brandMeta}>
                  PRESUPUESTOS Y SERVICIOS
                </Text>
              </View>
            </View>
          </View>
          <View style={corporateStyles.headerAccent} />
          <View style={corporateStyles.headerLight}>
            <Text style={corporateStyles.documentTitle}>PRESUPUESTO</Text>
            <Text style={corporateStyles.documentMeta}>
              Fecha: {formatIssueDate(quote.issueDate)}
            </Text>
            <Text style={corporateStyles.documentMeta}>Moneda: {currency}</Text>
            <Text style={corporateStyles.documentMeta}>
              Ítems: {items.length}
            </Text>
          </View>
        </View>

        <View style={corporateStyles.content}>
          <View style={corporateStyles.infoGrid}>
            <View style={corporateStyles.infoBlock}>
              <Text style={corporateStyles.sectionTitle}>Presupuesto para</Text>
              <Text style={corporateStyles.clientName}>
                {formatPdfText(quote.client)}
              </Text>
              <Text style={corporateStyles.detailText}>
                {taxIdLabel}: {formatPdfText(quote.clientRif)}
              </Text>
              <Text style={corporateStyles.detailText}>
                Dirección: {formatPdfText(quote.clientAddress)}
              </Text>
              <Text style={corporateStyles.detailText}>
                Obra: {formatPdfText(quote.work)}
              </Text>
            </View>

            <View style={corporateStyles.infoBlockRight}>
              <Text style={corporateStyles.sectionTitle}>Datos de contacto</Text>
              <View style={corporateStyles.methodRow}>
                <Text style={corporateStyles.methodLabel}>Empresa</Text>
                <Text style={corporateStyles.methodValue}>
                  {formatPdfText(company.name)}
                </Text>
              </View>
              <View style={corporateStyles.methodRow}>
                <Text style={corporateStyles.methodLabel}>{taxIdLabel}</Text>
                <Text style={corporateStyles.methodValue}>
                  {formatPdfText(company.rif)}
                </Text>
              </View>
              <View style={corporateStyles.methodRow}>
                <Text style={corporateStyles.methodLabel}>Teléfono</Text>
                <Text style={corporateStyles.methodValue}>
                  {formatPdfText(company.phone)}
                </Text>
              </View>
            </View>
          </View>

          <View style={corporateStyles.table}>
            <View style={corporateStyles.tableHeader}>
              <Text style={[corporateStyles.tableHeadCell, corporateStyles.corpCode]}>
                No.
              </Text>
              <Text style={[corporateStyles.tableHeadCell, corporateStyles.corpDesc]}>
                Descripción
              </Text>
              <Text style={[corporateStyles.tableHeadCell, corporateStyles.corpPrice]}>
                Precio
              </Text>
              <Text style={[corporateStyles.tableHeadCell, corporateStyles.corpQty]}>
                Cant.
              </Text>
              <Text style={[corporateStyles.tableHeadCell, corporateStyles.corpTotal]}>
                Total
              </Text>
            </View>

            {items.map((item, index) => (
              <View
                key={`${item.description}-${index}`}
                style={[
                  corporateStyles.tableRow,
                  index % 2 === 1 ? corporateStyles.tableRowAlt : {},
                ]}
              >
                <Text style={[corporateStyles.tableCell, corporateStyles.corpCode]}>
                  {String(index + 1).padStart(2, "0")}
                </Text>
                <Text style={[corporateStyles.tableCell, corporateStyles.corpDesc]}>
                  {formatPdfText(item.description)}
                </Text>
                <Text style={[corporateStyles.tableCell, corporateStyles.corpPrice]}>
                  {formatMoney(item.unitPrice, currency)}
                </Text>
                <Text style={[corporateStyles.tableCell, corporateStyles.corpQty]}>
                  {item.quantity}
                </Text>
                <Text style={[corporateStyles.tableCell, corporateStyles.corpTotal]}>
                  {formatMoney(item.quantity * item.unitPrice, currency)}
                </Text>
              </View>
            ))}
          </View>

          <View style={corporateStyles.bottomGrid}>
            <View style={corporateStyles.terms}>
              <Text style={corporateStyles.sectionTitle}>
                Términos y condiciones
              </Text>
              {noteLines.length > 0 ? (
                noteLines.map((line, index) => (
                  <Text key={index} style={corporateStyles.termsText}>
                    {formatPdfText(line)}
                  </Text>
                ))
              ) : (
                <Text style={corporateStyles.termsText}>
                  Este presupuesto está sujeto a disponibilidad de materiales y
                  aprobación de las condiciones comerciales indicadas.
                </Text>
              )}
              <Text style={corporateStyles.thanks}>
                Gracias por confiar en nosotros.
              </Text>
            </View>

            <View style={corporateStyles.totals}>
              <View style={corporateStyles.totalRow}>
                <Text style={corporateStyles.totalLabel}>Subtotal</Text>
                <Text style={corporateStyles.totalValue}>
                  {formatMoney(subtotal, currency)}
                </Text>
              </View>
              <View style={corporateStyles.totalRow}>
                <Text style={corporateStyles.totalLabel}>IVA {ivaRatePercent}%</Text>
                <Text style={corporateStyles.totalValue}>
                  {formatMoney(iva, currency)}
                </Text>
              </View>
              <View style={corporateStyles.totalPill}>
                <Text style={corporateStyles.totalPillText}>Total</Text>
                <Text style={corporateStyles.totalPillText}>
                  {formatMoney(total, currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={corporateStyles.footer}>
          <View style={corporateStyles.footerDark}>
            <Text style={corporateStyles.footerText}>
              {formatPdfText(company.phone, "Teléfono no configurado")}  |{" "}
              {formatPdfText(company.rif)}
            </Text>
            <Text style={corporateStyles.footerText}>
              {formatPdfText(company.addressLines, "Dirección de la empresa")}
            </Text>
          </View>
          <View style={corporateStyles.footerAccent} />
        </View>
      </Page>
    </Document>
  );
};

export const QuotePdfDocument = ({
  company,
  quote,
  items,
  templateId = "professional",
}: Props) => {
  if (templateId === "corporate") {
    return (
      <CorporateQuotePdfDocument
        company={company}
        quote={quote}
        items={items}
        templateId={templateId}
      />
    );
  }

  const template = templateStyles[templateId] ?? templateStyles.professional;
  const taxIdLabel = company.taxIdLabel ?? "RIF";
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
              <Text style={styles.companyName}>
                {formatPdfText(company.name, "Tu empresa")}
              </Text>
              <Text style={styles.metaText}>
                {taxIdLabel}: {formatPdfText(company.rif)}
              </Text>
              <Text style={styles.metaText}>
                Teléfono: {formatPdfText(company.phone)}
              </Text>
              <Text style={styles.metaText}>
                Dirección: {formatPdfText(company.addressLines)}
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
              <Text style={styles.detailValue}>{formatPdfText(quote.client)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{taxIdLabel}</Text>
              <Text style={styles.detailValue}>
                {formatPdfText(quote.clientRif)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dirección</Text>
              <Text style={styles.detailValue}>
                {formatPdfText(quote.clientAddress)}
              </Text>
            </View>
          </View>

          <View style={[styles.detailPanel, { backgroundColor: template.panel }]}>
            <Text style={[styles.panelTitle, { color: template.accent }]}>
              Detalle del trabajo
            </Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Obra</Text>
              <Text style={styles.detailValue}>{formatPdfText(quote.work)}</Text>
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
                  {formatPdfText(item.code)}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.colUnit,
                    { paddingVertical: template.cellPadding },
                  ]}
                >
                  {formatPdfText(item.unit)}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.colDesc,
                    { paddingVertical: template.cellPadding },
                  ]}
                >
                  {formatPdfText(item.description)}
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
                  {formatPdfText(item.sg)}
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
                    {formatPdfText(line)}
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
