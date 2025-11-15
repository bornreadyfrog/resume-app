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
    <div className="space-y-2">
      {history.map((item) => (
        <div
          key={item.id}
          className="border border-slate-200 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => {
              setActiveTab(activeTab === item.id ? null : item.id);
              onLoadResume(item);
            }}
            className="w-full px-4 py-3 text-left hover:bg-slate-50 flex justify-between items-center transition"
          >
            <div>
              <p className="font-semibold text-slate-900">{item.jobTitle}</p>
              <p className="text-sm text-slate-500">{formatDate(item.timestamp)}</p>
            </div>
            <span className="text-slate-400">
              {activeTab === item.id ? "▼" : "▶"}
            </span>
          </button>
          {activeTab === item.id && (
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-sm text-slate-600">
              <p>
                Click "Load Resume" in the main view to see the full preview.
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
