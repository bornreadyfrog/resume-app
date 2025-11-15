"use client";

import { useState } from "react";

interface TailoredResume {
  id: string;
  jobTitle: string;
  html: string;
  timestamp: number;
}

interface ResumeTabsProps {
  history: TailoredResume[];
  onLoadResume: (item: TailoredResume) => void;
}

export default function ResumeTabs({ history, onLoadResume }: ResumeTabsProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {history.map((item, index) => (
        <div
          key={item.id}
          className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition bg-white"
        >
          <button
            onClick={() => {
              setActiveTab(activeTab === item.id ? null : item.id);
              onLoadResume(item);
            }}
            className="w-full px-5 py-4 text-left hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 flex justify-between items-center transition"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-block w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {index + 1}
                </span>
                <p className="font-semibold text-slate-900 truncate">{item.jobTitle || "Untitled Resume"}</p>
              </div>
              <p className="text-xs text-slate-500">📅 {formatDate(item.timestamp)}</p>
            </div>
            <span className="text-indigo-600 ml-2 text-xl">
              {activeTab === item.id ? "▼" : "▶"}
            </span>
          </button>
          {activeTab === item.id && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-4 border-t border-slate-200 text-sm text-slate-600">
              <p className="mb-3">✓ Resume loaded and ready to view</p>
              <button
                onClick={() => onLoadResume(item)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:shadow-md transition text-sm"
              >
                View in Preview
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
