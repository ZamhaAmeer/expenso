# Expenso 💸
### Smart Personal Finance Tracker with AI & OCR

[![Flutter](https://img.shields.io/badge/Flutter-%2302569B.svg?style=for-the-badge&logo=Flutter&logoColor=white)](https://flutter.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Expenso** is a cross-platform personal finance application designed to eliminate the friction of manual data entry. By leveraging the power of AI and Optical Character Recognition (OCR), Expenso allows users to log expenses via natural conversation or by simply snapping a photo of a receipt.

Unlike traditional expense trackers, Expenso features a **Human-in-the-Loop (HITL)** validation system to ensure 100% database accuracy, alongside a visually intuitive GitHub-style spending heatmap.

---

## ✨ Key Features

### 🤖 Novelty & AI Features
- **AI Chat Entry:** Log expenses using natural language (e.g., *"Spent 15 dollars on pizza yesterday"*). The backend uses LLMs to parse the unstructured text into structured JSON.
- **Receipt Scanner (OCR):** Upload or capture a photo of a receipt. The app automatically extracts the total amount, merchant, and date.
- **Human-in-the-Loop Review:** AI and OCR never save directly to the database. Users are presented with a pre-filled "Review & Confirm" form to edit any AI mistakes before saving.
- **GitHub-Style Spending Heatmap:** A 52-week visual grid that tracks spending intensity (Dark Red = High spend, Green = Low spend).
- **Predictive Cash Flow (Coming Soon):** Uses historical data to forecast end-of-month spending.

### 📱 Core Features
- **Secure Authentication:** JWT-based login and registration with password strength validation.
- **Transaction Management:** Full CRUD (Create, Read, Update, Delete) for income and expenses.
- **Interactive Dashboard:** Real-time summary cards (Total Balance, Income, Expenses) and dynamic charts (Pie & Bar charts).
- **Categorization:** Custom categories with visual icons.
- **Offline-First Architecture:** Caches transactions locally when the network drops and syncs to MongoDB when the connection returns.
- **Notifications & Alerts:** Instant popovers for budget limits and AI insights.

---

## 🛠️ Technologies Used

| Layer | Technology |
| :--- | :--- |
| **Frontend (Mobile + Web)** | Flutter, Dart |
| **State Management** | Riverpod / Provider |
| **Backend API** | Node.js, Express.js |
| **Database** | MongoDB (MongoDB Atlas) |
| **Authentication** | JWT (JSON Web Tokens) |
| **AI / NLP** | OpenAI API (GPT-3.5/4o-mini) |
| **OCR (Receipt Scanning)** | Google ML Kit (Flutter Package) |
| **Charts & Visuals** | `fl_chart`, `flutter_heatmap_calendar` |
| **Design & Prototyping** | Figma |

---

## 🏗️ System Architecture

```text
[ FLUTTER APP (Frontend) ]
       |
       | 1. User logs in via Flutter UI
       | 2. Flutter sends HTTP Request (using `dio` package) to Node API
       v
[ NODE.JS + EXPRESS (Backend API) ]
       |
       | 3. Validates JWT Token
       | 4. Processes business logic
       | 5. (Optional) Sends extracted text to OpenAI API for parsing
       v
[ MONGODB ATLAS (Database) ]
       |
       | 6. Saves/Retrieves data
       v
[ NODE.JS sends JSON Response back to Flutter ]
       |
       v
[ FLUTTER APP renders the UI ]
