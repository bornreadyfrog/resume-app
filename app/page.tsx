"use client";

import { useState, useRef, useEffect } from "react";
import ResumePreview from "@/components/ResumePreview";
import ResumeTabs from "@/components/ResumeTabs";

let pdfjsLib: any = null;

// Initialize PDF.js on client side
if (typeof window !== "undefined") {
  import("pdfjs-dist").then((module) => {
    pdfjsLib = module;
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  });
}

interface TailoredResume {
  id: string;
  jobTitle: string;
  html: string;
  timestamp: number;
}

export default function Home() {
  const [resumeText, setResumeText] = useState("");
  const [jobPosting, setJobPosting] = useState("");
  const [currentExperiences, setCurrentExperiences] = useState("");
  const [experienceCompany, setExperienceCompany] = useState("");
  const [experienceJobTitle, setExperienceJobTitle] = useState("");
  const [experienceLocation, setExperienceLocation] = useState("");
  const [experienceTime, setExperienceTime] = useState("");
  const [tailoredResume, setTailoredResume] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TailoredResume[]>([]);
  const [jobPostingMode, setJobPostingMode] = useState<"text" | "pdf" | "url">("text");
  const [jobPostingUrl, setJobPostingUrl] = useState("");
  const [jobPostingLoading, setJobPostingLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jobPostingPdfRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("tailoredResumesHistory");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    }
  }, []);

  // Extract text from PDF
  const extractPdfText = async (file: File): Promise<string> => {
    // Wait for pdfjs to load if not already loaded
    if (!pdfjsLib) {
      const module = await import("pdfjs-dist");
      pdfjsLib = module;
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let extractedText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      extractedText += pageText + "\n";
    }

    return extractedText;
  };

  // Handle resume PDF upload
  const handlePdfUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const text = await extractPdfText(file);
      setResumeText(text);
    } catch (err) {
      setError(
        "Failed to extract text from PDF. Please ensure it's a valid PDF file."
      );
      console.error("PDF extraction error:", err);
    }
  };

  // Handle job posting PDF upload
  const handleJobPostingPdfUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setJobPostingLoading(true);
      const text = await extractPdfText(file);
      setJobPosting(text);
    } catch (err) {
      setError("Failed to extract text from job posting PDF.");
      console.error("PDF extraction error:", err);
    } finally {
      setJobPostingLoading(false);
    }
  };

  // Handle job posting URL fetch
  const handleJobPostingUrlFetch = async () => {
    if (!jobPostingUrl.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    try {
      setJobPostingLoading(true);
      setError(null);
      const response = await fetch("/api/scrape-job-posting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobPostingUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch job posting");
      }

      const data = await response.json();
      setJobPosting(data.text);
      setJobPostingUrl("");
    } catch (err) {
      setError(
        "Failed to fetch job posting from URL. Make sure the URL is valid and publicly accessible."
      );
      console.error("URL fetch error:", err);
    } finally {
      setJobPostingLoading(false);
    }
  };

  // Call Claude API to tailor resume
  const handleTailorResume = async () => {
    if (!resumeText || !jobPosting || !currentExperiences) {
      setError("Please fill in all fields: resume, job posting, and experiences");
      return;
    }

    // Build structured experience string
    const structuredExperience = `
Company: ${experienceCompany}
Job Title: ${experienceJobTitle}
Location: ${experienceLocation}
Time: ${experienceTime}
Experience Details:
${currentExperiences}
    `.trim();

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobPosting,
          currentExperiences: structuredExperience,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to tailor resume");
      }

      setTailoredResume(data.tailoredResume);

      // Save to history
      const newEntry: TailoredResume = {
        id: Date.now().toString(),
        jobTitle: jobPosting.split("\n")[0].substring(0, 100),
        html: data.tailoredResume,
        timestamp: Date.now(),
      };

      const updatedHistory = [newEntry, ...history];
      setHistory(updatedHistory);
      localStorage.setItem(
        "tailoredResumesHistory",
        JSON.stringify(updatedHistory)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to tailor resume"
      );
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear all history?")) {
      setHistory([]);
      localStorage.removeItem("tailoredResumesHistory");
    }
  };

  const loadFromHistory = (item: TailoredResume) => {
    setTailoredResume(item.html);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <div className="inline-block mb-4">
            <span className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
              AI-Powered Resume Optimization
            </span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-900 to-purple-900 bg-clip-text text-transparent mb-3">
            Resume Tailor
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Transform your resume to match any job description. Upload your resume, paste a job posting, and let Claude AI tailor it to pass ATS screening while preserving your achievements.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            {/* Resume Upload */}
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-slate-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Upload Resume
                </h2>
              </div>
              <div
                className="border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition bg-slate-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
                <div className="text-3xl mb-2">{resumeText ? "✓" : "📄"}</div>
                <p className="text-slate-700 font-semibold">
                  {resumeText
                    ? "✓ PDF uploaded successfully"
                    : "Click to upload PDF"}
                </p>
                {resumeText && (
                  <p className="text-sm text-slate-500 mt-2">
                    {resumeText.length} characters extracted
                  </p>
                )}
              </div>
            </div>

            {/* Job Posting Input */}
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-slate-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Job Posting
                </h2>
              </div>

              {/* Mode Selector */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setJobPostingMode("text")}
                  className={`flex-1 px-3 py-2 rounded-lg font-semibold transition text-sm ${
                    jobPostingMode === "text"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Text
                </button>
                <button
                  onClick={() => setJobPostingMode("pdf")}
                  className={`flex-1 px-3 py-2 rounded-lg font-semibold transition text-sm ${
                    jobPostingMode === "pdf"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  PDF
                </button>
                <button
                  onClick={() => setJobPostingMode("url")}
                  className={`flex-1 px-3 py-2 rounded-lg font-semibold transition text-sm ${
                    jobPostingMode === "url"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  URL
                </button>
              </div>

              {/* Text Input Mode */}
              {jobPostingMode === "text" && (
                <textarea
                  value={jobPosting}
                  onChange={(e) => setJobPosting(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="w-full h-40 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-slate-900 placeholder-slate-400"
                />
              )}

              {/* PDF Upload Mode */}
              {jobPostingMode === "pdf" && (
                <div
                  className="border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition bg-slate-50"
                  onClick={() => jobPostingPdfRef.current?.click()}
                >
                  <input
                    ref={jobPostingPdfRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleJobPostingPdfUpload}
                    className="hidden"
                  />
                  <div className="text-3xl mb-2">📋</div>
                  <p className="text-slate-700 font-semibold">
                    Click to upload job posting
                  </p>
                  {jobPostingLoading && (
                    <p className="text-indigo-600 text-sm mt-2 font-medium">⏳ Extracting...</p>
                  )}
                </div>
              )}

              {/* URL Input Mode */}
              {jobPostingMode === "url" && (
                <div className="space-y-3">
                  <input
                    type="url"
                    value={jobPostingUrl}
                    onChange={(e) => setJobPostingUrl(e.target.value)}
                    placeholder="https://example.com/job-posting"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                  />
                  <button
                    onClick={handleJobPostingUrlFetch}
                    disabled={jobPostingLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg hover:shadow-md transition disabled:opacity-50 font-semibold"
                  >
                    {jobPostingLoading ? "⏳ Fetching..." : "Fetch Job Posting"}
                  </button>
                </div>
              )}

              {jobPosting && (
                <p className="text-green-600 text-sm mt-3 font-semibold">✓ Job posting loaded</p>
              )}
            </div>

            {/* Current Experiences Input */}
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-slate-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Current Experience
                </h2>
              </div>
              
              {/* Experience Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    Company
                  </label>
                  <input
                    type="text"
                    value={experienceCompany}
                    onChange={(e) => setExperienceCompany(e.target.value)}
                    placeholder="e.g., Palo Alto Networks"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={experienceJobTitle}
                    onChange={(e) => setExperienceJobTitle(e.target.value)}
                    placeholder="e.g., GTM Strategy Lead"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    Location
                  </label>
                  <input
                    type="text"
                    value={experienceLocation}
                    onChange={(e) => setExperienceLocation(e.target.value)}
                    placeholder="e.g., Santa Clara, CA"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    Time Period
                  </label>
                  <input
                    type="text"
                    value={experienceTime}
                    onChange={(e) => setExperienceTime(e.target.value)}
                    placeholder="e.g., Jan 2024 - Present"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 text-sm"
                  />
                </div>
              </div>

              {/* Experience Bullets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Experience Bullets
                </label>
                <textarea
                  value={currentExperiences}
                  onChange={(e) => setCurrentExperiences(e.target.value)}
                  placeholder="Paste your bullet points here (one per line, starting with • or -)"
                  className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-slate-900 placeholder-slate-400 text-sm"
                />
              </div>
            </div>

            {/* Tailor Button */}
            <button
              onClick={handleTailorResume}
              disabled={loading || !resumeText || !jobPosting || !currentExperiences}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg disabled:bg-slate-400 text-white font-bold py-3 px-6 rounded-lg transition disabled:cursor-not-allowed text-lg"
            >
              {loading ? "✨ Tailoring Resume..." : "✨ Tailor Resume"}
            </button>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-600 text-red-700 px-4 py-3 rounded-lg">
                <p className="font-bold">⚠️ Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-2">
            {tailoredResume ? (
              <ResumePreview html={tailoredResume} jobTitle={jobPosting.split("\n")[0]} />
            ) : (
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-12 text-center h-full flex flex-col justify-center items-center">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-slate-500 text-lg font-medium mb-2">
                  Your tailored resume will appear here
                </p>
                <p className="text-slate-400 text-sm">
                  Complete all three steps on the left to get started
                </p>
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <div className="mt-12 bg-white rounded-xl shadow-md border border-slate-200 p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  📚 Resume History
                </h2>
                <p className="text-slate-500 text-sm mt-1">{history.length} tailored resumes saved</p>
              </div>
              <button
                onClick={clearHistory}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                Clear All
              </button>
            </div>
            <ResumeTabs history={history} onLoadResume={loadFromHistory} />
          </div>
        )}
      </div>
    </div>
  );
}
