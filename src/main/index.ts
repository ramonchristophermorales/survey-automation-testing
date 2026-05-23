import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import * as db from './db'
import { runTestCase, RunnerConfig } from './runner'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Set up IPC communication channels
function setupIpc(): void {
  // --- SUITE CRUD ---
  ipcMain.handle('db:get-suites', async () => {
    return await db.getSuites()
  })

  ipcMain.handle('db:create-suite', async (_, { name, description }) => {
    return await db.createSuite(name, description)
  })

  ipcMain.handle('db:delete-suite', async (_, { id }) => {
    return await db.deleteSuite(id)
  })

  // --- TEST CASE CRUD ---
  ipcMain.handle('db:get-cases', async (_, { suiteId }) => {
    return await db.getCases(suiteId)
  })

  ipcMain.handle('db:get-case', async (_, { id }) => {
    return await db.getCaseById(id)
  })

  ipcMain.handle('db:save-case', async (_, { id, suiteId, name, description, url, steps }) => {
    return await db.saveCase(id, suiteId, name, description, url, steps)
  })

  ipcMain.handle('db:delete-case', async (_, { id }) => {
    return await db.deleteCase(id)
  })

  // --- RUN CRUD ---
  ipcMain.handle('db:get-runs', async (_, { caseId } = {}) => {
    return await db.getRuns(caseId)
  })

  ipcMain.handle('db:get-run-details', async (_, { runId }) => {
    return await db.getRunDetails(runId)
  })

  // --- PLAYWRIGHT RUNNER ---
  ipcMain.handle('runner:run-test', async (_, { caseId, name, url, steps, config }) => {
    if (!mainWindow) throw new Error('Main window not available')
    
    // Config defaults
    const runnerConfig: RunnerConfig = {
      headless: config.headless ?? true,
      viewportWidth: config.viewportWidth ?? 1280,
      viewportHeight: config.viewportHeight ?? 720,
      defaultTimeout: config.defaultTimeout ?? 15000
    }

    // Run async, don't block the IPC response since it streams progress updates
    runTestCase(mainWindow, caseId, name, url, steps, runnerConfig).catch((err) => {
      console.error('Error running test case:', err)
    })

    return { status: 'triggered' }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 1. Initialize DB
  try {
    await db.initDb()
    console.log('Database initialized successfully')
  } catch (err) {
    console.error('Failed to initialize database:', err)
  }

  // 2. Setup IPC
  setupIpc()

  // 3. Create browser window
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
