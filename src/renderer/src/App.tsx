import React, { useState } from 'react'
import { LayoutDashboard, Layers, History, Terminal, Cpu } from 'lucide-react'
import Dashboard from './components/Dashboard'
import TestSuiteManager from './components/TestSuiteManager'
import TestBuilder from './components/TestBuilder'
import TestRunnerConsole from './components/TestRunnerConsole'
import Reports from './components/Reports'

type Tab = 'dashboard' | 'suites' | 'builder' | 'runner' | 'history'

interface TabArg {
  suiteId?: number
  caseId?: number
  runId?: number | null
}

export default function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [tabArg, setTabArg] = useState<TabArg>({})

  // Custom Navigation Router
  function handleNavigate(tab: string, arg: any = {}): void {
    setActiveTab(tab as Tab)
    setTabArg(arg)
  }

  return (
    <div className="flex min-h-screen text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 1. Sidebar Navigation */}
      <aside className="w-64 bg-slate-950/70 border-r border-slate-900 backdrop-blur-xl flex flex-col justify-between p-6 fixed h-screen z-20">
        <div className="space-y-8">
          {/* Brand Logo Header */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Cpu className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-wider block bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Playwright
              </span>
              <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-widest -mt-0.5">
                Studio IDE
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {/* Dashboard */}
            <button
              onClick={() => handleNavigate('dashboard')}
              className={`w-full px-4 py-3 rounded-lg flex items-center space-x-3 text-xs font-semibold uppercase tracking-wider transition duration-200 active:scale-[0.98] ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            {/* Test Suites */}
            <button
              onClick={() => handleNavigate('suites')}
              className={`w-full px-4 py-3 rounded-lg flex items-center space-x-3 text-xs font-semibold uppercase tracking-wider transition duration-200 active:scale-[0.98] ${
                activeTab === 'suites' || activeTab === 'builder' || activeTab === 'runner'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Test Suites</span>
            </button>

            {/* Run History */}
            <button
              onClick={() => handleNavigate('history')}
              className={`w-full px-4 py-3 rounded-lg flex items-center space-x-3 text-xs font-semibold uppercase tracking-wider transition duration-200 active:scale-[0.98] ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Run History</span>
            </button>
          </nav>
        </div>

        {/* Footer info */}
        <div className="space-y-4 border-t border-slate-900 pt-4">
          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-900/80 flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-mono text-slate-500 font-semibold">Engine: Playwright v1.48</span>
          </div>
          <div className="text-[10px] font-mono text-slate-600 text-center font-medium">
            v1.0.0 (Stable Release)
          </div>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <main className="flex-1 pl-64 min-h-screen relative z-10">
        <div className="max-w-6xl mx-auto p-8 md:p-10 pb-20">
          {activeTab === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {activeTab === 'suites' && <TestSuiteManager onNavigate={handleNavigate} />}
          {activeTab === 'builder' && (
            <TestBuilder
              suiteId={tabArg.suiteId || 0}
              caseId={tabArg.caseId}
              onNavigate={handleNavigate}
            />
          )}
          {activeTab === 'runner' && (
            <TestRunnerConsole caseId={tabArg.caseId || 0} />
          )}
          {activeTab === 'history' && (
            <Reports initialRunId={tabArg.runId} onNavigate={handleNavigate} />
          )}
        </div>
      </main>
    </div>
  )
}
