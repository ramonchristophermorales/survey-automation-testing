import React, { useEffect, useState } from 'react'
import { Play, CheckCircle2, XCircle, Clock, Zap, FileText } from 'lucide-react'

interface TestRun {
  id: number
  test_case_id: number
  status: 'running' | 'success' | 'failed'
  duration: number
  started_at: string
  case_name: string
  suite_name: string
}

interface DashboardProps {
  onNavigate: (tab: string, arg?: any) => void
}

export default function Dashboard({ onNavigate }: DashboardProps): React.JSX.Element {
  const [runs, setRuns] = useState<TestRun[]>([])
  const [stats, setStats] = useState({
    totalSuites: 0,
    totalCases: 0,
    totalRuns: 0,
    passRate: 0,
    avgDuration: 0
  })

  useEffect(() => {
    async function loadData(): Promise<void> {
      try {
        const suites = await window.api.getSuites()
        
        let casesCount = 0
        for (const suite of suites) {
          if (suite.id) {
            const cases = await window.api.getCases(suite.id)
            casesCount += cases.length
          }
        }

        const allRuns = await window.api.getRuns()
        const recentRuns = allRuns.slice(0, 5)

        const totalRuns = allRuns.length
        const successfulRuns = allRuns.filter(r => r.status === 'success').length
        const passRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0
        
        const totalDuration = allRuns.reduce((sum, r) => sum + r.duration, 0)
        const avgDuration = totalRuns > 0 ? Math.round(totalDuration / totalRuns) : 0

        setRuns(recentRuns)
        setStats({
          totalSuites: suites.length,
          totalCases: casesCount,
          totalRuns,
          passRate,
          avgDuration
        })
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err)
      }
    }
    loadData()
  }, [])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
          Executive Dashboard
        </h1>
        <p className="text-slate-400 mt-1">
          Real-time insights and execution statistics for your automated test suites.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Pass Rate */}
        <div className="glass-card p-6 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-400">Pass Rate</span>
            <div className="text-3xl font-extrabold text-emerald-400">{stats.passRate}%</div>
            <span className="text-xs text-slate-500">Across all runs</span>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* SVG circular progress */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                className="stroke-slate-800"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                className="stroke-emerald-500 transition-all duration-1000 ease-out"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - stats.passRate / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <CheckCircle2 className="absolute text-emerald-500/80 w-6 h-6" />
          </div>
        </div>

        {/* Total Runs */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-400">Total Runs</span>
            <div className="text-3xl font-extrabold text-indigo-400">{stats.totalRuns}</div>
            <span className="text-xs text-slate-500">Executions in history</span>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Play className="w-6 h-6 fill-indigo-400/20" />
          </div>
        </div>

        {/* Avg Duration */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-400">Avg Duration</span>
            <div className="text-3xl font-extrabold text-amber-400">
              {(stats.avgDuration / 1000).toFixed(2)}s
            </div>
            <span className="text-xs text-slate-500">Average speed per test</span>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Suites & Cases */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-400">Test Inventory</span>
            <div className="text-3xl font-extrabold text-sky-400">{stats.totalCases}</div>
            <span className="text-xs text-slate-500">Cases in {stats.totalSuites} Suites</span>
          </div>
          <div className="p-3 bg-sky-500/10 rounded-lg text-sky-400">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Charts and Recent Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Execution Health Graph */}
        <div className="lg:col-span-2 glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-200">
              <Zap className="w-5 h-5 text-indigo-400" />
              <h2 className="font-semibold text-lg">Execution Speed Trend</h2>
            </div>
            <span className="text-xs text-slate-500">Last 5 runs</span>
          </div>
          
          <div className="h-60 flex items-end justify-between relative pt-8 px-4 border-b border-l border-slate-800">
            {runs.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                No recent run metrics available
              </div>
            ) : (
              <>
                {/* Horizontal gridlines */}
                <div className="absolute left-0 right-0 top-1/4 border-t border-slate-800/40 pointer-events-none" />
                <div className="absolute left-0 right-0 top-2/4 border-t border-slate-800/40 pointer-events-none" />
                <div className="absolute left-0 right-0 top-3/4 border-t border-slate-800/40 pointer-events-none" />

                {runs.slice().reverse().map((run) => {
                  const maxDur = Math.max(...runs.map(r => r.duration), 2000)
                  const heightPct = Math.max(15, Math.round((run.duration / maxDur) * 100))
                  return (
                    <div key={run.id} className="flex flex-col items-center flex-1 group z-10">
                      {/* Hover Tooltip */}
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute mb-2 bg-slate-950 text-slate-200 text-xs py-1 px-2 rounded border border-slate-800 -translate-y-12">
                        {(run.duration / 1000).toFixed(2)}s ({run.status})
                      </span>
                      {/* Bar */}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-12 rounded-t-md transition-all duration-500 ${
                          run.status === 'success'
                            ? 'bg-gradient-to-t from-emerald-600/40 to-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                            : 'bg-gradient-to-t from-red-600/40 to-red-400/80 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                        }`}
                      />
                      <span className="text-[10px] text-slate-500 mt-2 truncate w-16 text-center">
                        Run #{run.id}
                      </span>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>

        {/* Recent Run History List */}
        <div className="glass-panel p-6 space-y-6 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg text-slate-200">Recent Runs</h2>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition"
            >
              View all
            </button>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto">
            {runs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2 py-10">
                <Play className="w-8 h-8 opacity-20" />
                <span className="text-sm">No run executions yet</span>
              </div>
            ) : (
              runs.map((run) => (
                <div
                  key={run.id}
                  onClick={() => onNavigate('history', run.id)}
                  className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-center justify-between hover:border-slate-700 transition cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-slate-200 truncate w-36">
                      {run.case_name}
                    </div>
                    <div className="text-xs text-slate-500">{run.suite_name}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono text-slate-400">
                      {(run.duration / 1000).toFixed(1)}s
                    </span>
                    {run.status === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
