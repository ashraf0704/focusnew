import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderPlus, FilePlus2, Trash2, Folder, FileText, FileCode, FileImage, 
  Archive, FileSpreadsheet, Eye, ArrowLeft, Search, Plus, Filter, Sparkles, 
  CornerDownRight, Check, AlertCircle, RefreshCw, Upload, Download, X
} from 'lucide-react';
import { VaultFolder, CollegeFile } from '../types';
import { api } from '../api';

interface VaultHubProps {
  onSendToAI: (fileContent: string, fileName: string) => void;
}

const INITIAL_FOLDERS: VaultFolder[] = [
  { id: 'f-1', name: '🎓 Mid-Term Projects', color: 'indigo', createdAt: '2026-05-10' },
  { id: 'f-2', name: '📓 Study Notes & Revision Sheets', color: 'emerald', createdAt: '2026-05-12' },
  { id: 'f-3', name: '💻 CSE-201 Coding Labs', color: 'amber', createdAt: '2026-05-15' },
];

const INITIAL_FILES: CollegeFile[] = [
  {
    id: 'fi-1',
    name: 'Syllabus_AI_Regressions.pdf',
    type: 'pdf',
    size: '1.8 MB',
    folderId: 'f-1',
    createdAt: '2026-05-11',
    textContent: 'Mid-Term Course Syllabus on Linear and Logistic Regressions. Core topics include Error Minimization, Gradient Descent learning rates (alpha), and Loss calculations across multi-dimensional feature parameters.'
  },
  {
    id: 'fi-2',
    name: 'Handwritten_Chemistry_Notes.image',
    type: 'image',
    size: '1.2 MB',
    folderId: 'f-2',
    createdAt: '2026-05-13',
    textContent: '[OCR Extracted Text from Photo Notes]: Chemical properties of Alkyl Halides. Nucleophilic substitution reactions (SN1 vs SN2 kinetics, polar aprotic solvents favor SN2 pathway, carbocation re-arrangements occur mainly in SN1).'
  },
  {
    id: 'fi-3',
    name: 'Binary_Tree_Inversions.cpp',
    type: 'code',
    size: '18 KB',
    folderId: 'f-3',
    createdAt: '2026-05-16',
    textContent: `// Dynamic Binary Tree Node inversion module
#include <iostream>
struct Node {
    int value;
    Node* left;
    Node* right;
};

void invertTree(Node* root) {
    if (root == nullptr) return;
    Node* temp = root->left;
    root->left = root->right;
    root->right = temp;
    invertTree(root->left);
    invertTree(root->right);
}`
  },
  {
    id: 'fi-4',
    name: 'XIX_Century_History_Outline.doc',
    type: 'doc',
    size: '340 KB',
    folderId: 'f-2',
    createdAt: '2026-05-14',
    textContent: 'Historical analysis of the European industrial expansion in the mid 19th Century. Focuses on social impacts, urbanization rate curves, and trade route transformations across the Suez Canal project corridor.'
  },
  {
    id: 'fi-5',
    name: 'Java_Full_Stack_Deployment.zip',
    type: 'zip',
    size: '4.5 MB',
    folderId: 'f-1',
    createdAt: '2026-05-18',
    textContent: 'Compressed Archive containing complete configurations: Dockerfile, Maven pom.xml dependencies, application.properties, PostgreSQL connection pool metrics, and Spring Boot controller beans.'
  }
];

export default function VaultHub({ onSendToAI }: VaultHubProps) {
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [files, setFiles] = useState<CollegeFile[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // null means root view (all or unfiltered)
  const [activeFilePreview, setActiveFilePreview] = useState<CollegeFile | null>(null);
  
  // Create Folder ModalState
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('indigo');

  // Create File ModalState
  const [showFileModal, setShowFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'pdf' | 'doc' | 'image' | 'code' | 'zip'>('pdf');
  const [newFileText, setNewFileText] = useState('');
  const [targetFolderSelection, setTargetFolderSelection] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    const loadVault = async () => {
      try {
        const [loadedFolders, loadedFiles] = await Promise.all([
          api.listVaultFolders(),
          api.listVaultFiles(),
        ]);
        if (!isActive) return;
        setFolders(loadedFolders);
        setFiles(loadedFiles);
      } catch (error) {
        console.error(error);
        if (isActive) triggerNotice('Could not load Vault data from the server.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    loadVault();
    return () => {
      isActive = false;
    };
  }, []);

  const colorsList = [
    { value: 'indigo', bg: 'bg-indigo-500', ring: 'ring-indigo-300' },
    { value: 'emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-300' },
    { value: 'amber', bg: 'bg-amber-500', ring: 'ring-amber-300' },
    { value: 'rose', bg: 'bg-rose-500', ring: 'ring-rose-300' },
    { value: 'purple', bg: 'bg-purple-500', ring: 'ring-purple-300' },
    { value: 'sky', bg: 'bg-sky-500', ring: 'ring-sky-300' },
  ];

  const uploadVaultFile = async (file: File, folderId?: string, textContent?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    if (textContent) formData.append('textContent', textContent);
    const savedFile = await api.uploadVaultFile(formData);
    setFiles(prev => [savedFile, ...prev]);
    return savedFile;
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const newFolder = await api.createVaultFolder({name: newFolderName.trim(), color: newFolderColor});
      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setShowFolderModal(false);
      triggerNotice(`Folder "${newFolder.name}" successfully created!`);
    } catch (error) {
      console.error(error);
      triggerNotice('Could not create folder.');
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const filename = newFileName.includes('.') ? newFileName : `${newFileName}.${newFileType === 'doc' ? 'txt' : newFileType}`;
    const content = newFileText.trim() || `No document contents drafted. Ask any AI model for insights about "${newFileName}".`;
    const file = new File([content], filename, {type: 'text/plain'});

    try {
      const newFile = await uploadVaultFile(file, targetFolderSelection || undefined, content);
      setNewFileName('');
      setNewFileText('');
      setShowFileModal(false);
      triggerNotice(`File "${newFile.name}" added successfully to Vault!`);
    } catch (error) {
      console.error(error);
      triggerNotice('Could not upload file.');
    }
  };

  const handleDeleteFile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this file from the Vault?')) {
      try {
        await api.deleteVaultFile(id);
        setFiles(prev => prev.filter(f => f.id !== id));
        if (activeFilePreview && activeFilePreview.id === id) {
          setActiveFilePreview(null);
        }
        triggerNotice('File deleted.');
      } catch (error) {
        console.error(error);
        triggerNotice('Could not delete file.');
      }
    }
  };

  const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this folder and its contents?')) {
      try {
        await api.deleteVaultFolder(id);
        setFolders(prev => prev.filter(f => f.id !== id));
        setFiles(prev => prev.filter(f => f.folderId !== id));
        if (selectedFolderId === id) {
          setSelectedFolderId(null);
        }
        triggerNotice('Folder & child files deleted.');
      } catch (error) {
        console.error(error);
        triggerNotice('Could not delete folder.');
      }
    }
  };

  const triggerNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => {
      setActionNotice(null);
    }, 4000);
  };

  // Drag and drop mechanics
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const dragFiles = e.dataTransfer.files;
    if (dragFiles && dragFiles.length > 0) {
      const firstFile = dragFiles[0];
      const name = firstFile.name;
      try {
        await uploadVaultFile(firstFile, selectedFolderId || undefined);
        triggerNotice(`Successfully uploaded "${name}" through drag and drop!`);
      } catch (error) {
        console.error(error);
        triggerNotice(`Could not upload "${name}".`);
      }
    }
  };

  const triggerManualFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleManualFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (list && list.length > 0) {
      const rawFile = list[0];
      const name = rawFile.name;
      try {
        await uploadVaultFile(rawFile, selectedFolderId || undefined);
        triggerNotice(`Successfully imported local document "${name}"!`);
      } catch (error) {
        console.error(error);
        triggerNotice(`Could not upload "${name}".`);
      } finally {
        e.target.value = '';
      }
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="text-rose-500" strokeWidth={2} />;
      case 'doc':
        return <FileText className="text-blue-500" strokeWidth={2} />;
      case 'image':
        return <FileImage className="text-emerald-500" strokeWidth={2} />;
      case 'code':
        return <FileCode className="text-amber-500" strokeWidth={2} />;
      case 'zip':
        return <Archive className="text-purple-500" strokeWidth={2} />;
      default:
        return <FileText className="text-slate-500" strokeWidth={2} />;
    }
  };

  const getFolderColorClass = (color: string) => {
    switch (color) {
      case 'indigo': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'emerald': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'amber': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'rose': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'purple': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'sky': return 'text-sky-600 bg-sky-50 border-sky-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getFolderHoverColor = (color: string) => {
    switch (color) {
      case 'indigo': return 'hover:bg-indigo-100/60';
      case 'emerald': return 'hover:bg-emerald-100/60';
      case 'amber': return 'hover:bg-amber-100/60';
      case 'rose': return 'hover:bg-rose-100/60';
      case 'purple': return 'hover:bg-purple-100/60';
      case 'sky': return 'hover:bg-sky-100/60';
      default: return 'hover:bg-slate-100';
    }
  };

  // Filter logic
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (file.textContent && file.textContent.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFolder = selectedFolderId ? file.folderId === selectedFolderId : true;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="space-y-6" id="college-vault-container">
      
      {/* Dynamic Activity Notice Alert */}
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 bg-brand-primary border border-brand-outline text-white py-3 px-5 rounded-2xl shadow-xl z-50 flex items-center gap-2.5 text-xs font-semibold"
          >
            <Check size={16} className="text-brand-vibrant" />
            <span>{actionNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="bg-white border border-brand-outline rounded-2xl px-4 py-3 text-xs font-bold text-brand-muted flex items-center gap-2">
          <RefreshCw size={14} className="animate-spin text-brand-primary" />
          Loading your persisted vault...
        </div>
      )}

      {/* Header section explaining the Vault and Project limits */}
      <div className="bg-white border border-brand-outline rounded-3xl p-6 shadow-xxs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[10px] bg-[#E9EDC9] text-brand-primary font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                Semester Storage
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-brand-muted font-mono">Offline-Encrypted Vault (Local State)</span>
            </div>
            <h1 className="font-heading font-black text-2xl tracking-tight text-brand-dark">
              College Vault & Projects Hub
            </h1>
            <p className="text-xs text-brand-muted mt-1 max-w-2xl leading-relaxed">
              Create student folders, deposit assignments, research drafts, and presentation codes. 
              You can instantly trigger <strong>ChatGPT, Gemini, Claude, or Perplexity AI</strong> to clear doubts or answer questions directly linked to these files.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowFolderModal(true)}
              className="py-2.5 px-4 bg-white hover:bg-slate-50 border border-brand-outline text-brand-dark rounded-xl text-xs font-bold flex items-center gap-2 transition"
            >
              <FolderPlus size={15} className="text-indigo-600" />
              <span>New Folder</span>
            </button>
            <button
              onClick={() => {
                setTargetFolderSelection(selectedFolderId || '');
                setShowFileModal(true);
              }}
              className="py-2.5 px-4 bg-brand-primary hover:opacity-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition"
            >
              <Plus size={15} />
              <span>Upload Document</span>
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb controller and filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-brand-outline rounded-2xl p-4 shadow-xxs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`text-xs px-3 py-1.5 rounded-lg transition font-bold ${
              selectedFolderId === null 
                ? 'bg-slate-100 text-brand-primary' 
                : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            All Files (Vault)
          </button>
          {selectedFolderId && (
            <>
              <span className="text-brand-muted font-light">/</span>
              <span className="text-xs font-black text-brand-dark px-2 py-0.5 rounded-sm bg-indigo-50 text-indigo-700">
                {folders.find(f => f.id === selectedFolderId)?.name || 'Folder'}
              </span>
            </>
          )}
        </div>

        {/* Real-time search parameters */}
        <div className="relative max-w-xs w-full">
          <Search size={14} className="absolute left-3 top-2.5 text-brand-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search filenames or extracted PDF text..."
            className="w-full text-xs bg-slate-50 border border-brand-outline rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column (2-span size if no preview, otherwise maps out folders and items lists) */}
        <div className={`${activeFilePreview ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6 transition-all duration-300`}>
          
          {/* Folders List (only show when at root Vault level) */}
          {selectedFolderId === null && (
            <div className="space-y-3">
              <h3 className="font-sans font-extrabold text-xs text-brand-muted uppercase tracking-wider flex items-center gap-1.5">
                <Folder size={12} /> College Subject Folders ({folders.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {folders.map((folder) => {
                  const childCount = files.filter(f => f.folderId === folder.id).length;
                  const colClass = getFolderColorClass(folder.color);
                  const hovClass = getFolderHoverColor(folder.color);
                  return (
                    <div
                      key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-xxs ${colClass} ${hovClass} flex flex-col justify-between h-28 relative group`}
                    >
                      <button
                        onClick={(e) => handleDeleteFolder(folder.id, e)}
                        className="absolute top-3 right-3 p-1 hover:bg-rose-100 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition duration-150"
                        title="Delete folder and contents"
                      >
                        <Trash2 size={13} />
                      </button>

                      <Folder size={26} strokeWidth={2.5} />
                      
                      <div className="mt-4">
                        <h4 className="font-sans font-black text-xs text-brand-dark block truncate">
                          {folder.name}
                        </h4>
                        <span className="text-[10px] text-brand-muted mt-0.5 block">
                          {childCount} {childCount === 1 ? 'document' : 'documents'} sorted
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Files List Layout */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-extrabold text-xs text-brand-muted uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={12} /> Deposited College Documents ({filteredFiles.length})
              </h3>
              
              {selectedFolderId && (
                <button
                  onClick={() => setSelectedFolderId(null)}
                  className="text-[11px] text-brand-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={10} /> Back to root Hub
                </button>
              )}
            </div>

            {/* Drag drop dropzone box panel layout */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-200 select-none ${
                isDragging 
                  ? 'bg-indigo-50 border-indigo-500 scale-[0.99] text-indigo-700' 
                  : 'bg-white border-brand-outline hover:bg-slate-50/50'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleManualFileSelected} 
                className="hidden" 
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip,.cpp,.js,.ts"
              />
              <div className="flex flex-col items-center justify-center">
                <div className="p-3 bg-brand-bg rounded-2xl mb-3 border border-brand-outline">
                  <Upload size={22} className="text-brand-primary animate-bounce style={{ animationDuration: '3s' }}" />
                </div>
                <h4 className="text-xs font-black text-brand-dark">Drag and drop student study files here</h4>
                <p className="text-[10px] text-brand-muted mt-0.5">Syllabus PDF, handwritten photos, labs, homework docx...</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[9px] text-brand-muted">or</span>
                  <button
                    onClick={triggerManualFileInput}
                    type="button"
                    className="py-1.5 px-3 bg-brand-primary hover:opacity-95 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                  >
                    Select File manually
                  </button>
                </div>
              </div>
            </div>

            {/* Real items List */}
            {filteredFiles.length === 0 ? (
              <div className="bg-slate-50 border border-brand-outline rounded-3xl p-10 text-center text-brand-muted">
                <AlertCircle size={24} className="mx-auto mb-2 text-brand-dark/40" />
                <p className="text-xs font-semibold">No files match the search filters in this directory.</p>
                <p className="text-[10px] text-brand-muted mt-0.5">Drag and drop any file above or add homework details using the buttons.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredFiles.map((file) => {
                  const parentFolder = folders.find(f => f.id === file.folderId);
                  const isViewing = activeFilePreview?.id === file.id;

                  return (
                    <div
                      key={file.id}
                      onClick={() => setActiveFilePreview(file)}
                      className={`p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex items-center justify-between relative group ${
                        isViewing 
                          ? 'bg-[#E9EDC9]/20 border-brand-primary font-black shadow-xs' 
                          : 'bg-white border-brand-outline hover:bg-slate-50 shadow-xxs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Circle container for Document Icon representation */}
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-brand-outline flex items-center justify-center shrink-0">
                          {getFileIcon(file.type)}
                        </div>
                        
                        <div className="min-w-0">
                          <h4 className="font-sans font-bold text-xs text-brand-dark truncate">
                            {file.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[9px] text-brand-muted font-mono">{file.size}</span>
                            <span className="text-[9px] text-brand-muted">•</span>
                            <span className="text-[9px] text-brand-muted font-mono">{file.createdAt}</span>
                            {parentFolder && (
                              <>
                                <span className="text-[9px] text-brand-muted">•</span>
                                <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-1 rounded-sm">
                                  {parentFolder.name.replace(/[^A-Za-z0-9\s-]/g, '').trim()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* File interactive utilities */}
                      <div className="flex items-center gap-1 shrink-0 select-none">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (file.textContent) {
                              onSendToAI(file.textContent, file.name);
                            }
                          }}
                          className="p-1.5 hover:bg-brand-primary/5 text-brand-primary hover:text-brand-dark rounded-lg transition duration-150 flex items-center gap-1"
                          title="Ask AIs about this file"
                        >
                          <Sparkles size={13} className="text-brand-vibrant animate-pulse" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteFile(file.id, e)}
                          className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition duration-150"
                          title="Delete file"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

        {/* Right side Document Viewer panel */}
        {activeFilePreview && (
          <div className="lg:col-span-1" id="vault-document-viewer-column">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              className="bg-white border border-brand-outline rounded-3xl p-5 shadow-xs flex flex-col justify-between sticky top-6 max-h-[820px] overflow-y-auto"
            >
              
              {/* Header inside display card */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-brand-outline pb-3">
                  <span className="text-[10px] font-bold text-brand-muted tracking-wider uppercase flex items-center gap-1">
                    <Eye size={12} className="text-brand-primary" /> Active Document Preview
                  </span>
                  <button
                    onClick={() => setActiveFilePreview(null)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-brand-dark transition"
                    title="Close document preview"
                  >
                    <ArrowLeft size={14} />
                  </button>
                </div>

                {/* Meta details */}
                <div className="bg-slate-50 border border-brand-outline rounded-2xl p-3 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-brand-outline flex items-center justify-center shrink-0">
                    {getFileIcon(activeFilePreview.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-sans font-black text-xs text-brand-dark truncate">{activeFilePreview.name}</h4>
                    <span className="block text-[10px] text-brand-muted mt-0.5">Size: {activeFilePreview.size} | Added: {activeFilePreview.createdAt}</span>
                    <span className="inline-block mt-1.5 text-[9px] bg-slate-200/60 font-mono text-slate-800 px-1.5 py-0.5 rounded uppercase">
                      {activeFilePreview.type} Format
                    </span>
                  </div>
                </div>

                {/* Extracted file outline body contents */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-brand-muted tracking-wide block">Extracted Text Content / Code Framework:</label>
                  <div className="bg-brand-bg/60 border border-brand-outline/80 rounded-xl p-3 max-h-56 overflow-y-auto text-xs font-mono text-brand-dark leading-relaxed whitespace-pre-wrap select-text selection:bg-brand-primary selection:text-white">
                    {activeFilePreview.textContent}
                  </div>
                </div>

                {/* Ask AI Bridge box trigger */}
                <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brand-vibrant animate-pulse shrink-0" />
                    <h5 className="font-heading font-black text-xs text-brand-dark">Resolve doubt with AI Experts</h5>
                  </div>
                  <p className="text-[10px] text-brand-muted leading-relaxed">
                    Instantly load this file content into our Multi-Agent pop-up container. You can prompt <strong>ChatGPT-4o</strong>, <strong>Gemini</strong>, <strong>Claude</strong> or <strong>Perplexity</strong> to solve logic, verify math or draft notes.
                  </p>
                  
                  <button
                    onClick={() => {
                      if (activeFilePreview.textContent) {
                        onSendToAI(activeFilePreview.textContent, activeFilePreview.name);
                      }
                    }}
                    type="button"
                    className="w-full text-center py-2 bg-brand-primary hover:opacity-95 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={12} className="text-brand-vibrant" />
                    <span>Ask ChatGPT, Gemini or Claude</span>
                  </button>
                </div>

              </div>

              {/* Download mock utility */}
              <div className="border-t border-brand-outline/65 pt-4 mt-5 flex items-center justify-between text-xs font-bold text-brand-primary select-none">
                <button
                  type="button"
                  onClick={() => alert(`📦 Standard browser file download initiated for "${activeFilePreview.name}". Keep your archives updated!`)}
                  className="hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download original</span>
                </button>
                <button
                  onClick={(e) => handleDeleteFile(activeFilePreview.id, e)}
                  type="button"
                  className="text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Remove Document</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}

      </div>

      {/* MODAL 1: Create Folder */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-brand-dark/45 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-brand-outline shadow-2xl p-6 w-full max-w-md space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3 border-brand-outline">
              <h3 className="font-sans font-black text-sm text-brand-dark uppercase tracking-wide">Create subject folder</h3>
              <button onClick={() => setShowFolderModal(false)} className="text-brand-muted hover:text-brand-dark">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-wide block">Folder Name</label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. 📜 History, 🧬 Bio Lab, 📐 Complex Calculus"
                  className="w-full text-xs px-3 py-2 border border-brand-outline rounded-xl focus:ring-1 focus:ring-brand-primary focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-wide block">Accent Theme Color</label>
                <div className="flex items-center gap-2.5">
                  {colorsList.map((col) => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setNewFolderColor(col.value)}
                      className={`w-6 h-6 rounded-full ${col.bg} transition-all duration-150 ${
                        newFolderColor === col.value 
                          ? `ring-4 ring-offset-2 ${col.ring} scale-110` 
                          : 'hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full text-center py-2.5 bg-brand-primary text-white hover:opacity-95 text-xs font-bold rounded-xl transition mt-2 cursor-pointer"
              >
                Assemble Folder (Vault)
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: Create / Upload File */}
      {showFileModal && (
        <div className="fixed inset-0 bg-brand-dark/45 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-brand-outline shadow-2xl p-6 w-full max-w-lg space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3 border-brand-outline">
              <h3 className="font-sans font-black text-sm text-brand-dark uppercase tracking-wide font-heading">Deposit Student document</h3>
              <button onClick={() => setShowFileModal(false)} className="text-brand-muted hover:text-brand-dark">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateFile} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1 space-y-1">
                  <label className="text-[10px] font-black text-brand-muted uppercase tracking-wide block">Document Name</label>
                  <input
                    type="text"
                    required
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="e.g. AI_Formulas"
                    className="w-full text-xs px-3 py-2 border border-brand-outline rounded-xl focus:ring-1 focus:ring-brand-primary focus:outline-none"
                  />
                </div>

                <div className="col-span-1 space-y-1">
                  <label className="text-[10px] font-black text-brand-muted uppercase tracking-wide block">Document Type</label>
                  <select
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-brand-outline rounded-xl bg-white focus:ring-1 focus:ring-brand-primary focus:outline-none"
                  >
                    <option value="pdf">PDF Study material</option>
                    <option value="doc">Word / Text outline</option>
                    <option value="image">Snapshot Image</option>
                    <option value="code">Source Code Node</option>
                    <option value="zip">Archive ZIP folder</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-wide block">Target Folder (Storage)</label>
                <select
                  value={targetFolderSelection}
                  onChange={(e) => setTargetFolderSelection(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-brand-outline rounded-xl bg-white focus:ring-1 focus:ring-brand-primary focus:outline-none"
                >
                  <option value="">No parent folder (Uncategorized Root)</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-wide block">Document Body Text Contents (For OCR/AI scanning)</label>
                <textarea
                  rows={4}
                  value={newFileText}
                  onChange={(e) => setNewFileText(e.target.value)}
                  placeholder="Insert notes, outlines, code fragments, or mock chemistry definitions here..."
                  className="w-full text-xs p-3 border border-brand-outline rounded-xl font-mono focus:ring-1 focus:ring-brand-primary focus:outline-none bg-slate-50"
                />
              </div>

              <button
                type="submit"
                className="w-full text-center py-2.5 bg-brand-primary text-white hover:opacity-95 text-xs font-bold rounded-xl transition mt-2 cursor-pointer"
              >
                Deposit in Vault
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
