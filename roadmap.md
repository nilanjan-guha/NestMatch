# VibeMatch AI - Project Roadmap & Implementation Plan

Welcome to the start of VibeMatch AI! This document outlines our step-by-step strategy for building this AI-powered Two-Sided Marketplace.

## 💰 The 100% Free Tech Stack Strategy
Per your request, we will use a tech stack where development, hosting, databases, and version control are **completely free**.

*   **Frontend & Backend (All-in-One): Next.js (React)**
    *   *Why:* Next.js allows us to write both our beautiful frontend UI and our backend API routes in the same project. 
    *   *Cost:* Free.
*   **Database: MongoDB Atlas (M0 Free Tier)**
    *   *Why:* It provides a completely free, cloud-hosted NoSQL database (512MB storage, plenty for starting out). It handles complex data like AI preferences and GPS coordinates easily.
    *   *Cost:* Free forever tier (no credit card required).
*   **Hosting: Vercel**
    *   *Why:* Vercel is the creator of Next.js. They will host our frontend and backend APIs on their global edge network.
    *   *Cost:* Generous free tier for hobbyists/individual developers.
*   **Version Control (Git): GitHub**
    *   *Why:* Industry standard for code storage.
    *   *Cost:* Free for unlimited private and public repositories.
*   **AI Integration: Google Gemini API (via Marvin AI / LangChain)**
    *   *Why:* Gemini offers a robust free tier for developers to do natural language matching.

---

## 🗺️ Master Roadmap

- **Phase 1: Database Schema & Setup (Current Step)**
  - Finalize data structure.
  - Set up local Next.js project.
  - Connect to free MongoDB Atlas.
- **Phase 2: Backend API & AI Integration**
  - Build API routes in Next.js.
  - Integrate AI for natural language parsing and matching.
- **Phase 3: Owner Portal (B2B)**
  - Build the dashboard for PG owners to register and manage properties.
- **Phase 4: Searcher Portal (B2C)**
  - Build the beautiful, user-facing website with AI chat search and maps.
- **Phase 5: Deployment**
  - Push code to GitHub and automatically deploy to Vercel for free.

---

## 🗄️ Phase 1: Database Schema

Using **MongoDB**, our data will be stored as flexible JSON documents.

### 1. `PG_Property` (The Core Entity)
*   `_id`: Unique identifier
*   `owner_id`: Reference to the Owner
*   `name`: String (e.g., "Sunrise PG for Men")
*   `description`: Text
*   `address`: Object `{ street, city, state, zip_code, coordinates: [lng, lat] }`
*   `gender_type`: String ("Male", "Female", "Unisex")
*   `pricing`: Object `{ monthly_rent, security_deposit }`
*   `amenities`: Array of Strings `["WiFi", "AC", "Food Included"]`
*   `rules`: Array of Strings `["Night Curfew", "Veg Only"]`
*   `media`: Array of URLs (Photos/Videos)

### 2. `Owner` (B2B User)
*   `_id`: Unique identifier
*   `name`: String
*   `email`: String
*   `phone`: String

### 3. `Searcher` (B2C User)
*   `_id`: Unique identifier
*   `name`: String
*   `email`: String
*   `preferences`: String (Their saved AI search prompt)
