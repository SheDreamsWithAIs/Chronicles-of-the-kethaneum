'use client';

import { useState, useEffect, useCallback } from 'react';
import { CosmicBackground } from '@/components/shared/CosmicBackground';

// ============================================================================
// TYPES
// ============================================================================

interface FileData {
  name: string;
  path: string;
  type: 'puzzle' | 'character' | 'generic';
  size: number;
}

interface ManifestData {
  name: string;
  manifestType: string;
}

interface BrowseResponse {
  success: boolean;
  path: string;
  folders: string[];
  files: FileData[];
  manifests: ManifestData[];
  error?: string;
}

interface ManifestContent {
  files?: string[];
  genreFiles?: string[];
  [key: string]: any;
}

type ModalType = 'file' | 'folder' | 'manifest' | 'preview' | null;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ManifestManager() {
  const [currentPath, setCurrentPath] = useState('');
  const [data, setData] = useState<BrowseResponse>({
    success: true,
    path: '',
    folders: [],
    files: [],
    manifests: []
  });
  const [selectedManifest, setSelectedManifest] = useState<string | null>(null);
  const [manifestContent, setManifestContent] = useState<ManifestContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; content: any } | null>(null);

  // Load directory data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/manifest-manager/browse?path=${encodeURIComponent(currentPath)}`);
      const result: BrowseResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load data');
      }

      setData(result);
    } catch (error) {
      showMessage('error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  // Load manifest
  const loadManifest = useCallback(async (manifestType: string) => {
    try {
      const response = await fetch(`/api/manifest-manager/manifest/${manifestType}?path=${encodeURIComponent(currentPath)}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load manifest');
      }

      setManifestContent(result.manifest);
      setSelectedManifest(manifestType);
    } catch (error) {
      showMessage('error', (error as Error).message);
    }
  }, [currentPath]);

  // Save manifest
  const saveManifest = useCallback(async () => {
    if (!selectedManifest || !manifestContent) return;

    try {
      const response = await fetch(`/api/manifest-manager/manifest/${selectedManifest}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifest: manifestContent,
          path: currentPath
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save manifest');
      }

      showMessage('success', 'Manifest saved successfully!');
      await loadData();
    } catch (error) {
      showMessage('error', (error as Error).message);
    }
  }, [selectedManifest, manifestContent, currentPath, loadData]);

  // Show message helper
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Navigate to folder
  const navigateToFolder = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
    setSelectedManifest(null);
    setManifestContent(null);
  };

  // Navigate to path (breadcrumb)
  const navigateToPath = (targetPath: string) => {
    setCurrentPath(targetPath);
    setSelectedManifest(null);
    setManifestContent(null);
  };

  // Add file to manifest
  const addToManifest = (filePath: string) => {
    if (!manifestContent) return;

    const newContent = { ...manifestContent };

    // Determine manifest structure and add file
    if (Array.isArray(newContent.files)) {
      if (!newContent.files.includes(filePath)) {
        newContent.files.push(filePath);
      }
    } else if (Array.isArray(newContent.genreFiles)) {
      if (!newContent.genreFiles.includes(filePath)) {
        newContent.genreFiles.push(filePath);
      }
    } else {
      // Find array property or create one
      const arrayKey = Object.keys(newContent).find(key => Array.isArray(newContent[key]));
      if (arrayKey) {
        if (!newContent[arrayKey].includes(filePath)) {
          newContent[arrayKey].push(filePath);
        }
      } else {
        newContent.files = [filePath];
      }
    }

    setManifestContent(newContent);
  };

  // Remove file from manifest
  const removeFromManifest = (filePath: string) => {
    if (!manifestContent) return;

    const newContent = { ...manifestContent };

    // Remove from all array properties
    Object.keys(newContent).forEach(key => {
      if (Array.isArray(newContent[key])) {
        newContent[key] = newContent[key].filter((f: string) => f !== filePath);
      }
    });

    setManifestContent(newContent);
  };

  // Check if file is in manifest
  const isFileInManifest = (filePath: string): boolean => {
    if (!manifestContent) return false;

    return Object.keys(manifestContent).some(key => {
      if (Array.isArray(manifestContent[key])) {
        return manifestContent[key].includes(filePath);
      }
      return false;
    });
  };

  // View file
  const viewFile = async (filePath: string, fileName: string) => {
    try {
      const response = await fetch(`/api/manifest-manager/file?path=${encodeURIComponent(filePath)}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load file');
      }

      setPreviewFile({ name: fileName, content: result.content });
      setActiveModal('preview');
    } catch (error) {
      showMessage('error', (error as Error).message);
    }
  };

  // Delete file
  const deleteFile = async (filePath: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;

    try {
      const response = await fetch(`/api/manifest-manager/file?path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete file');
      }

      showMessage('success', `Deleted ${fileName}`);
      await loadData();
    } catch (error) {
      showMessage('error', (error as Error).message);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get breadcrumb parts
  const breadcrumbs = currentPath ? currentPath.split('/') : [];

  return (
    <>
      <CosmicBackground variant="library" />
      <div className="min-h-screen p-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-6 bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-4">
            <h1 className="text-3xl font-bold mb-4 text-[var(--text-light)]">Manifest Manager</h1>

            <div className="flex gap-4 items-center flex-wrap">
              <button
                onClick={() => setActiveModal('folder')}
                className="px-4 py-2 bg-[var(--accent-main)] text-[var(--primary-dark)] rounded hover:bg-[var(--accent-light)] transition-all font-semibold"
              >
                📁 New Folder
              </button>

              <button
                onClick={() => setActiveModal('file')}
                className="px-4 py-2 bg-[var(--primary-light)] text-white rounded hover:bg-[var(--primary-lighter)] transition-all font-semibold"
              >
                📄 New File
              </button>

              <button
                onClick={() => setActiveModal('manifest')}
                className="px-4 py-2 bg-[var(--accent-dark)] text-white rounded hover:bg-[var(--accent-main)] transition-all font-semibold"
              >
                📋 New Manifest
              </button>

              <button
                onClick={loadData}
                className="px-4 py-2 bg-[var(--primary-lighter)] text-white rounded hover:bg-[var(--primary-light)] transition-all font-semibold"
              >
                🔄 Refresh
              </button>

              {message && (
                <span className={`text-sm font-semibold ${message.type === 'success' ? 'text-[var(--accent-light)]' : 'text-red-400'}`}>
                  {message.text}
                </span>
              )}
            </div>
          </header>

          {/* Breadcrumbs */}
          <nav className="mb-6 bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-4">
            <div className="flex items-center gap-2 flex-wrap text-[var(--text-medium)]">
              <button
                onClick={() => navigateToPath('')}
                className="hover:text-[var(--accent-light)] underline"
              >
                /data/
              </button>
              {breadcrumbs.map((part, index) => {
                const path = breadcrumbs.slice(0, index + 1).join('/');
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <div key={index} className="flex items-center gap-2">
                    <span>/</span>
                    <button
                      onClick={() => !isLast && navigateToPath(path)}
                      className={isLast ? 'text-[var(--text-light)]' : 'hover:text-[var(--accent-light)] underline'}
                    >
                      {part}
                    </button>
                  </div>
                );
              })}
            </div>
          </nav>

          <div className="flex gap-6">
            {/* Sidebar */}
            <aside className="w-64 bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-4">
              <h2 className="font-bold text-lg mb-4 text-[var(--text-light)]">Manifests</h2>
              {data.manifests.length === 0 ? (
                <p className="text-sm text-[var(--text-medium)]">No manifests in this folder</p>
              ) : (
                <div className="space-y-2">
                  {data.manifests.map((manifest) => (
                    <button
                      key={manifest.manifestType}
                      onClick={() => loadManifest(manifest.manifestType)}
                      className={`w-full text-left px-3 py-2 rounded transition-all text-sm ${
                        selectedManifest === manifest.manifestType
                          ? 'bg-[var(--accent-main)] text-[var(--primary-dark)] font-semibold'
                          : 'text-[var(--text-light)] hover:bg-[var(--primary-light)]'
                      }`}
                    >
                      📋 {manifest.name}
                    </button>
                  ))}
                </div>
              )}
            </aside>

            {/* Main Content */}
            <main className="flex-1 space-y-6">
              {/* Folders */}
              {data.folders.length > 0 && (
                <section className="bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-6">
                  <h2 className="text-xl font-bold mb-4 text-[var(--text-light)]">Folders</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.folders.map((folder) => (
                      <button
                        key={folder}
                        onClick={() => navigateToFolder(folder)}
                        className="p-4 bg-[var(--neutral-medium)] rounded-lg border border-[var(--primary-light)] hover:bg-[var(--primary-light)] transition-all text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">📁</span>
                          <span className="font-semibold text-[var(--text-light)]">{folder}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Files */}
              <section className="bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--primary-light)] p-6">
                <h2 className="text-xl font-bold mb-4 text-[var(--text-light)]">
                  Files ({data.files.length})
                </h2>
                {data.files.length === 0 ? (
                  <p className="text-[var(--text-medium)]">No files in this folder</p>
                ) : (
                  <div className="space-y-3">
                    {data.files.map((file) => {
                      const inManifest = isFileInManifest(file.path);
                      const typeColor = {
                        puzzle: 'bg-green-600',
                        character: 'bg-red-600',
                        generic: 'bg-yellow-600'
                      }[file.type];

                      return (
                        <div
                          key={file.path}
                          className={`p-4 rounded-lg border transition-all ${
                            inManifest
                              ? 'bg-[var(--accent-dark)] bg-opacity-20 border-[var(--accent-main)]'
                              : 'bg-[var(--neutral-medium)] border-[var(--primary-light)]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <span className={`w-3 h-3 rounded-full ${typeColor}`}></span>
                              <div>
                                <div className="font-semibold text-[var(--text-light)]">{file.name}</div>
                                <div className="text-xs text-[var(--text-medium)]">
                                  {file.type} • {(file.size / 1024).toFixed(2)} KB
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {selectedManifest && (
                                <button
                                  onClick={() => inManifest ? removeFromManifest(file.path) : addToManifest(file.path)}
                                  className={`px-3 py-1 rounded text-sm font-semibold transition-all ${
                                    inManifest
                                      ? 'bg-red-600 hover:bg-red-700 text-white'
                                      : 'bg-[var(--accent-main)] hover:bg-[var(--accent-light)] text-[var(--primary-dark)]'
                                  }`}
                                >
                                  {inManifest ? 'Remove' : 'Add'}
                                </button>
                              )}
                              <button
                                onClick={() => viewFile(file.path, file.name)}
                                className="px-3 py-1 bg-[var(--primary-lighter)] hover:bg-[var(--primary-light)] text-white rounded text-sm font-semibold transition-all"
                              >
                                👁️ View
                              </button>
                              <button
                                onClick={() => deleteFile(file.path, file.name)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold transition-all"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Manifest Editor */}
              {selectedManifest && manifestContent && (
                <section className="bg-[var(--primary-medium)] bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg border border-[var(--accent-main)] p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[var(--text-light)]">
                      Editing: {selectedManifest}Manifest.json
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={saveManifest}
                        className="px-4 py-2 bg-[var(--accent-main)] text-[var(--primary-dark)] rounded hover:bg-[var(--accent-light)] transition-all font-semibold"
                      >
                        💾 Save Manifest
                      </button>
                      <button
                        onClick={() => {
                          setSelectedManifest(null);
                          setManifestContent(null);
                        }}
                        className="px-4 py-2 bg-[var(--neutral-medium)] text-white rounded hover:bg-[var(--neutral-dark)] transition-all font-semibold"
                      >
                        ✕ Close
                      </button>
                    </div>
                  </div>
                  <div className="bg-[var(--primary-dark)] p-4 rounded border border-[var(--primary-light)]">
                    <pre className="text-sm text-[var(--text-light)] overflow-x-auto">
                      {JSON.stringify(manifestContent, null, 2)}
                    </pre>
                  </div>
                </section>
              )}
            </main>
          </div>

          {/* Modals */}
          {activeModal === 'file' && (
            <CreateFileModal
              currentPath={currentPath}
              onClose={() => setActiveModal(null)}
              onSuccess={() => {
                setActiveModal(null);
                loadData();
                showMessage('success', 'File created successfully!');
              }}
              onError={(error) => showMessage('error', error)}
            />
          )}

          {activeModal === 'folder' && (
            <CreateFolderModal
              currentPath={currentPath}
              onClose={() => setActiveModal(null)}
              onSuccess={() => {
                setActiveModal(null);
                loadData();
                showMessage('success', 'Folder created successfully!');
              }}
              onError={(error) => showMessage('error', error)}
            />
          )}

          {activeModal === 'manifest' && (
            <CreateManifestModal
              currentPath={currentPath}
              onClose={() => setActiveModal(null)}
              onSuccess={() => {
                setActiveModal(null);
                loadData();
                showMessage('success', 'Manifest created successfully!');
              }}
              onError={(error) => showMessage('error', error)}
            />
          )}

          {activeModal === 'preview' && previewFile && (
            <PreviewModal
              file={previewFile}
              onClose={() => {
                setActiveModal(null);
                setPreviewFile(null);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================================
// MODAL COMPONENTS
// ============================================================================

function CreateFileModal({ currentPath, onClose, onSuccess, onError }: {
  currentPath: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  const [filename, setFilename] = useState('');
  const [contentType, setContentType] = useState<'array' | 'puzzle' | 'character' | 'object'>('array');

  const handleCreate = async () => {
    if (!filename) {
      onError('Filename is required');
      return;
    }

    if (!filename.endsWith('.json')) {
      onError('Filename must end with .json');
      return;
    }

    try {
      const response = await fetch('/api/manifest-manager/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, contentType, currentPath })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create file');
      }

      onSuccess();
    } catch (error) {
      onError((error as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--primary-medium)] rounded-lg shadow-xl max-w-md w-full border border-[var(--primary-light)]">
        <div className="p-4 border-b border-[var(--primary-light)] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--text-light)]">Create New File</h2>
          <button onClick={onClose} className="text-[var(--text-medium)] hover:text-[var(--text-light)] text-2xl">&times;</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block font-semibold mb-2 text-[var(--text-light)]">Filename:</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="myData.json"
              className="w-full px-3 py-2 bg-[var(--primary-dark)] text-[var(--text-light)] border border-[var(--primary-light)] rounded focus:border-[var(--accent-light)] outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2 text-[var(--text-light)]">Content Type:</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as any)}
              className="w-full px-3 py-2 bg-[var(--primary-dark)] text-[var(--text-light)] border border-[var(--primary-light)] rounded focus:border-[var(--accent-light)] outline-none"
            >
              <option value="array">Generic Array</option>
              <option value="puzzle">Puzzle Data</option>
              <option value="character">Character Data</option>
              <option value="object">Generic Object</option>
            </select>
          </div>
          <button
            onClick={handleCreate}
            className="w-full px-4 py-2 bg-[var(--accent-main)] text-[var(--primary-dark)] rounded hover:bg-[var(--accent-light)] transition-all font-semibold"
          >
            Create File
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateFolderModal({ currentPath, onClose, onSuccess, onError }: {
  currentPath: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  const [folderName, setFolderName] = useState('');

  const handleCreate = async () => {
    if (!folderName) {
      onError('Folder name is required');
      return;
    }

    try {
      const response = await fetch('/api/manifest-manager/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName, currentPath })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create folder');
      }

      onSuccess();
    } catch (error) {
      onError((error as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--primary-medium)] rounded-lg shadow-xl max-w-md w-full border border-[var(--primary-light)]">
        <div className="p-4 border-b border-[var(--primary-light)] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--text-light)]">Create New Folder</h2>
          <button onClick={onClose} className="text-[var(--text-medium)] hover:text-[var(--text-light)] text-2xl">&times;</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block font-semibold mb-2 text-[var(--text-light)]">Folder Name:</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="myFolder"
              className="w-full px-3 py-2 bg-[var(--primary-dark)] text-[var(--text-light)] border border-[var(--primary-light)] rounded focus:border-[var(--accent-light)] outline-none"
            />
          </div>
          <button
            onClick={handleCreate}
            className="w-full px-4 py-2 bg-[var(--accent-main)] text-[var(--primary-dark)] rounded hover:bg-[var(--accent-light)] transition-all font-semibold"
          >
            Create Folder
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateManifestModal({ currentPath, onClose, onSuccess, onError }: {
  currentPath: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  const [manifestName, setManifestName] = useState('');

  const handleCreate = async () => {
    if (!manifestName) {
      onError('Manifest name is required');
      return;
    }

    try {
      const response = await fetch(`/api/manifest-manager/manifest/${manifestName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifest: { files: [] },
          path: currentPath,
          create: true
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create manifest');
      }

      onSuccess();
    } catch (error) {
      onError((error as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--primary-medium)] rounded-lg shadow-xl max-w-md w-full border border-[var(--primary-light)]">
        <div className="p-4 border-b border-[var(--primary-light)] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--text-light)]">Create New Manifest</h2>
          <button onClick={onClose} className="text-[var(--text-medium)] hover:text-[var(--text-light)] text-2xl">&times;</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block font-semibold mb-2 text-[var(--text-light)]">Manifest Name:</label>
            <input
              type="text"
              value={manifestName}
              onChange={(e) => setManifestName(e.target.value)}
              placeholder="character"
              className="w-full px-3 py-2 bg-[var(--primary-dark)] text-[var(--text-light)] border border-[var(--primary-light)] rounded focus:border-[var(--accent-light)] outline-none"
            />
            <p className="text-sm text-[var(--text-medium)] mt-2">
              Will create: <span className="font-mono">{manifestName || 'character'}Manifest.json</span>
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="w-full px-4 py-2 bg-[var(--accent-main)] text-[var(--primary-dark)] rounded hover:bg-[var(--accent-light)] transition-all font-semibold"
          >
            Create Manifest
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ file, onClose }: {
  file: { name: string; content: any };
  onClose: () => void;
}) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(file.content, null, 2));
    alert('Copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--primary-medium)] rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-[var(--primary-light)]">
        <div className="p-4 border-b border-[var(--primary-light)] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--text-light)]">{file.name}</h2>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 bg-[var(--accent-main)] text-[var(--primary-dark)] rounded hover:bg-[var(--accent-light)] transition-all font-semibold"
            >
              Copy
            </button>
            <button onClick={onClose} className="text-[var(--text-medium)] hover:text-[var(--text-light)] text-2xl">&times;</button>
          </div>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <pre className="bg-[var(--primary-dark)] p-4 rounded text-sm text-[var(--text-light)] overflow-x-auto border border-[var(--primary-light)]">
            {JSON.stringify(file.content, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
