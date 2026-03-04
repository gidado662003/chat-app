"use client";
import Link from "next/link";
import { useParams } from "next/navigation";

// Replace with real fetch by fileId
const MOCK_FILE = {
  name: "Q1 Onboarding Deck.pptx",
  size: "4.2 MB",
  uploadedBy: "Amina K.",
  date: "Feb 28, 2026",
  department: "Human Resources",
  category: "Onboarding",
};

export default function FilePage() {
  const { department, category, fileId } = useParams();

  return (
    <main className="max-w-3xl mx-auto px-8 py-12">
      {/* Breadcrumb */}
      <p className="text-xs font-mono text-zinc-600 mb-6">
        <Link
          href="/documents"
          className="hover:text-zinc-400 transition-colors"
        >
          documents
        </Link>
        <span className="mx-2 text-zinc-700">/</span>
        <Link
          href={`/documents/${department}`}
          className="hover:text-zinc-400 transition-colors capitalize"
        >
          {String(department).replace(/-/g, " ")}
        </Link>
        <span className="mx-2 text-zinc-700">/</span>
        <Link
          href={`/documents/${department}/${category}`}
          className="hover:text-zinc-400 transition-colors capitalize"
        >
          {String(category).replace(/-/g, " ")}
        </Link>
        <span className="mx-2 text-zinc-700">/</span>
        <span className="text-zinc-500">{MOCK_FILE.name}</span>
      </p>

      <div className="flex items-end justify-between mb-8 pb-5 border-b border-zinc-800">
        <div>
          <p className="text-xs font-mono tracking-widest text-zinc-600 uppercase mb-1">
            File
          </p>
          <h1 className="text-xl font-light tracking-tight text-zinc-100">
            {MOCK_FILE.name}
          </h1>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
          ↓ Download
        </button>
      </div>

      {/* Preview placeholder */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl h-72 flex flex-col items-center justify-center gap-3 mb-6">
        <span className="text-4xl">📊</span>
        <p className="text-sm text-zinc-600">Preview not available</p>
        <p className="text-xs font-mono text-zinc-700">
          Download to view presentation
        </p>
      </div>

      {/* File metadata */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-5">
        <p className="text-xs font-mono tracking-widest text-zinc-600 uppercase mb-4">
          File Info
        </p>
        {[
          ["Uploaded by", MOCK_FILE.uploadedBy],
          ["Date", MOCK_FILE.date],
          ["Size", MOCK_FILE.size],
          ["Department", MOCK_FILE.department],
          ["Category", MOCK_FILE.category],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between py-2.5 border-b border-zinc-800 last:border-0"
          >
            <span className="text-xs font-mono text-zinc-600">{label}</span>
            <span className="text-xs text-zinc-400">{value}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
