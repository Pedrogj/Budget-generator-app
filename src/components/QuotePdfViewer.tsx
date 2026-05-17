import { PDFViewer } from "@react-pdf/renderer";
import { useEffect, useState } from "react";
import { QuotePdfDocument } from "./QuotePdfDocument";
import type {
  CompanyInfo,
  QuoteInfo,
  QuoteItem,
  QuoteTemplateId,
} from "../types/types";
import { prepareCompanyLogoForPdf } from "../lib/companyLogoStorage";

interface Props {
  className?: string;
  company: CompanyInfo;
  quote: QuoteInfo;
  items: QuoteItem[];
  templateId: QuoteTemplateId;
}

export const QuotePdfViewer = ({
  className,
  company,
  quote,
  items,
  templateId,
}: Props) => {
  const [pdfCompany, setPdfCompany] = useState(company);

  useEffect(() => {
    let isMounted = true;

    const prepareLogo = async () => {
      const nextCompany = await prepareCompanyLogoForPdf(company);
      if (isMounted) {
        setPdfCompany(nextCompany);
      }
    };

    void prepareLogo();

    return () => {
      isMounted = false;
    };
  }, [company]);

  return (
    <PDFViewer className={className}>
      <QuotePdfDocument
        company={pdfCompany}
        quote={quote}
        items={items}
        templateId={templateId}
      />
    </PDFViewer>
  );
};
