# Project Overview

This is a web application called Krypta, which appears to be a password manager. It consists of a Python backend and a React frontend. The application is containerized using Docker and can be managed with `docker-compose`. The frontend can also be packaged as a desktop application using Tauri.

## Backend

The backend is built with Python using the FastAPI framework. It uses SQLAlchemy for database interaction and Pydantic for data validation. The backend code is located in the `backend/` directory.

Key files:
- `backend/main.py`: The entry point of the application.
- `backend/app/`: Contains the core application logic, including database models, schemas, repositories, and services.
- `backend/requirements.txt`: Lists the Python dependencies.
- `backend/Dockerfile`: Used to build the backend Docker image.

## Frontend

The frontend is a React application built with Vite. It uses the `lucide-react` library for icons and can be packaged as a desktop application using Tauri. The frontend code is located in the `frontend/` directory.

Key files:
- `frontend/src/`: Contains the React source code.
- `frontend/package.json`: Lists the Node.js dependencies and scripts.
- `frontend/vite.config.js`: The Vite configuration file.
- `frontend/Dockerfile`: Used to build the frontend Docker image.
- `frontend/src-tauri/`: Contains the Tauri configuration and source code.

# Building and Running

The entire application can be built and run using Docker Compose:

```bash
docker compose up -d --build
```

## Frontend

To run only the frontend:

```bash
docker compose up frontend -d --build
```

To run the frontend in development mode (without Docker):

```bash
cd frontend
npm install
npm run dev
```

To build the frontend:

```bash
cd frontend
npm run build
```

To run the Tauri desktop application:

```bash
cd frontend
npm run tauri
```

## Backend

To run only the backend:

```bash
docker compose up backend -d --build
```

To run the backend in development mode (without Docker):

1.  **Set up the environment:**
    *   Create a `.env` file in the `backend/` directory based on the `.env.new` template.
    *   Set up a local database and update the `.env` file with the connection details.
    *   Generate local HTTPS certificates using `mkcert` as described in `backend/README.md`.

2.  **Install dependencies:**
    ```bash
    cd backend
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    ```

3.  **Run the application:**
    ```bash
    cd backend
    python main.py
    ```

# Development Conventions

## Backend

*   The backend follows a layered architecture, with services, repositories, and models clearly separated.
*   It uses SQLAlchemy for database access and Pydantic for data validation.
*   The API endpoints are defined in `backend/app/routers/`.

## Frontend

*   The frontend is a React application.
*   It uses Vite for the build process.
*   The application is structured with components, views, and context.
*   It can be packaged as a desktop application using Tauri.
