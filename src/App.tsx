import React, { useState, useCallback, useEffect } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { AppShell } from './components/AppShell';
import { FileUpload } from './components/FileUpload';
import { ScriptLibrary } from './components/ScriptLibrary';
import { SummaryDisplay } from './components/SummaryDisplay';
import { Button } from './components/ui/Button';
import { Card, CardHeader, CardContent } from './components/ui/Card';

interface ProcessedScript {
  id: string;
  title: string;
  content: string;
  filePath: string;
  summary?: any;
}

const App: React.FC = () => {
  const [processedScripts, setProcessedScripts] = useState<ProcessedScript[]>([]);
  const [selectedScript, setSelectedScript] = useState<ProcessedScript | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  // Load existing scripts on app start
  useEffect(() => {
    const loadExistingScripts = async () => {
      try {
        const existingScripts = await window.electronAPI.db.getAllScripts();
        const scriptsWithContent: ProcessedScript[] = [];
        
        for (const script of existingScripts) {
          try {
            // Try to read the file content if it still exists
            const parsedScript = await window.electronAPI.file.process(script.file_path);
            
            // Get summary if it exists
            const summary = await window.electronAPI.db.getSummary(script.id.toString());
            
            scriptsWithContent.push({
              id: script.id.toString(),
              title: script.title,
              content: parsedScript.content,
              filePath: script.file_path,
              summary: summary ? {
                plotOverview: summary.plot_overview,
                mainCharacters: JSON.parse(summary.characters || '[]'),
                themes: JSON.parse(summary.themes || '[]'),
                productionNotes: JSON.parse(summary.production_notes || '[]'),
                genre: summary.genre
              } : undefined
            });
          } catch (error) {
            console.warn(`Could not load content for script ${script.title}:`, error);
            // Still add the script but without content
            scriptsWithContent.push({
              id: script.id.toString(),
              title: script.title,
              content: '',
              filePath: script.file_path
            });
          }
        }
        
        setProcessedScripts(scriptsWithContent);
      } catch (error) {
        console.error('Failed to load existing scripts:', error);
      }
    };

    loadExistingScripts();
  }, []);

  const handleFilesSelected = useCallback(async (files: { name: string; path: string }[]) => {
    setIsProcessing(true);
    
    try {
      for (const file of files) {
        console.log('Processing file:', file.name);
        
        // First, validate the file
        const validation = await window.electronAPI.file.validate(file.path);
        
        if (!validation.isValid) {
          console.error('File validation failed:', validation.errors);
          alert(`File validation failed for ${file.name}: ${validation.errors.map(e => e.message).join(', ')}`);
          continue;
        }

        // Process the file
        const parsedScript = await window.electronAPI.file.process(file.path);
        console.log('File processed:', parsedScript);

        // Check if script already exists and handle gracefully
        const contentHash = generateContentHash(parsedScript.content);
        let savedScript;
        
        try {
          savedScript = await window.electronAPI.db.saveScript({
            title: parsedScript.title,
            file_path: file.path,
            content_hash: contentHash,
            word_count: parsedScript.metadata.wordCount
          });
        } catch (saveError: any) {
          if (saveError.message.includes('UNIQUE constraint failed')) {
            // Script already exists, find it in the database
            const existingScripts = await window.electronAPI.db.getAllScripts();
            savedScript = existingScripts.find(script => script.content_hash === contentHash);
            
            if (savedScript) {
              console.log(`Script "${file.name}" already exists in database, using existing record`);
              // Show a friendly message instead of an error
              alert(`"${file.name}" has already been processed. Switching to library view.`);
            } else {
              throw saveError; // Re-throw if it's a different issue
            }
          } else {
            throw saveError; // Re-throw if it's not a duplicate constraint error
          }
        }

        // Add to processed scripts
        const processedScript: ProcessedScript = {
          id: savedScript.id.toString(),
          title: parsedScript.title,
          content: parsedScript.content,
          filePath: file.path
        };

        setProcessedScripts(prev => [...prev, processedScript]);
        
        // Generate summary
        try {
          const summary = await window.electronAPI.llm.generateSummary(
            parsedScript.content,
            {
              length: 'detailed',
              focusAreas: ['plot', 'characters', 'themes', 'production'],
              temperature: 0.7,
              includeProductionNotes: true,
              analyzeCharacterRelationships: true,
              identifyThemes: true,
              assessMarketability: false
            }
          );

          // Save summary to database
          await window.electronAPI.db.saveSummary({
            script_id: parseInt(savedScript.id.toString()),
            plot_overview: summary.plotOverview,
            characters: JSON.stringify(summary.mainCharacters),
            themes: JSON.stringify(summary.themes),
            production_notes: JSON.stringify(summary.productionNotes),
            genre: summary.genre || 'Unknown',
            model_used: 'gemma3:1b'
          });

          // Update the processed script with summary
          setProcessedScripts(prev => 
            prev.map(script => 
              script.id === savedScript.id.toString() 
                ? { ...script, summary }
                : script
            )
          );

          console.log('Summary generated:', summary);
        } catch (summaryError: any) {
          console.error('Failed to generate summary:', summaryError);
          alert(`Failed to generate summary for ${file.name}: ${summaryError?.message || 'Unknown error'}`);
        }
      }
      
      // Switch to scripts view after processing
      setCurrentView('scripts');
    } catch (error: any) {
      console.error('File processing error:', error);
      alert(`Error processing files: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const generateContentHash = (content: string): string => {
    // Simple hash function for content
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  };

  const handleScriptSelect = (script: ProcessedScript) => {
    setSelectedScript(script);
    setCurrentView('summaries');
  };

  const handleScriptDelete = async (scriptId: string) => {
    try {
      // Delete from database
      await window.electronAPI.db.deleteScript(scriptId);
      
      // Remove from local state
      setProcessedScripts(prev => prev.filter(script => script.id !== scriptId));
      
      // Clear selected script if it was deleted
      if (selectedScript?.id === scriptId) {
        setSelectedScript(null);
      }
      
      console.log(`Script ${scriptId} deleted successfully`);
    } catch (error: unknown) {
      console.error('Failed to delete script:', error);
      alert(`Failed to delete script: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <Card variant="elevated">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-slate-100">
                    Welcome to Script Analyzer
                  </h2>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 mb-6">
                    Upload your script files to analyze them with local AI processing. 
                    All processing happens on your device for complete privacy.
                  </p>
                  <FileUpload 
                    onFilesSelected={handleFilesSelected}
                    acceptedTypes={['.pdf', '.docx', '.txt']}
                    maxFileSize={50}
                    multiple={true}
                  />
                  {isProcessing && (
                    <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-300">
                        Processing files and generating summaries... This may take a few moments.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card variant="hover">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl mb-2">📄</div>
                    <div className="text-2xl font-bold text-slate-100">{processedScripts.length}</div>
                    <div className="text-sm text-slate-400">Total Scripts</div>
                  </CardContent>
                </Card>
                <Card variant="hover">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl mb-2">✅</div>
                    <div className="text-2xl font-bold text-slate-100">
                      {processedScripts.filter(s => s.summary).length}
                    </div>
                    <div className="text-sm text-slate-400">Analyzed</div>
                  </CardContent>
                </Card>
                <Card variant="hover">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl mb-2">⏳</div>
                    <div className="text-2xl font-bold text-slate-100">
                      {processedScripts.filter(s => !s.summary).length}
                    </div>
                    <div className="text-sm text-slate-400">Pending</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      case 'scripts':
        return (
          <div className="p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Your Scripts</h3>
                <p className="text-slate-400">Manage and organize your uploaded scripts</p>
              </div>
              <ScriptLibrary 
                scripts={processedScripts}
                onScriptSelect={handleScriptSelect}
                onScriptDelete={handleScriptDelete}
              />
            </div>
          </div>
        );

      case 'summaries':
        return (
          <div className="p-6">
            {selectedScript ? (
              <div className="max-w-4xl mx-auto">
                <SummaryDisplay 
                  script={selectedScript}
                  summary={selectedScript.summary}
                />
              </div>
            ) : (
              <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">Script Summaries</h3>
                  <p className="text-slate-400">View AI-generated summaries of your scripts</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {processedScripts.filter(script => script.summary).map((script) => (
                    <Card 
                      key={script.id} 
                      variant="hover" 
                      className="cursor-pointer"
                      onClick={() => handleScriptSelect(script)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-slate-100 text-lg mb-1">
                              {script.title}
                            </h4>
                            <p className="text-sm text-slate-400">
                              {script.summary?.genre || 'Unknown Genre'}
                            </p>
                          </div>
                          <span className="text-2xl">✅</span>
                        </div>
                        <p className="text-slate-300 text-sm line-clamp-3">
                          {script.summary?.plotOverview?.substring(0, 150)}...
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {processedScripts.filter(script => script.summary).length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="text-6xl mb-4">📝</div>
                      <h3 className="text-lg font-semibold text-slate-300 mb-2">
                        No Summaries Yet
                      </h3>
                      <p className="text-slate-400">
                        Upload and analyze scripts to see their summaries here.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        );

      case 'compare':
        return (
          <div className="p-6">
            <div className="max-w-6xl mx-auto">
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">⚖️</div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">
                    Compare Scripts
                  </h3>
                  <p className="text-slate-400">
                    Script comparison feature coming soon!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">⚙️</div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">
                    Settings
                  </h3>
                  <p className="text-slate-400">
                    Settings panel coming soon!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" enableAnimations={true}>
      <AppShell currentView={currentView} onNavigate={handleNavigate}>
        {renderCurrentView()}
      </AppShell>
    </ThemeProvider>
  );
};

export default App;
