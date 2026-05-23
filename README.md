# Survey Automation Testing

<div align="center">

![Electron](https://img.shields.io/badge/Electron-Desktop_App-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-Type_Safe-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-Automation-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Styling-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

A modern desktop application for creating, managing, and executing automated survey testing workflows powered by Playwright.

Built with **ElectronJS**, **ReactJS**, **TypeScript**, **Shadcn UI**, **TailwindCSS**, and **SQLite**.

[🌐 Portfolio Website](https://ramon.moralesprojects.com/)

</div>

---

# ✨ Features

- 🧪 Create and manage automated survey test suites
- ⚡ Execute Playwright tests directly from desktop UI
- 📊 Real-time execution analytics dashboard
- 🕒 Run history and execution tracking
- 🧩 Dynamic Playwright spec generation
- 🖥️ Headed and headless browser execution modes
- 📸 Snapshot buffer for visual debugging
- 🗂️ SQLite local database integration
- 🎨 Modern UI powered by Shadcn UI + TailwindCSS
- 🔒 Fully offline-capable desktop application

---

# 🖼️ Application Preview

## Dashboard

Displays execution insights, pass rate metrics, execution speed trends, and recent test runs.

```md
![Dashboard](./screenshots/dashboard.png)
```

---

## Test Suites

Manage multiple survey automation suites and execute test cases easily.

```md
![Test Suites](./screenshots/test-suites.png)
```

---

## Test Case Editor

Create automation flows step-by-step with dynamic Playwright spec preview generation.

### Supported Actions

- Navigate
- Click
- Type
- Wait
- Assert Text
- Assert Visible
- Screenshot

```md
![Test Editor](./screenshots/test-editor.png)
```

---

## Live Test Runner

Execute Playwright scripts with real-time execution tracking and diagnostics.

### Runner Features

- Headed / Headless execution
- Adjustable viewport
- Timeout configuration
- Execution flow visualization
- Diagnostic CLI logs
- Snapshot buffer rendering

```md
![Runner](./screenshots/live-runner.png)
```

---

## Run History Logs

Track all executions with duration, status, timestamps, and outcomes.

```md
![Run History](./screenshots/run-history.png)
```

---

# 🏗️ Tech Stack

| Technology | Purpose |
|---|---|
| ElectronJS | Desktop application shell |
| ReactJS | Frontend framework |
| TypeScript | Type safety |
| TailwindCSS | Utility-first styling |
| Shadcn UI | UI components |
| SQLite | Local database storage |
| Playwright | Browser automation engine |

---

# 📂 Project Structure

```bash
survey-automation-testing/
├── electron/
│   ├── main/
│   ├── preload/
│   └── ipc/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── lib/
│   ├── store/
│   └── types/
│
├── database/
│   └── sqlite/
│
├── playwright/
│   ├── generated/
│   └── snapshots/
│
├── screenshots/
│
└── package.json
```

---

# 🚀 Getting Started

## Prerequisites

- Node.js >= 18
- npm / pnpm / yarn
- Playwright browsers installed

---

## Installation

```bash
git clone https://github.com/yourusername/survey-automation-testing.git
```

```bash
cd survey-automation-testing
```

Install dependencies:

```bash
npm install
```

Install Playwright browsers:

```bash
npx playwright install
```

---

# ▶️ Development

Run Electron + React development server:

```bash
npm run dev
```

---

# 📦 Build Application

Build production desktop application:

```bash
npm run build
```

---

# 🧪 Example Generated Playwright Spec

```ts
import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
    await page.setViewportSize({
        width: 1280,
        height: 720
    });

    await page.goto('https://example.com');

    await page.waitForSelector('.submit-button');

    await expect(
        page.locator('.submit-button')
    ).toContainText('Submit');
});
```

---

# 🗃️ Database

The application uses SQLite for:

- Test suite storage
- Test case persistence
- Execution history logs
- Performance analytics
- Snapshot metadata

---

# 🎨 UI Design

The UI is inspired by modern developer tooling interfaces featuring:

- Dark mode dashboard
- Neon-accented interactions
- Responsive grid layouts
- Minimal and clean developer UX
- Diagnostic-focused execution panels

---

# 🔐 Desktop Features

Electron integration enables:

- Local Playwright execution
- Native filesystem access
- Persistent local database storage
- Offline execution support
- Cross-platform builds

---

# 📈 Future Improvements

- Multi-browser execution
- Parallel test execution
- AI-assisted selector generation
- Visual regression testing
- Exportable HTML/PDF reports
- CI/CD integration
- Cloud synchronization
- Scheduled test execution

---

# 🤝 Contributing

Contributions, issues, and feature requests are welcome.

```bash
fork -> create branch -> commit -> push -> pull request
```

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Ramon Christopher Morales**

- 🌐 Website: https://ramon.moralesprojects.com/
- 💻 Full Stack Developer
- ⚡ Specialized in Laravel, React, ElectronJS, and Automation Testing

Built for modern survey automation and browser testing workflows.