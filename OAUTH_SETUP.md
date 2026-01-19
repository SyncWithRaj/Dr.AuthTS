# OAuth 2.0 Setup Guide

This guide explains how to generate the Client IDs and Secrets required for Google and GitHub login.

## 1. Google OAuth Setup
**Goal:** Get `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

1.  Go to the **[Google Cloud Console](https://console.cloud.google.com/)**.
2.  **Create a New Project**:
    *   Click the project dropdown (top left) → **New Project**.
    *   Name it (e.g., "Dr Auth").
    *   Click **Create**.
3.  **Configure Consent Screen**:
    *   Search for **"OAuth consent screen"** in the top search bar.
    *   Select **External** (for testing) → **Create**.
    *   Fill in:
        *   **App Name**: Dr.Auth
        *   **Support Email**: Your email.
        *   **Developer Contact Info**: Your email.
    *   Click **Save and Continue** (skip scopes for now).
4.  **Create Credentials**:
    *   Go to **Credentials** (left sidebar).
    *   Click **+ CREATE CREDENTIALS** → **OAuth client ID**.
    *   **Application Type**: Web application.
    *   **Name**: Dr Auth Web.
    *   **Authorized JavaScript origins**: `http://localhost:5173`  (Your Frontend)
    *   **Authorized redirect URIs**: `http://localhost:5000/api/auth/google/callback` (Your Backend)
    *   Click **Create**.
5.  **Copy Keys**:
    *   Copy the **Client ID** and **Client Secret** into your `.env` file.

---

## 2. GitHub OAuth Setup
**Goal:** Get `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

1.  Log in to **[GitHub](https://github.com/)**.
2.  Go to **Settings** (top right profile icon).
3.  Scroll down to **Developer settings** (bottom left sidebar).
4.  Select **OAuth Apps** → **New OAuth App**.
5.  **Register a new application**:
    *   **Application Name**: Dr.Auth
    *   **Homepage URL**: `http://localhost:5173` (Your Frontend)
    *   **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback` (Your Backend)
6.  Click **Register application**.
7.  **Generate Secret**:
    *   You will see the **Client ID** immediately.
    *   Click **Generate a new client secret** to get the Secret.
8.  **Copy Keys**:
    *   Copy the keys into your `.env` file.

---

## 3. Update .env File
Paste the values you obtained into your server's `.env` file:

```bash
# Social Login Config
GOOGLE_CLIENT_ID="your_google_id_here"
GOOGLE_CLIENT_SECRET="your_google_secret_here"
GITHUB_CLIENT_ID="your_github_id_here"
GITHUB_CLIENT_SECRET="your_github_secret_here"
CLIENT_URL="http://localhost:5173"
```
