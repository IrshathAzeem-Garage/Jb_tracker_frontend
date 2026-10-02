import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileQuestion } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200 mb-4">
        <FileQuestion className="w-12 h-12 text-slate-400" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
        404 — Page Not Found
      </h1>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        The page or resource you requested does not exist or has been relocated in JB Tracker.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
};
