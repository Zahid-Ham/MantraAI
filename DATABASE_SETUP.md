# MantraAI Database Setup & Migration Guide

This document describes the steps required to configure the PostgreSQL database and run migrations via Alembic for the MantraAI backend service.

---

## 1. Setup PostgreSQL

MantraAI requires a PostgreSQL instance running version 12 or newer.

1. **Install PostgreSQL**:
   - **Windows**: Download and run the installer from the official [EnterpriseDB page](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads).
   - **macOS**: Install via Homebrew:
     ```bash
     brew install postgresql@14
     brew services start postgresql@14
     ```
   - **Linux (Ubuntu/Debian)**:
     ```bash
     sudo apt update
     sudo apt install postgresql postgresql-contrib
     sudo systemctl start postgresql
     ```

2. **Create Database**:
   Log in to the PostgreSQL prompt using `psql` or a database administration utility (like pgAdmin or DBeaver) and create the `mantraai` database:
   ```sql
   CREATE DATABASE mantraai;
   ```

---

## 2. Configure Environmental Variables

Configuration parameters are loaded from the `.env` file in the `backend/` directory.

1. Open `backend/.env` (or copy `backend/.env.example` as a template):
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Update the `DATABASE_URL` value to match your PostgreSQL instance connection credentials:
   ```env
   DATABASE_URL=postgresql+psycopg://<username>:<password>@<host>:<port>/mantraai
   ```
   *Example for local development on Windows:*
   ```env
   DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/mantraai
   ```

---

## 3. Run Alembic Migrations

MantraAI uses Alembic for database migrations to maintain schema definitions and support schema evolution.

1. **Activate the Virtual Environment**:
   Navigate to the `backend/` directory and activate the virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     source .venv/bin/activate
     ```

2. **Apply Migrations**:
   Execute the Alembic upgrade command to apply migrations and build the schema:
   ```bash
   alembic upgrade head
   ```

This will create the following tables inside the `mantraai` database:
- `users` — stores user profile bridges mapped to Firebase UIDs.
- `assessment_sessions` — tracks started, completed, or abandoned assessment sessions.
- `assessment_responses` — stores user answers progressively using question IDs.
- `assessment_results` — stores non-diagnostic clinical category evaluations.
- `reports` — caches generated AI wellness reports.
- `audit_events` — tracks system event histories.

---

## 4. Troubleshooting

- **Error: `psycopg.OperationalError`**:
  Make sure PostgreSQL service is running and credentials (username/password) set in `DATABASE_URL` are correct.
- **Error: `ModuleNotFoundError`**:
  Make sure you activated the `.venv` and installed dependencies via:
  ```bash
  pip install -r requirements.txt
  ```
