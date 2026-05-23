import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getSuites: () => Promise<any[]>
      createSuite: (name: string, description?: string) => Promise<number>
      deleteSuite: (id: number) => Promise<void>
      getCases: (suiteId: number) => Promise<any[]>
      getCase: (id: number) => Promise<any>
      saveCase: (id: number | null, suiteId: number, name: string, description: string, url: string, steps: string) => Promise<number>
      deleteCase: (id: number) => Promise<void>
      getRuns: (caseId?: number) => Promise<any[]>
      getRunDetails: (runId: number) => Promise<any>
      runTest: (caseId: number, name: string, url: string, steps: string, config: any) => Promise<any>
      onRunStarted: (callback: (data: any) => void) => () => void
      onStepStarted: (callback: (data: any) => void) => () => void
      onStepFinished: (callback: (data: any) => void) => () => void
      onRunCompleted: (callback: (data: any) => void) => () => void
    }
  }
}
