import React, { useEffect, useState } from 'react'
import { FolderPlus, Trash2, FilePlus, Play, Edit, Folder, AlertTriangle } from 'lucide-react'

interface TestSuite {
  id: number
  name: string
  description?: string
  created_at: string
}

interface TestCase {
  id: number
  suite_id: number
  name: string
  description?: string
  url: string
  steps: string
}

interface TestSuiteManagerProps {
  onNavigate: (tab: string, arg?: any) => void
}

export default function TestSuiteManager({ onNavigate }: TestSuiteManagerProps): React.JSX.Element {
  const [suites, setSuites] = useState<TestSuite[]>([])
  const [selectedSuiteId, setSelectedSuiteId] = useState<number | null>(null)
  const [cases, setCases] = useState<TestCase[]>([])
  
  // Modals / Input fields
  const [showNewSuiteModal, setShowNewSuiteModal] = useState(false)
  const [newSuiteName, setNewSuiteName] = useState('')
  const [newSuiteDesc, setNewSuiteDesc] = useState('')

  // Load Suites
  async function loadSuites(): Promise<void> {
    try {
      const data = await window.api.getSuites()
      setSuites(data)
      if (data.length > 0 && selectedSuiteId === null) {
        setSelectedSuiteId(data[0].id)
      }
    } catch (err) {
      console.error('Failed to load suites:', err)
    }
  }

  // Load Cases
  async function loadCases(suiteId: number): Promise<void> {
    try {
      const data = await window.api.getCases(suiteId)
      setCases(data)
    } catch (err) {
      console.error('Failed to load cases:', err)
    }
  }

  useEffect(() => {
    loadSuites()
  }, [])

  useEffect(() => {
    if (selectedSuiteId !== null) {
      loadCases(selectedSuiteId)
    } else {
      setCases([])
    }
  }, [selectedSuiteId])

  // Create Suite
  async function handleCreateSuite(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!newSuiteName.trim()) return
    try {
      const newId = await window.api.createSuite(newSuiteName, newSuiteDesc)
      setNewSuiteName('')
      setNewSuiteDesc('')
      setShowNewSuiteModal(false)
      await loadSuites()
      setSelectedSuiteId(newId)
    } catch (err) {
      console.error('Failed to create suite:', err)
    }
  }

  // Delete Suite
  async function handleDeleteSuite(id: number): Promise<void> {
    if (!confirm('Are you sure you want to delete this test suite and all its test cases?')) return
    try {
      await window.api.deleteSuite(id)
      setSelectedSuiteId(null)
      await loadSuites()
    } catch (err) {
      console.error('Failed to delete suite:', err)
    }
  }

  // Delete Case
  async function handleDeleteCase(id: number): Promise<void> {
    if (!confirm('Are you sure you want to delete this test case?')) return
    try {
      await window.api.deleteCase(id)
      if (selectedSuiteId !== null) {
        await loadCases(selectedSuiteId)
      }
    } catch (err) {
      console.error('Failed to delete case:', err)
    }
  }

  const selectedSuite = suites.find(s => s.id === selectedSuiteId)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
      {/* Left Column: Suites List */}
      <div className="lg:col-span-1 glass-panel p-5 flex flex-col space-y-4 h-[calc(100vh-12rem)]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-bold text-lg text-slate-200">Test Suites</h2>
          <button
            onClick={() => setShowNewSuiteModal(true)}
            className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition"
            title="Create Suite"
          >
            <FolderPlus className="w-5 h-5" />
          </button>
        </div>

        {/* Suites Item Loop */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {suites.length === 0 ? (
            <div className="text-slate-500 text-xs py-8 text-center">
              No suites created yet. Click the icon above to create one.
            </div>
          ) : (
            suites.map((suite) => (
              <div
                key={suite.id}
                onClick={() => setSelectedSuiteId(suite.id)}
                className={`group p-3 rounded-lg flex items-center justify-between cursor-pointer border transition-all ${
                  selectedSuiteId === suite.id
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-950/20 border-slate-900 text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Folder className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-semibold truncate">{suite.name}</span>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSuite(suite.id)
                    }}
                    className="p-1 rounded text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                    title="Delete Suite"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Test Cases List */}
      <div className="lg:col-span-3 glass-panel p-6 flex flex-col h-[calc(100vh-12rem)]">
        {selectedSuiteId === null ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <AlertTriangle className="w-8 h-8 opacity-20 text-indigo-400" />
            <p className="text-sm">Select or create a test suite to view test cases.</p>
          </div>
        ) : (
          <>
            {/* Suite Header Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-100">{selectedSuite?.name}</h2>
                <p className="text-sm text-slate-400">{selectedSuite?.description || 'No description provided.'}</p>
              </div>
              <button
                onClick={() => onNavigate('builder', { suiteId: selectedSuiteId })}
                className="mt-3 md:mt-0 px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center justify-center space-x-2 text-sm font-semibold hover:bg-indigo-500 shadow-md shadow-indigo-600/15 transition active:scale-95"
              >
                <FilePlus className="w-4 h-4" />
                <span>New Test Case</span>
              </button>
            </div>

            {/* Test Cases Loop */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {cases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
                  <FilePlus className="w-10 h-10 opacity-10" />
                  <span className="text-sm">No test cases inside this suite yet.</span>
                </div>
              ) : (
                cases.map((testCase) => {
                  const stepsArray = JSON.parse(testCase.steps)
                  return (
                    <div
                      key={testCase.id}
                      className="p-5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700/80 transition duration-200"
                    >
                      <div className="space-y-2 max-w-lg">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-slate-200 text-base">{testCase.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                            {stepsArray.length} steps
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed truncate">
                          {testCase.description || 'No description.'}
                        </p>
                        <div className="text-[10px] text-slate-500 truncate font-mono">
                          Target URL: <span className="text-slate-400">{testCase.url}</span>
                        </div>
                      </div>

                      {/* Case Controls */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => onNavigate('runner', { caseId: testCase.id })}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition active:scale-95 shadow-md shadow-emerald-600/10"
                          title="Run Test"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Run</span>
                        </button>
                        <button
                          onClick={() => onNavigate('builder', { suiteId: selectedSuiteId, caseId: testCase.id })}
                          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition"
                          title="Edit Steps"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCase(testCase.id)}
                          className="p-2 rounded-lg bg-slate-850 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                          title="Delete Case"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* New Suite Modal Dialog */}
      {showNewSuiteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSuite}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-2xl animate-scale-up"
          >
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2 border-b border-slate-800 pb-3">
              <FolderPlus className="w-5 h-5 text-indigo-400" />
              <span>Create New Test Suite</span>
            </h3>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Suite Name *</label>
              <input
                type="text"
                value={newSuiteName}
                onChange={(e) => setNewSuiteName(e.target.value)}
                placeholder="e.g. Authentication Flow"
                className="w-full px-3 py-2 text-sm glass-input"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Description</label>
              <textarea
                value={newSuiteDesc}
                onChange={(e) => setNewSuiteDesc(e.target.value)}
                placeholder="Brief summary of test scenarios in this suite..."
                className="w-full px-3 py-2 text-sm glass-input h-20 resize-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowNewSuiteModal(false)
                  setNewSuiteName('')
                  setNewSuiteDesc('')
                }}
                className="px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-850 hover:text-slate-200 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/10 transition active:scale-95"
              >
                Create Suite
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
