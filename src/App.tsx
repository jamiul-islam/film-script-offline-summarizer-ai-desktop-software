import React from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { Button } from './components/ui/Button';
import { Card, CardHeader, CardContent } from './components/ui/Card';

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="dark" enableAnimations={true}>
      <div className="container-app">
        <header className="header-app">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gradient">
                Script Summarizer App
              </h1>
              <p className="text-slate-400 mt-1">
                Welcome to your secure script analysis tool
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm">
                Settings
              </Button>
              <Button variant="primary" size="sm">
                Upload Script
              </Button>
            </div>
          </div>
        </header>

        <div className="main-app">
          <aside className="sidebar-app">
            <div className="p-4">
              <nav className="space-y-2">
                <a href="#" className="nav-item-active">
                  <span>Dashboard</span>
                </a>
                <a href="#" className="nav-item">
                  <span>Scripts</span>
                </a>
                <a href="#" className="nav-item">
                  <span>Summaries</span>
                </a>
                <a href="#" className="nav-item">
                  <span>Compare</span>
                </a>
              </nav>
            </div>
          </aside>

          <main className="content-app p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <Card variant="elevated" className="animate-slide-in-up">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-slate-100">
                    Getting Started
                  </h2>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 mb-4">
                    Ready to analyze scripts locally with privacy and security.
                  </p>
                  <div className="flex space-x-3">
                    <Button variant="primary">Upload Your First Script</Button>
                    <Button variant="secondary">Learn More</Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card variant="hover" className="animate-slide-in-up delay-100">
                  <CardContent>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
                        <span className="text-white font-bold">📄</span>
                      </div>
                      <h3 className="font-semibold text-slate-100 mb-2">
                        Upload Scripts
                      </h3>
                      <p className="text-sm text-slate-400">
                        Support for PDF, DOCX, and TXT formats
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="hover" className="animate-slide-in-up delay-200">
                  <CardContent>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-accent-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
                        <span className="text-white font-bold">🤖</span>
                      </div>
                      <h3 className="font-semibold text-slate-100 mb-2">
                        AI Analysis
                      </h3>
                      <p className="text-sm text-slate-400">
                        Local LLM processing for complete privacy
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="hover" className="animate-slide-in-up delay-300">
                  <CardContent>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-success-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
                        <span className="text-white font-bold">📊</span>
                      </div>
                      <h3 className="font-semibold text-slate-100 mb-2">
                        Compare & Rate
                      </h3>
                      <p className="text-sm text-slate-400">
                        Side-by-side comparison and evaluation tools
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;
