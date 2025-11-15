'use client';

import Link from 'next/link';
import { CosmicBackground } from '@/components/shared/CosmicBackground';

export default function ToolsPage() {
  return (
    <>
      <CosmicBackground variant="library" />
      <div className="min-h-screen p-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-4 text-[var(--text-light)]">Development Tools</h1>
            <p className="text-[var(--text-medium)] text-lg">
              Select a tool to manage your game content
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Genre Builder Tool */}
            <Link href="/tools/genre-builder">
              <div className="bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-6 hover:bg-[var(--primary-light)] transition-all cursor-pointer h-full">
                <div className="flex items-center mb-4">
                  <div className="text-4xl mr-4">📖</div>
                  <h2 className="text-2xl font-bold text-[var(--text-light)]">Genre Builder</h2>
                </div>
                <p className="text-[var(--text-medium)] mb-4">
                  Create and edit genre files with an intuitive three-level interface for managing books and puzzles.
                </p>
                <div className="space-y-2 text-sm text-[var(--text-light)]">
                  <div className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>File → Book → Puzzle navigation</span>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Real-time validation & auto-save</span>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>JSON preview & export</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Manifest Manager Tool */}
            <Link href="/tools/manifest-manager">
              <div className="bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-6 hover:bg-[var(--primary-light)] transition-all cursor-pointer h-full">
                <div className="flex items-center mb-4">
                  <div className="text-4xl mr-4">📋</div>
                  <h2 className="text-2xl font-bold text-[var(--text-light)]">Manifest Manager</h2>
                </div>
                <p className="text-[var(--text-medium)] mb-4">
                  Organize and manage game data files with folder navigation and manifest editing capabilities.
                </p>
                <div className="space-y-2 text-sm text-[var(--text-light)]">
                  <div className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Browse & organize data folders</span>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Create & edit manifest files</span>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>File management (create, delete, preview)</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-8 bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-6">
            <h3 className="text-xl font-bold text-[var(--text-light)] mb-3">⚠️ Development Only</h3>
            <p className="text-[var(--text-medium)] text-sm">
              These tools are for development purposes only and should never be deployed to production or made accessible to players.
              They have full access to game data files and can create, modify, and delete content.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[var(--accent-main)] text-[var(--primary-dark)] rounded hover:bg-[var(--accent-light)] transition-all font-semibold"
            >
              ← Back to Game
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
