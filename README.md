# AI-Powered Daily Time Tracking & Analytics Dashboard

A minimal, responsive Time Tracking web app built with HTML/CSS/JS and Firebase. This project demonstrates:

- User authentication with Firebase Auth (Google + Email/Password)
- Activity logging per date with minutes, category, CRUD operations
- Data stored in Firestore under `users/{uid}/days/{date}/activities`
- Date-based analytics dashboard with Pie & Bar charts (Chart.js)
- Responsive UI and a "No data available" screen for empty dates
- Notes on how AI was used in the project workflow

Live demo: [Replace with your deployed URL]
Video walkthrough: [Replace with your video URL]
GitHub repo: [Replace with your repo URL]

## Quick Start (Local)

1. Clone repo

```powershell
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

2. Open `index.html` in a local static server or directly in browser. For a simple local server (PowerShell):

```powershell
python -m http.server 5500
# then open http://localhost:5500 in your browser
```

3. Firebase setup
- Create a Firebase project at https://console.firebase.google.com
- Enable Authentication (Email/Password and Google)
- Create a Firestore database (in test mode for development)
- Copy your Firebase configuration and replace the values in `firebase.js`

Alternatively, use the provided helper to create a `firebase-config.js` file and avoid editing `firebase.js` directly:

Option A — Interactive helper (Windows PowerShell):

```powershell
cd 'c:\Users\monic\Desktop\AIEval'
.\setup-firebase.ps1
```

This creates a `firebase-config.js` in the project root. Then include it in `index.html` BEFORE `firebase.js` (add this line above `firebase.js`):

```html
<script src="firebase-config.js"></script>
```

Option B — Manual copy

- Open `firebase-config.example.js`, copy it to `firebase-config.js`, and replace the placeholders with your Firebase project's values.

4. Reload the app and sign in.

## Firestore structure

- `users/{uid}/days/{YYYY-MM-DD}/activities/{activityId}`
  - fields: `name` (string), `category` (string), `minutes` (number), `createdAt` (timestamp)

## How the Analyse button works
- The app computes the total minutes logged for selected date.
- Analyse is enabled when total minutes &gt; 0 and &le; 1440.
- Clicking Analyse opens the dashboard view for that date.

## UI Notes
- Clean, dark theme with readable typography.
- "No data available" shows a friendly illustration and CTA.
- Responsive layout: charts stack on mobile, side-by-side on larger screens.

## How AI was used
- UI/UX suggestions and color palette generated with LLM prompts.
- Initial scaffolding and component structure was drafted with AI assistance.
- Sample Chart.js configurations and Firestore data model were refined using AI prompts.

## Future improvements
- Add timeline representation of the day (hour-by-hour view).
- Add data export/import (CSV) and per-week/month analytics.
- Improve accessibility and add tests.
- Add GitHub Actions to auto-deploy to GitHub Pages.

## Files of interest
- `index.html` — main UI
- `styles.css` — styles and responsive layout
- `firebase.js` — firebase config placeholder & init
- `app.js` — main JavaScript logic
