import React, { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Clock, Calendar, ArrowLeft, Image as ImageIcon, Play } from 'lucide-react'

interface TestRun {
  id: number
  test_case_id: number
  status: 'running' | 'success' | 'failed'
  duration: number
  started_at: string
  case_name: string
  suite_name: string
  error_message?: string
}

interface TestRunStep {
  id: number
  test_run_id: number
  step_index: number
  name: string
  type: string
  status: 'pending' | 'running' | 'success' | 'failed'
  duration: number
  error?: string
  screenshot_path?: string
}

interface ReportsProps {
  initialRunId?: number | null
  onNavigate: (tab: string, arg?: any) => void
}

export default function Reports({ initialRunId, onNavigate }: ReportsProps): React.JSX.Element {
  const [runs, setRuns] = useState<TestRun[]>([])
  const [selectedRunId, setSelectedRunId] = useState<number | null>(initialRunId || null)
  
  // Selected Run Detail States
  const [runDetails, setRunDetails] = useState<TestRun | null>(null)
  const [runSteps, setRunSteps] = useState<TestRunStep[]>([])
  
  // Screenshot modal preview
  const [modalScreenshot, setModalScreenshot] = useState<string | null>(null)

  // Load runs list
  async function loadRuns(): Promise<void> {
    try {
      const data = await window.api.getRuns()
      setRuns(data)
    } catch (err) {
      console.error('Failed to load runs history:', err)
    }
  }

  // Load detailed run info
  async function loadRunDetails(id: number): Promise<void> {
    try {
      const data = await window.api.getRunDetails(id)
      setRunDetails(data.run)
      setRunSteps(data.steps)
    } catch (err) {
      console.error(`Failed to load details for run #${id}:`, err)
    }
  }

  useEffect(() => {
    loadRuns()
  }, [])

  useEffect(() => {
    if (selectedRunId !== null) {
      loadRunDetails(selectedRunId)
    } else {
      setRunDetails(null)
      setRunSteps([])
    }
  }, [selectedRunId])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Main View: Details of Selected Run */}
      {selectedRunId !== null && runDetails ? (
        <div className="space-y-6">
          {/* Header controls */}
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <button
              onClick={() => {
                setSelectedRunId(null)
                onNavigate('history', null) // clear param
              }}
              className="p-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Test Execution Report</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Run ID: <span className="text-slate-200 font-mono">#{runDetails.id}</span>
              </p>
            </div>
          </div>

          {/* Aggregate Info Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Status */}
            <div className="glass-panel p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Outcome</span>
                <div className={`text-lg font-extrabold flex items-center space-x-1.5 ${
                  runDetails.status === 'success' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {runDetails.status === 'success' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>PASSED</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      <span>FAILED</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Test Case */}
            <div className="glass-panel p-5 flex flex-col justify-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Scenario</span>
              <div className="text-sm font-bold text-slate-200 truncate mt-1">{runDetails.case_name}</div>
              <span className="text-[10px] text-slate-500 mt-0.5">{runDetails.suite_name}</span>
            </div>

            {/* Duration */}
            <div className="glass-panel p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Duration</span>
                <div className="text-lg font-extrabold text-amber-400 flex items-center space-x-1.5 font-mono">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>{(runDetails.duration / 1000).toFixed(2)}s</span>
                </div>
              </div>
            </div>

            {/* Time stamp */}
            <div className="glass-panel p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Date & Time</span>
                <div className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>{new Date(runDetails.started_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Traceback/Error Message panel if failed */}
          {runDetails.status === 'failed' && runDetails.error_message && (
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/15 space-y-2">
              <div className="text-xs font-bold text-red-400 uppercase tracking-wider">Failure Exception Traceback</div>
              <pre className="text-[10px] text-red-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed select-text p-2 bg-black/40 rounded border border-red-950/40">
                {runDetails.error_message}
              </pre>
            </div>
          )}

          {/* Step Sequence Table */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="font-bold text-base text-slate-200">Execution Steps Log</h3>
            
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/20">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Step Name</th>
                    <th className="py-3 px-4 w-28">Type</th>
                    <th className="py-3 px-4 w-24">Outcome</th>
                    <th className="py-3 px-4 w-24 text-right">Duration</th>
                    <th className="py-3 px-4 w-20 text-center">Snapshot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {runSteps.map((step, idx) => (
                    <tr key={step.id} className="hover:bg-slate-900/10">
                      <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        <div className="space-y-1">
                          <div>{step.name}</div>
                          {step.error && (
                            <div className="text-[10px] text-red-400 font-mono leading-relaxed select-text max-w-lg">
                              Error: {step.error}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 uppercase text-[10px]">
                        {step.type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          step.status === 'success'
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                            : step.status === 'failed'
                            ? 'bg-red-500/5 border-red-500/20 text-red-400'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                          {step.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {step.status === 'success' ? `${step.duration}ms` : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {step.screenshot_path ? (
                          <button
                            onClick={() => setModalScreenshot(step.screenshot_path || null)}
                            className="p-1 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition"
                            title="View Snapshot"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-600 font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* 2. Run History Table list view */
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
              Run History logs
            </h1>
            <p className="text-slate-400 mt-1">Audit log of all test case executions and automated visual results.</p>
          </div>

          <div className="glass-panel p-5 overflow-hidden">
            {runs.length === 0 ? (
              <div className="text-center py-20 text-slate-500 space-y-3">
                <Play className="w-12 h-12 mx-auto opacity-10 text-indigo-400" />
                <p className="text-sm">No test execution records found. Start executing test cases from the Suites tab!</p>
              </div>
            ) : (
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/20">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="py-3.5 px-4 text-center w-16">Run ID</th>
                      <th className="py-3.5 px-4">Scenario Case</th>
                      <th className="py-3.5 px-4">Test Suite</th>
                      <th className="py-3.5 px-4 w-28">Outcome</th>
                      <th className="py-3.5 px-4 w-28 text-right">Duration</th>
                      <th className="py-3.5 px-4 w-48">Execution Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {runs.map((run) => (
                      <tr
                        key={run.id}
                        onClick={() => setSelectedRunId(run.id)}
                        className="hover:bg-slate-900/20 cursor-pointer group"
                      >
                        <td className="py-3 px-4 text-center font-mono text-indigo-400 font-semibold group-hover:underline">
                          #{run.id}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-200 group-hover:text-white">
                          {run.case_name}
                        </td>
                        <td className="py-3 px-4 text-slate-400">{run.suite_name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            run.status === 'success'
                              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/5 border-red-500/20 text-red-400'
                          }`}>
                            {run.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300">
                          {(run.duration / 1000).toFixed(2)}s
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(run.started_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Image Full View Modal Dialog */}
      {modalScreenshot && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setModalScreenshot(null)}
        >
          <div className="relative max-w-5xl max-h-full flex flex-col items-center">
            <img
              src={modalScreenshot}
              alt="Test run step screenshot buffer full view"
              className="max-h-[85vh] max-w-full rounded border border-slate-800 shadow-2xl object-contain bg-slate-950/40"
            />
            <div className="text-xs text-slate-400 mt-3 font-semibold bg-slate-900/60 py-1 px-3 rounded-full border border-slate-800/80">
              Click anywhere outside or inside image to dismiss buffer.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
