"use client";

import { useState, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import ResumePreview from "@/components/ResumePreview";
import ResumeTabs from "@/components/ResumeTabs";

// Set up PDF.js worker
// Prefer serving the worker locally so the browser can always fetch it from our app.
// Use the module worker that ships with pdfjs-dist (served from public/).
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-2">Resume Tailor</h1>
        <p className="text-slate-300 mb-8">
          Upload your resume, paste a job posting, and let AI tailor it to pass
          ATS screening.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            {/* Resume Upload */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Upload Resume
              </h2>
              <div
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
                <p className="text-slate-600 font-medium">
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
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Job Posting
              </h2>

              {/* Mode Selector */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setJobPostingMode("text")}
                  className={`px-4 py-2 rounded font-medium transition ${
                    jobPostingMode === "text"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  Paste Text
                </button>
                <button
                  onClick={() => setJobPostingMode("pdf")}
                  className={`px-4 py-2 rounded font-medium transition ${
                    jobPostingMode === "pdf"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  Upload PDF
                </button>
                <button
                  onClick={() => setJobPostingMode("url")}
                  className={`px-4 py-2 rounded font-medium transition ${
                    jobPostingMode === "url"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  Enter URL
                </button>
              </div>

              {/* Text Input Mode */}
              {jobPostingMode === "text" && (
                <textarea
                  value={jobPosting}
                  onChange={(e) => setJobPosting(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="w-full h-40 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-900 placeholder-slate-500"
                />
              )}

              {/* PDF Upload Mode */}
              {jobPostingMode === "pdf" && (
                <div
                  className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition"
                  onClick={() => jobPostingPdfRef.current?.click()}
                >
                  <input
                    ref={jobPostingPdfRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleJobPostingPdfUpload}
                    className="hidden"
                  />
                  <p className="text-slate-600 font-medium">
                    Click to upload job posting PDF
                  </p>
                  {jobPostingLoading && (
                    <p className="text-slate-500 text-sm mt-2">Extracting...</p>
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
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleJobPostingUrlFetch}
                    disabled={jobPostingLoading}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
                  >
                    {jobPostingLoading ? "Fetching..." : "Fetch Job Posting"}
                  </button>
                </div>
              )}

              {jobPosting && (
                <p className="text-green-600 text-sm mt-2">✓ Job posting loaded</p>
              )}
            </div>

            {/* Current Experiences Input */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Current Experience Details
              </h2>
              
              {/* Experience Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={experienceCompany}
                    onChange={(e) => setExperienceCompany(e.target.value)}
                    placeholder="e.g., Palo Alto Networks"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={experienceJobTitle}
                    onChange={(e) => setExperienceJobTitle(e.target.value)}
                    placeholder="e.g., GTM Strategy Lead"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={experienceLocation}
                    onChange={(e) => setExperienceLocation(e.target.value)}
                    placeholder="e.g., Santa Clara, CA"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    value={experienceTime}
                    onChange={(e) => setExperienceTime(e.target.value)}
                    placeholder="e.g., Jan 2024 - Present"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Experience Bullets */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Experience Bullets
                </label>
                <textarea
                  value={currentExperiences}
                  onChange={(e) => setCurrentExperiences(e.target.value)}
                  placeholder="Paste your bullet points here (one per line, starting with • or -)"
                  className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-900 placeholder-slate-500"
                />
              </div>
            </div>

            {/* Tailor Button */}
            <button
              onClick={handleTailorResume}
              disabled={loading || !resumeText || !jobPosting || !currentExperiences}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-3 px-6 rounded-lg transition disabled:cursor-not-allowed"
            >
              {loading ? "Tailoring..." : "Tailor Resume"}
            </button>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-2">
            {tailoredResume ? (
              <ResumePreview html={tailoredResume} jobTitle={jobPosting.split("\n")[0]} />
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <p className="text-slate-500 text-lg">
                  Fill in all fields and click "Tailor Resume" to see your AI-tailored
                  resume preview here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                Tailor History ({history.length})
              </h2>
              <button
                onClick={clearHistory}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
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
