import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Expose safe, structured APIs to the React renderer
const api = {
  // DB Suite APIs
  getSuites: () => ipcRenderer.invoke('db:get-suites'),
  createSuite: (name: string, description?: string) => 
    ipcRenderer.invoke('db:create-suite', { name, description }),
  deleteSuite: (id: number) => ipcRenderer.invoke('db:delete-suite', { id }),

  // DB Case APIs
  getCases: (suiteId: number) => ipcRenderer.invoke('db:get-cases', { suiteId }),
  getCase: (id: number) => ipcRenderer.invoke('db:get-case', { id }),
  saveCase: (id: number | null, suiteId: number, name: string, description: string, url: string, steps: string) => 
    ipcRenderer.invoke('db:save-case', { id, suiteId, name, description, url, steps }),
  deleteCase: (id: number) => ipcRenderer.invoke('db:delete-case', { id }),

  // DB Run APIs
  getRuns: (caseId?: number) => ipcRenderer.invoke('db:get-runs', { caseId }),
  getRunDetails: (runId: number) => ipcRenderer.invoke('db:get-run-details', { runId }),

  // Playwright Runner
  runTest: (caseId: number, name: string, url: string, steps: string, config: any) => 
    ipcRenderer.invoke('runner:run-test', { caseId, name, url, steps, config }),

  // Runner Event Streaming
  onRunStarted: (callback: (data: any) => void) => {
    ipcRenderer.on('test-run-started', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('test-run-started')
  },
  onStepStarted: (callback: (data: any) => void) => {
    ipcRenderer.on('test-step-started', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('test-step-started')
  },
  onStepFinished: (callback: (data: any) => void) => {
    ipcRenderer.on('test-step-finished', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('test-step-finished')
  },
  onRunCompleted: (callback: (data: any) => void) => {
    ipcRenderer.on('test-run-completed', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('test-run-completed')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
