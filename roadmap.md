# VibeMatch AI - Enterprise Project Roadmap

This is the detailed, industry-standard implementation plan. It is structured for an enterprise-level application that will scale to thousands of users, support a web application, and eventually support mobile apps on the Google Play Store and Apple App Store.

---

## 🏗️ Master Architecture (Web + Mobile Ready)

To support both a Web App and a Mobile App in the future, we must use an **API-First (Headless) Architecture**.

*   **The Backend (The Brain):** We are building a standalone REST API in Next.js. This API will handle the database, Marvin AI logic, authentication, and payments.
*   **The Web Frontend (The Website):** Built within Next.js, it will "talk" to our Backend API.
*   **The Mobile Frontend (Future):** When you are ready for the Play Store/App Store, you will build a React Native or Flutter app. This mobile app will simply plug into the exact same Backend API we are building right now.

---

## 📂 Enterprise Folder Structure

We will use a highly organized, industry-standard folder structure inside our Next.js `src` directory to keep business logic completely separate from UI logic:

*   `src/app/` ➔ Next.js Pages and API Routes (Endpoints)
*   `src/models/` ➔ Mongoose Database Schemas (PG, Owner, User)
*   `src/services/` ➔ Core Business Logic (AI Matching, Database Queries)
*   `src/controllers/` ➔ API Request Handlers
*   `src/middlewares/` ➔ Authentication & Security rules
*   `src/utils/` ➔ Helper functions (Date formatting, validators)
*   `src/components/` ➔ Reusable UI elements (Buttons, Cards, Modals)

---

## 🗺️ Highly Detailed Execution Roadmap

### Phase 1: Database & Enterprise Foundation (Current)
*   [ ] Configure MongoDB Atlas for cloud database hosting.
*   [ ] Establish the enterprise folder structure (models, services, controllers).
*   [ ] Create Mongoose Schemas with strict validation:
    *   `PG_Property` Model
    *   `Owner` Model
    *   `Searcher` Model
*   [ ] Build global database connection utility.

### Phase 2: Core API Development
*   [ ] Build B2B Endpoints (Owners):
    *   `POST /api/owner/register`
    *   `POST /api/pg/create`
    *   `PUT /api/pg/update`
*   [ ] Build B2C Endpoints (Searchers):
    *   `GET /api/pg/search` (Standard filter search)
    *   `GET /api/pg/:id` (View single PG details)

### Phase 3: AI Engine Integration ("VibeMatch")
*   [ ] Integrate Google Gemini API / Marvin AI.
*   [ ] Build the Natural Language Parsing Service:
    *   Extract Budget, Location, Rules, and Amenities from a user's plain english paragraph.
*   [ ] Build the AI Matching Service:
    *   Query the MongoDB database using the extracted AI parameters to find the top 3 best matches.
*   [ ] Expose `POST /api/ai/match` endpoint.

### Phase 4: B2B Owner Portal (Frontend)
*   [ ] Build secure Owner Authentication (Login/Register).
*   [ ] Build Owner Dashboard UI.
*   [ ] Build forms for Owners to upload PG details, rules, and photos.
*   [ ] Connect Frontend forms to Backend APIs.

### Phase 5: B2C Searcher Portal (Frontend)
*   [ ] Build the beautiful landing page with the AI Search Bar.
*   [ ] Build the Search Results page (List view + Map view).
*   [ ] Build the PG Details page (Photos, Amenities, Reviews).
*   [ ] Implement user booking/visit requests.

### Phase 6: Mobile App Readiness
*   [ ] Ensure all API routes are fully secured with JWT (JSON Web Tokens).
*   [ ] Write API documentation (Swagger/Postman) so a mobile developer can easily build the Flutter/React Native app.

---

## 🛠️ Your Current Task: Setting Up MongoDB

To build this, our Next.js app needs a database. Here are the exact, step-by-step instructions for what you need to do right now in MongoDB:

1.  **Go to the Website:** Open [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2.  **Create a Cluster:** 
    *   Click **"Create a Deployment"** or **"Build a Database"**.
    *   Select the **"M0 Free"** option (Completely free forever).
    *   Choose any provider (AWS/Google Cloud) and a region closest to you.
    *   Click **Create**.
3.  **Create a Database User:**
    *   It will ask you to create a Username and Password. 
    *   *Type a username and a simple password, and save them somewhere safe.*
4.  **Configure Network Access:**
    *   It will ask "Where would you like to connect from?".
    *   Select **"Allow Access from Anywhere"** (This adds IP `0.0.0.0/0`).
5.  **Get the Connection String:**
    *   Go to your Database dashboard and click the **"Connect"** button.
    *   Select **"Drivers"** (or "Connect your application").
    *   You will see a string that looks like this: `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`
6.  **Send it to me:** Paste that entire string here in the chat (replace `<password>` with the password you created).
