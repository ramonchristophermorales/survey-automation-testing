import sqlite3 from 'sqlite3'
import { join } from 'path'
import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'

let db: sqlite3.Database

export interface TestSuite {
  id?: number
  name: string
  description?: string
  created_at?: string
}

export interface TestCase {
  id?: number
  suite_id: number
  name: string
  description?: string
  url: string
  steps: string // JSON string
  created_at?: string
}

export interface TestRun {
  id?: number
  test_case_id: number
  status: 'running' | 'success' | 'failed'
  duration: number
  started_at?: string
  error_message?: string
  screenshot_path?: string
  case_name?: string
  suite_name?: string
}

export interface TestRunStep {
  id?: number
  test_run_id: number
  step_index: number
  name: string
  type: string
  status: 'pending' | 'running' | 'success' | 'failed'
  duration: number
  error?: string
  screenshot_path?: string
}

export function initDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Get path to database file in AppData
    const userDataPath = app.getPath('userData')
    const dbDir = join(userDataPath, 'database')
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true })
    }
    const dbPath = join(dbDir, 'playwright_studio.sqlite')
    console.log('Initializing SQLite database at:', dbPath)

    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Failed to connect to SQLite database:', err)
        reject(err)
        return
      }

      db.run('PRAGMA foreign_keys = ON', (pragmaErr) => {
        if (pragmaErr) {
          console.error('Failed to enable foreign keys:', pragmaErr)
        }

        createTables()
          .then(resolve)
          .catch(reject)
      })
    })
  })
}

function createTables(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Suites Table
      db.run(
        `CREATE TABLE IF NOT EXISTS suites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        (err) => {
          if (err) return reject(err)
        }
      )

      // 2. Test Cases Table
      db.run(
        `CREATE TABLE IF NOT EXISTS test_cases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          suite_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          url TEXT NOT NULL,
          steps TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (suite_id) REFERENCES suites (id) ON DELETE CASCADE
        )`,
        (err) => {
          if (err) return reject(err)
        }
      )

      // 3. Test Runs Table
      db.run(
        `CREATE TABLE IF NOT EXISTS test_runs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          test_case_id INTEGER NOT NULL,
          status TEXT NOT NULL,
          duration INTEGER DEFAULT 0,
          started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          error_message TEXT,
          screenshot_path TEXT,
          FOREIGN KEY (test_case_id) REFERENCES test_cases (id) ON DELETE CASCADE
        )`,
        (err) => {
          if (err) return reject(err)
        }
      )

      // 4. Test Run Steps Table
      db.run(
        `CREATE TABLE IF NOT EXISTS test_run_steps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          test_run_id INTEGER NOT NULL,
          step_index INTEGER NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL,
          duration INTEGER DEFAULT 0,
          error TEXT,
          screenshot_path TEXT,
          FOREIGN KEY (test_run_id) REFERENCES test_runs (id) ON DELETE CASCADE
        )`,
        (err) => {
          if (err) return reject(err)
          resolve() // successfully initialized everything
        }
      )
    })
  })
}

// ==========================================
// Database Queries and CRUD Operations
// ==========================================

// --- SUITES ---
export function getSuites(): Promise<TestSuite[]> {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM suites ORDER BY id DESC', (err, rows) => {
      if (err) reject(err)
      else resolve(rows as TestSuite[])
    })
  })
}

export function createSuite(name: string, description?: string): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO suites (name, description) VALUES (?, ?)',
      [name, description],
      function (err) {
        if (err) reject(err)
        else resolve(this.lastID)
      }
    )
  })
}

export function deleteSuite(id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM suites WHERE id = ?', [id], (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

// --- TEST CASES ---
export function getCases(suiteId: number): Promise<TestCase[]> {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM test_cases WHERE suite_id = ? ORDER BY id DESC',
      [suiteId],
      (err, rows) => {
        if (err) reject(err)
        else resolve(rows as TestCase[])
      }
    )
  })
}

export function getCaseById(id: number): Promise<TestCase | null> {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM test_cases WHERE id = ?', [id], (err, row) => {
      if (err) reject(err)
      else resolve((row as TestCase) || null)
    })
  })
}

export function saveCase(
  id: number | null,
  suiteId: number,
  name: string,
  description: string,
  url: string,
  steps: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    if (id) {
      db.run(
        'UPDATE test_cases SET name = ?, description = ?, url = ?, steps = ? WHERE id = ?',
        [name, description, url, steps, id],
        (err) => {
          if (err) reject(err)
          else resolve(id)
        }
      )
    } else {
      db.run(
        'INSERT INTO test_cases (suite_id, name, description, url, steps) VALUES (?, ?, ?, ?, ?)',
        [suiteId, name, description, url, steps],
        function (err) {
          if (err) reject(err)
          else resolve(this.lastID)
        }
      )
    }
  })
}

export function deleteCase(id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM test_cases WHERE id = ?', [id], (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

// --- TEST RUNS ---
export function createRun(testCaseId: number): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO test_runs (test_case_id, status, duration) VALUES (?, 'running', 0)",
      [testCaseId],
      function (err) {
        if (err) reject(err)
        else resolve(this.lastID)
      }
    )
  })
}

export function updateRun(
  id: number,
  status: 'success' | 'failed',
  duration: number,
  errorMessage?: string,
  screenshotPath?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE test_runs SET status = ?, duration = ?, error_message = ?, screenshot_path = ? WHERE id = ?',
      [status, duration, errorMessage, screenshotPath, id],
      (err) => {
        if (err) reject(err)
        else resolve()
      }
    )
  })
}

export function addRunStep(
  runId: number,
  stepIndex: number,
  name: string,
  type: string,
  status: 'pending' | 'running' | 'success' | 'failed',
  duration: number,
  error?: string,
  screenshotPath?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO test_run_steps (test_run_id, step_index, name, type, status, duration, error, screenshot_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [runId, stepIndex, name, type, status, duration, error, screenshotPath],
      (err) => {
        if (err) reject(err)
        else resolve()
      }
    )
  })
}

export function getRuns(caseId?: number): Promise<TestRun[]> {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT tr.*, tc.name as case_name, s.name as suite_name
      FROM test_runs tr
      JOIN test_cases tc ON tr.test_case_id = tc.id
      JOIN suites s ON tc.suite_id = s.id
    `
    const params: any[] = []

    if (caseId) {
      query += ' WHERE tr.test_case_id = ?'
      params.push(caseId)
    }

    query += ' ORDER BY tr.id DESC'

    db.all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows as TestRun[])
    })
  })
}

export function getRunDetails(runId: number): Promise<{ run: TestRun; steps: TestRunStep[] }> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT tr.*, tc.name as case_name, s.name as suite_name
       FROM test_runs tr
       JOIN test_cases tc ON tr.test_case_id = tc.id
       JOIN suites s ON tc.suite_id = s.id
       WHERE tr.id = ?`,
      [runId],
      (err, runRow) => {
        if (err) return reject(err)
        if (!runRow) return reject(new Error('Test run not found'))

        db.all(
          'SELECT * FROM test_run_steps WHERE test_run_id = ? ORDER BY step_index ASC',
          [runId],
          (errSteps, stepRows) => {
            if (errSteps) return reject(errSteps)
            resolve({
              run: runRow as TestRun,
              steps: stepRows as TestRunStep[]
            })
          }
        )
      }
    )
  })
}
