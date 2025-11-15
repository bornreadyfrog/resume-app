"use client";

import { useState, useEffect } from "react";

let html2pdf: any = null;

interface ResumePreviewProps {
  html: string;
  jobTitle: string;
}

export default function ResumePreview({ html, jobTitle }: ResumePreviewProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Load html2pdf only on client side
    import("html2pdf.js").then((module) => {
      html2pdf = module.default;
    });
  }, []);

  const handleDownloadPDF = () => {
    const element = document.getElementById("resume-preview");
    if (!element) return;

    const opt: any = {
      margin: 10,
      filename: `resume-tailored-${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleCopyHTML = () => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Tailored Resume</h2>
          <p className="text-blue-100 text-sm truncate max-w-sm">{jobTitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold py-2 px-4 rounded transition"
          >
            Download PDF
          </button>
          <button
            onClick={handleCopyHTML}
            className="bg-blue-500 hover:bg-blue-400 text-white font-semibold py-2 px-4 rounded transition"
          >
            {copied ? "Copied!" : "Copy HTML"}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-auto bg-slate-50 p-2">
        <div
          id="resume-preview"
          className="bg-white p-4 shadow-sm mx-auto max-w-2xl"
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            fontFamily: "Calibri, Arial, sans-serif",
            lineHeight: "1.0",
            color: "#1a1a1a",
            fontSize: "10.5pt",
          }}
        />
        <style>{`
          #resume-preview h1 {
            font-size: 16pt;
            font-weight: bold;
            margin: 2pt 0 1pt 0;
            text-align: center;
            line-height: 1.0;
            padding: 0;
          }
          #resume-preview h2 {
            font-size: 11pt;
            font-weight: bold;
            margin: 2pt 0 1pt 0;
            border-bottom: 1px solid #333;
            padding-bottom: 1pt;
            line-height: 1.0;
          }
          #resume-preview h3 {
            font-size: 10.5pt;
            font-weight: bold;
            margin: 1pt 0 0pt 0;
            line-height: 1.0;
            padding: 0;
          }
          #resume-preview p {
            margin: 0pt 0;
            line-height: 1.0;
            padding: 0;
          }
          #resume-preview ul, #resume-preview ol {
            margin: 0pt 0 0pt 16pt;
            padding: 0;
          }
          #resume-preview li {
            margin: 0pt 0;
            padding: 0;
            line-height: 1.0;
          }
          #resume-preview strong {
            font-weight: bold;
          }
          #resume-preview em {
            font-style: italic;
          }
          #resume-preview table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
          }
          #resume-preview td, #resume-preview th {
            padding: 0;
            border: none;
          }
          #resume-preview .contact-info {
            font-size: 9pt;
            margin: 0;
            line-height: 1.0;
            padding: 0;
          }
        `}</style>
      </div>
    </div>
  );
}
