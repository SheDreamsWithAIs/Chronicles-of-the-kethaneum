/**
 * Dialogue Creator Tool - Main Page
 */

'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { CosmicBackground } from '@/components/shared/CosmicBackground';
import { useDialogueCreator } from './hooks/useDialogueCreator';
import CharacterInfoPanel from './components/CharacterInfoPanel';
import DialogueEntryList from './components/DialogueEntryList';
import DialoguePreview from './components/DialoguePreview';
import MetadataPanel from './components/MetadataPanel';
import ValidationPanel from './components/ValidationPanel';
import styles from './styles/dialogue-creator.module.css';

export default function DialogueCreatorPage() {
  const {
    character,
    dialogueEntries,
    metadata,
    validationResults,
    isDirty,
    currentPreviewIndex,
    textLimits,
    updateCharacter,
    addDialogueEntry,
    updateDialogueEntry,
    deleteDialogueEntry,
    duplicateDialogueEntry,
    reorderDialogueEntry,
    updateMetadata,
    loadCharacter,
    importFromJSON,
    exportToJSON,
    saveCharacter,
    resetForm,
    setPreviewIndex: setPreviewIndexFromHook,
  } = useDialogueCreator();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showPreview, setShowPreview] = useState(true);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [availableCharacters, setAvailableCharacters] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasErrors = validationResults.some((r) => r.severity === 'error');

  // Load available characters list
  const loadAvailableCharacters = async () => {
    try {
      const response = await fetch('/api/manifest-manager/file?path=characters/character-manifest.json');
      if (response.ok) {
        const data = await response.json();
        setAvailableCharacters(data.content || []);
      }
    } catch (error) {
      console.error('Failed to load character manifest:', error);
    }
  };

  const handleLoadCharacter = async (filename: string) => {
    setIsLoading(true);
    try {
      await loadCharacter(filename);
      setShowLoadModal(false);
      setSaveStatus('idle');
    } catch (error) {
      setSaveStatus('error');
      alert('Failed to load character. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportJSON = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      importFromJSON(text);
      setSaveStatus('idle');
    } catch (error) {
      setSaveStatus('error');
      alert('Failed to import JSON. Please check the file format.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await saveCharacter();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      alert(error instanceof Error ? error.message : 'Failed to save character.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    try {
      exportToJSON();
    } catch (error) {
      alert('Failed to export JSON.');
    }
  };

  return (
    <>
      <CosmicBackground variant="library" />
      <div className="min-h-screen p-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <div>
                <h1 className={styles.title}>Character and Banter Dialogue Creator</h1>
                <p className={styles.subtitle}>
                  Create and edit character files with banter dialogue, validation and preview
                </p>
              </div>
              <Link
                href="/tools"
                className={styles.backButton}
              >
                Back to Tools
              </Link>
            </div>

            {/* Action Buttons */}
            <div className={styles.headerActions}>
              <button
                type="button"
                onClick={() => {
                  setShowLoadModal(true);
                  loadAvailableCharacters();
                }}
                className={styles.actionButton}
                disabled={isLoading}
              >
                Load Existing
              </button>
              <button
                type="button"
                onClick={handleImportJSON}
                className={styles.actionButton}
              >
                Import JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={handleExport}
                className={styles.actionButton}
                disabled={dialogueEntries.length === 0}
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={resetForm}
                className={styles.actionButton}
                disabled={isLoading}
              >
                New Character
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={hasErrors || !isDirty || isSaving}
                className={styles.saveButton}
              >
                {isSaving ? 'Saving...' : 'Save Character'}
              </button>
            </div>

            {saveStatus === 'success' && (
              <div className={styles.successMessage}>Character saved successfully!</div>
            )}
            {saveStatus === 'error' && (
              <div className={styles.errorMessage}>Error saving character. Please try again.</div>
            )}
          </header>

          {/* Load Modal */}
          {showLoadModal && (
            <div className={styles.modalOverlay} onClick={() => setShowLoadModal(false)}>
              <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2>Load Character</h2>
                <div className={styles.characterList}>
                  {availableCharacters.length === 0 ? (
                    <p>No characters found</p>
                  ) : (
                    availableCharacters.map((filename) => (
                      <button
                        key={filename}
                        type="button"
                        onClick={() => handleLoadCharacter(filename)}
                        className={styles.characterButton}
                      >
                        {filename.replace('.json', '')}
                      </button>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowLoadModal(false)}
                  className={styles.modalClose}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className={styles.loadingState}>
              <div>Loading character...</div>
            </div>
          )}

          {/* Main Content */}
          {!isLoading && (
            <div className={styles.mainContent}>
              <div className={styles.leftPanel}>
                <CharacterInfoPanel
                  character={character}
                  onChange={updateCharacter}
                  errors={validationResults.filter((r) => r.field.startsWith('character.'))}
                />

                <DialogueEntryList
                  entries={dialogueEntries}
                  onAdd={addDialogueEntry}
                  onUpdate={updateDialogueEntry}
                  onDelete={deleteDialogueEntry}
                  onDuplicate={duplicateDialogueEntry}
                  onReorder={reorderDialogueEntry}
                  errors={validationResults.filter((r) => r.field.startsWith('dialogue.'))}
                  textLimits={textLimits}
                />

                <MetadataPanel
                  metadata={metadata}
                  onChange={updateMetadata}
                  errors={validationResults.filter((r) => r.field.startsWith('metadata.'))}
                />
              </div>

              {showPreview && (
                <div className={styles.rightPanel}>
                  <DialoguePreview
                    character={character}
                    dialogueEntries={dialogueEntries}
                    currentIndex={currentPreviewIndex}
                    onIndexChange={setPreviewIndexFromHook}
                  />
                </div>
              )}
            </div>
          )}

          {/* Validation Panel */}
          <footer className={styles.footer}>
            <ValidationPanel
              results={validationResults}
              onFieldClick={(field) => {
                // Scroll to field - would need to implement
                console.log('Focus field:', field);
              }}
            />
          </footer>
        </div>
      </div>
    </>
  );
}

