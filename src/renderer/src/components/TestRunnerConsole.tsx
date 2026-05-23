import React, { useEffect, useState, useRef } from 'react'
import { Play, Loader, CheckCircle2, XCircle, Eye, EyeOff, Layout, Terminal } from 'lucide-react'

interface VisualStep {
  type: 'navigate' | 'click' | 'type' | 'wait' | 'assert_text' | 'assert_visible' | 'screenshot'
  name: string
  selector?: string
  value?: string
  timeout?: number
}

interface StepProgress extends VisualStep {
  status: 'pending' | 'running' | 'success' | 'failed'
  duration: number
  error?: string
  screenshot?: string
}

interface TestRunnerConsoleProps {
  caseId: number
}

export default function TestRunnerConsole({ caseId }: TestRunnerConsoleProps): React.JSX.Element {
  const [caseData, setCaseData] = useState<any | null>(null)
  const [steps, setSteps] = useState<StepProgress[]>([])
  const [running, setRunning] = useState(false)
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle')
  
  // Settings Configs
  const [headless, setHeadless] = useState(true)
  const [timeout, setTimeoutVal] = useState(15000)
  const [viewport, setViewport] = useState('1280x720')

  // Execution Stats
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentRunId, setCurrentRunId] = useState<number | null>(null)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const logEndRef = useRef<HTMLDivElement | null>(null)

  // Load Case
  useEffect(() => {
    async function fetchCase(): Promise<void> {
      try {
        const data = await window.api.getCase(caseId)
        if (data) {
          setCaseData(data)
          const parsedSteps = JSON.parse(data.steps)
          setSteps(
            parsedSteps.map((step: VisualStep) => ({
              ...step,
              status: 'pending',
              duration: 0
            }))
          )
        }
      } catch (err) {
        console.error('Failed to load test case details:', err)
      }
    }
    fetchCase()
  }, [caseId])

  // Scroll to bottom of log panel
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [consoleLogs])

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Hook up Preload Event Listeners
  useEffect(() => {
    const unsubStarted = window.api.onRunStarted((data) => {
      setCurrentRunId(data.runId)
      addLog(`[SYSTEM] Starting execution of test run #${data.runId}...`)
    })

    const unsubStepStarted = window.api.onStepStarted((data) => {
      setSteps((prev) => {
        const updated = [...prev]
        if (updated[data.stepIndex]) {
          updated[data.stepIndex].status = 'running'
        }
        return updated
      })
      addLog(`[RUNNING] Step ${data.stepIndex + 1}: ${data.name}...`)
    })

    const unsubStepFinished = window.api.onStepFinished((data) => {
      setSteps((prev) => {
        const updated = [...prev]
        if (updated[data.stepIndex]) {
          updated[data.stepIndex].status = data.status
          updated[data.stepIndex].duration = data.duration
          updated[data.stepIndex].error = data.error
          updated[data.stepIndex].screenshot = data.screenshot
          
          if (data.screenshot) {
            setSelectedScreenshot(data.screenshot)
          }
        }
        return updated
      })

      if (data.status === 'success') {
        addLog(`[SUCCESS] Step ${data.stepIndex + 1} completed in ${data.duration}ms.`)
      } else {
        addLog(`[FAILED] Step ${data.stepIndex + 1} failed: ${data.error}`)
      }
    })

    const unsubCompleted = window.api.onRunCompleted((data) => {
      setRunning(false)
      setRunStatus(data.status)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      
      addLog(
        `[SYSTEM] Test execution completed. Overall status: ${data.status.toUpperCase()} in ${(data.duration / 1000).toFixed(2)}s.`
      )
      if (data.error) {
        addLog(`[ERROR] Traceback: ${data.error}`)
      }
    })

    return () => {
      unsubStarted()
      unsubStepStarted()
      unsubStepFinished()
      unsubCompleted()
    }
  }, [])

  function addLog(message: string): void {
    const time = new Date().toLocaleTimeString()
    setConsoleLogs((prev) => [...prev, `[${time}] ${message}`])
  }

  // Trigger Execution
  async function handleStartRun(): Promise<void> {
    if (running || !caseData) return

    // Reset States
    setRunning(true)
    setRunStatus('running')
    setElapsedTime(0)
    setConsoleLogs([])
    setSelectedScreenshot(null)
    setSteps((prev) =>
      prev.map((step) => ({
        ...step,
        status: 'pending',
        duration: 0,
        error: undefined,
        screenshot: undefined
      }))
    )

    // Start timer
    const start = Date.now()
    timerRef.current = setInterval(() => {
      setElapsedTime(Date.now() - start)
    }, 100)

    addLog(`[SYSTEM] Initializing browser engine...`)
    
    // Parse Viewport
    const [width, height] = viewport.split('x').map((v) => parseInt(v, 10))

    try {
      await window.api.runTest(
        caseData.id,
        caseData.name,
        caseData.url,
        caseData.steps,
        {
          headless,
          viewportWidth: width,
          viewportHeight: height,
          defaultTimeout: timeout
        }
      )
    } catch (err) {
      console.error('Failed to trigger test runner IPC:', err)
      setRunning(false)
      setRunStatus('failed')
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      addLog(`[FATAL ERROR] Failed to bootstrap test runner: ${err}`)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Live Test Runner</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Target Case: <span className="text-indigo-400 font-semibold">{caseData?.name}</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-500 font-mono">
            Execution Duration: <span className="text-slate-300 font-semibold">{(elapsedTime / 1000).toFixed(1)}s</span>
          </span>
          {runStatus === 'success' && (
            <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              Passed
            </span>
          )}
          {runStatus === 'failed' && (
            <span className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 text-xs font-semibold uppercase tracking-wider">
              Failed
            </span>
          )}
        </div>
      </div>

      {/* Grid: Controls, Timeline, Visual Screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Left column: Run settings and steps list */}
        <div className="md:col-span-3 space-y-6">
          {/* Settings Console Panel */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">Runner Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Headless check */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-850">
                <span className="text-xs text-slate-400 font-semibold flex items-center space-x-1.5">
                  {headless ? <EyeOff className="w-4 h-4 text-indigo-400" /> : <Eye className="w-4 h-4 text-emerald-400" />}
                  <span>Headed Mode</span>
                </span>
                <input
                  type="checkbox"
                  checked={!headless}
                  onChange={(e) => setHeadless(!e.target.checked)}
                  disabled={running}
                  className="w-4 h-4 text-indigo-600 border-slate-700 bg-slate-900 rounded focus:ring-indigo-500"
                />
              </div>

              {/* Viewport Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">Viewport Dimensions</label>
                <select
                  value={viewport}
                  onChange={(e) => setViewport(e.target.value)}
                  disabled={running}
                  className="w-full px-2.5 py-1.5 text-xs glass-input"
                >
                  <option value="1280x720">Standard HD (1280x720)</option>
                  <option value="1920x1080">Full HD (1920x1080)</option>
                  <option value="375x812">Mobile iPhone X (375x812)</option>
                </select>
              </div>

              {/* Action Timeout */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">Timeout Limit (ms)</label>
                <input
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeoutVal(parseInt(e.target.value, 10))}
                  disabled={running}
                  className="w-full px-2.5 py-1.5 text-xs glass-input font-mono"
                />
              </div>
            </div>

            {/* Run Buttons */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleStartRun}
                disabled={running}
                className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center space-x-2 shadow-md shadow-indigo-600/15 disabled:opacity-50 transition active:scale-95"
              >
                {running ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Execute Playwright Test</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Steps Timeline Tree */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">Execution Flow Pipeline</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {/* Base step: navigation */}
              <div className="p-3 rounded bg-slate-950/20 border border-slate-900/60 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-800 text-[10px] text-slate-400 font-mono">
                    1
                  </span>
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-300">Open base URL</span>
                    <span className="text-[10px] text-slate-500 block font-mono">{caseData?.url}</span>
                  </div>
                </div>
                {running && runStatus === 'running' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-slate-600" />
                )}
              </div>

              {/* Dynamic steps loop */}
              {steps.map((step, idx) => {
                const stepNum = idx + 2
                return (
                  <div
                    key={idx}
                    onClick={() => step.screenshot && setSelectedScreenshot(step.screenshot)}
                    className={`p-3 rounded border flex items-center justify-between transition ${
                      step.screenshot ? 'cursor-pointer hover:bg-slate-900/30' : ''
                    } ${
                      step.status === 'running'
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : step.status === 'success'
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : step.status === 'failed'
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-slate-950/20 border-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-800 text-[10px] text-slate-400 font-mono">
                        {stepNum}
                      </span>
                      <div className="space-y-0.5 truncate max-w-sm">
                        <span className={`text-xs font-semibold ${
                          step.status === 'running' ? 'text-amber-400' : step.status === 'success' ? 'text-emerald-400' : step.status === 'failed' ? 'text-red-400' : 'text-slate-300'
                        }`}>
                          {step.name}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate font-mono">
                          {step.type.replace('_', ' ').toUpperCase()} {step.selector ? ` | selector: ${step.selector}` : ''} {step.value ? ` | value: ${step.value}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 flex-shrink-0">
                      {step.status === 'success' && (
                        <span className="text-[10px] text-slate-500 font-mono">{step.duration}ms</span>
                      )}
                      
                      {step.status === 'pending' && <div className="w-4 h-4 rounded-full border border-slate-800" />}
                      {step.status === 'running' && <Loader className="w-4 h-4 animate-spin text-amber-400" />}
                      {step.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {step.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right column: Screenshot preview & logs */}
        <div className="md:col-span-2 space-y-6 flex flex-col justify-between h-[calc(100vh-18rem)] md:sticky md:top-24">
          {/* Screenshot Display Box */}
          <div className="glass-panel p-5 flex flex-col items-center justify-center flex-1 min-h-[16rem] relative overflow-hidden group">
            <span className="text-xs font-semibold text-slate-400 absolute top-4 left-5 flex items-center space-x-1.5">
              <Layout className="w-4 h-4 text-indigo-400" />
              <span>Snapshot Buffer</span>
            </span>

            {selectedScreenshot ? (
              <img
                src={selectedScreenshot}
                alt="Test step screenshot buffer"
                className="max-h-[14rem] max-w-full rounded border border-slate-800 shadow-lg object-contain group-hover:scale-[1.02] transition-transform duration-300 mt-4"
              />
            ) : (
              <div className="text-center text-xs text-slate-600 flex flex-col items-center space-y-2 mt-4">
                <Layout className="w-10 h-10 opacity-10" />
                <span>Screenshot buffers captured in steps or on error will render here in real-time.</span>
              </div>
            )}
          </div>

          {/* Console Output Log */}
          <div className="glass-panel p-4 flex flex-col h-48 overflow-hidden font-mono text-[10px] text-slate-400">
            <span className="font-semibold text-slate-400 flex items-center space-x-1.5 border-b border-slate-800 pb-2 mb-2 flex-shrink-0">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Diagnostic CLI Output Log {currentRunId ? `#${currentRunId}` : ''}</span>
            </span>
            <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin select-text">
              {consoleLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed whitespace-pre-wrap break-all">
                  {log.startsWith(`[${log.substring(1, 9)}] [SUCCESS`) ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : log.startsWith(`[${log.substring(1, 9)}] [FAILED`) || log.startsWith(`[${log.substring(1, 9)}] [ERROR`) || log.startsWith(`[${log.substring(1, 9)}] [FATAL`) ? (
                    <span className="text-red-400">{log}</span>
                  ) : log.startsWith(`[${log.substring(1, 9)}] [RUNNING`) ? (
                    <span className="text-amber-400">{log}</span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
