import { chromium, Page, Browser, BrowserContext } from 'playwright'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { createRun, updateRun, addRunStep } from './db'

export interface VisualStep {
  type: 'navigate' | 'click' | 'type' | 'wait' | 'assert_text' | 'assert_visible' | 'screenshot'
  name: string
  selector?: string
  value?: string
  timeout?: number
}

export interface RunnerConfig {
  headless: boolean
  viewportWidth: number
  viewportHeight: number
  defaultTimeout: number
}

export async function runTestCase(
  window: BrowserWindow,
  caseId: number,
  caseName: string,
  startUrl: string,
  stepsJson: string,
  config: RunnerConfig
): Promise<void> {
  const steps: VisualStep[] = JSON.parse(stepsJson)
  
  // 1. Create a Test Run in DB
  const runId = await createRun(caseId)
  
  // Notify frontend of run started
  window.webContents.send('test-run-started', { runId, caseId, caseName })

  const screenshotsDir = join(app.getPath('userData'), 'screenshots')
  if (!existsSync(screenshotsDir)) {
    mkdirSync(screenshotsDir, { recursive: true })
  }

  let browser: Browser | null = null
  let context: BrowserContext | null = null
  let page: Page | null = null
  
  const startTime = Date.now()
  let currentStepIndex = 0
  let runStatus: 'success' | 'failed' = 'success'
  let runErrorMessage = ''
  let runScreenshotPath = ''

  try {
    // 2. Launch Playwright Chromium
    browser = await chromium.launch({
      headless: config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    context = await browser.newContext({
      viewport: {
        width: config.viewportWidth || 1280,
        height: config.viewportHeight || 720
      }
    })

    page = await context.newPage()
    page.setDefaultTimeout(config.defaultTimeout || 30000)

    // Execute steps sequentially
    for (let i = 0; i < steps.length; i++) {
      currentStepIndex = i
      const step = steps[i]
      const stepStartTime = Date.now()
      
      // Notify frontend step started
      window.webContents.send('test-step-started', {
        runId,
        stepIndex: i,
        name: step.name,
        type: step.type
      })

      let stepStatus: 'success' | 'failed' = 'success'
      let stepError = ''
      let stepScreenshotBase64 = ''

      try {
        switch (step.type) {
          case 'navigate': {
            const url = step.value || startUrl
            await page.goto(url, { waitUntil: 'load' })
            break
          }
          case 'click': {
            if (!step.selector) throw new Error('Click selector is required')
            await page.click(step.selector)
            break
          }
          case 'type': {
            if (!step.selector) throw new Error('Type selector is required')
            await page.fill(step.selector, step.value || '')
            break
          }
          case 'wait': {
            if (step.selector) {
              await page.waitForSelector(step.selector, { state: 'visible', timeout: step.timeout })
            } else if (step.value) {
              const ms = parseInt(step.value, 10)
              if (!isNaN(ms)) {
                await page.waitForTimeout(ms)
              }
            } else {
              await page.waitForTimeout(1000)
            }
            break
          }
          case 'assert_text': {
            if (!step.selector) throw new Error('Assertion selector is required')
            await page.waitForSelector(step.selector, { state: 'visible' })
            const text = await page.textContent(step.selector)
            const expected = step.value || ''
            if (!text || !text.includes(expected)) {
              throw new Error(`Text assertion failed. Expected '${expected}' to be in '${text}'`)
            }
            break
          }
          case 'assert_visible': {
            if (!step.selector) throw new Error('Assertion selector is required')
            await page.waitForSelector(step.selector, { state: 'visible' })
            const visible = await page.isVisible(step.selector)
            if (!visible) {
              throw new Error(`Element ${step.selector} is not visible`)
            }
            break
          }
          case 'screenshot': {
            const scName = `run_${runId}_step_${i}_${Date.now()}.png`
            const scPath = join(screenshotsDir, scName)
            const buffer = await page.screenshot()
            writeFileSync(scPath, buffer)
            stepScreenshotBase64 = buffer.toString('base64')
            break
          }
          default:
            throw new Error(`Unknown step type: ${step.type}`)
        }
      } catch (err: any) {
        stepStatus = 'failed'
        stepError = err.message || String(err)
        
        // Take a screenshot of the failure if page is available
        if (page) {
          try {
            const scName = `run_${runId}_fail_${Date.now()}.png`
            const scPath = join(screenshotsDir, scName)
            const buffer = await page.screenshot()
            writeFileSync(scPath, buffer)
            stepScreenshotBase64 = buffer.toString('base64')
            // Set this as the main failure screenshot
            runScreenshotPath = scPath
          } catch (scErr) {
            console.error('Failed to capture failure screenshot:', scErr)
          }
        }
        
        throw err // rethrow to stop execution
      } finally {
        const stepDuration = Date.now() - stepStartTime
        
        // Save step to DB
        await addRunStep(
          runId,
          i,
          step.name,
          step.type,
          stepStatus,
          stepDuration,
          stepError,
          stepScreenshotBase64 ? `data:image/png;base64,${stepScreenshotBase64}` : undefined
        )

        // Notify frontend step finished
        window.webContents.send('test-step-finished', {
          runId,
          stepIndex: i,
          status: stepStatus,
          duration: stepDuration,
          error: stepError,
          screenshot: stepScreenshotBase64 ? `data:image/png;base64,${stepScreenshotBase64}` : undefined
        })
      }
    }
  } catch (err: any) {
    runStatus = 'failed'
    runErrorMessage = err.message || String(err)
  } finally {
    // Clean up browser
    if (browser) {
      await browser.close()
    }
    
    const runDuration = Date.now() - startTime

    // Update remaining unexecuted steps in DB as failed if we failed early
    if (runStatus === 'failed' && currentStepIndex < steps.length - 1) {
      for (let i = currentStepIndex + 1; i < steps.length; i++) {
        await addRunStep(runId, i, steps[i].name, steps[i].type, 'failed', 0, 'Skipped due to previous step failure')
        window.webContents.send('test-step-finished', {
          runId,
          stepIndex: i,
          status: 'failed',
          duration: 0,
          error: 'Skipped due to previous step failure'
        })
      }
    }

    // Save final run results
    await updateRun(
      runId,
      runStatus,
      runDuration,
      runErrorMessage || undefined,
      runScreenshotPath || undefined
    )

    // Notify frontend of run completed
    window.webContents.send('test-run-completed', {
      runId,
      status: runStatus,
      duration: runDuration,
      error: runErrorMessage,
      screenshot: runScreenshotPath
    })
  }
}
