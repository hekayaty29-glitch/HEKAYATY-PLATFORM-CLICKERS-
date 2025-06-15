import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Music } from "lucide-react";

// IMPORTANT: Tell pdfjs where to find its worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface OriginalPdfViewerProps {
  title: string;
  author: string;
  pdfUrl: string;
  audioUrl?: string;
}

const OriginalPdfViewer: React.FC<OriginalPdfViewerProps> = ({ title, author, pdfUrl, audioUrl }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const goPrevPage = () => setPageNumber((p) => Math.max(1, p - 1));
  const goNextPage = () => setPageNumber((p) => (numPages ? Math.min(numPages, p + 1) : p + 1));

  return (
    <div className="py-8 px-4 min-h-screen bg-gradient-to-br from-[#1A150E] via-[#2B2115] to-[#3D2914] text-center text-brown-dark">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-cinzel text-3xl md:text-4xl font-bold mb-1 text-amber-700 drop-shadow-sm">
          {title}
        </h1>
        <p className="mb-6 text-amber-500 italic">By {author}</p>

        {/* Optional soundtrack */}
        {audioUrl && (
          <div className="mb-6 flex items-center gap-3 justify-center">
            <Music className="h-5 w-5 text-amber-600" />
            <audio controls>
              <source src={audioUrl} />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center items-center gap-3 mb-4">
          <Button variant="outline" size="icon" onClick={goPrevPage} disabled={pageNumber <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            Page {pageNumber} {numPages ? `of ${numPages}` : ""}
          </div>
          <Button variant="outline" size="icon" onClick={goNextPage} disabled={!!numPages && pageNumber >= numPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Zoom */}
          <div className="ml-6 flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setScale((s) => Math.min(2.5, s + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF display */}
        <div className="parchment-page overflow-auto">
          <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<p className="py-10">Loading PDF…</p>}>
            <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
          </Document>
        </div>
      </div>
    </div>
  );
};

export default OriginalPdfViewer;
