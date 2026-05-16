import { PDFViewer } from "@react-pdf/renderer";
import { QuotePdfDocument } from "./QuotePdfDocument";
import type {
  CompanyInfo,
  QuoteInfo,
  QuoteItem,
  QuoteTemplateId,
} from "../types/types";

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
  return (
    <PDFViewer className={className}>
      <QuotePdfDocument
        company={company}
        quote={quote}
        items={items}
        templateId={templateId}
      />
    </PDFViewer>
  );
};
