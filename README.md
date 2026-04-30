# FleetGenAI – Telemetry & Diagnostic Microservices Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Orchestration-Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/AI_Worker-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

A high-performance technical prototype demonstrating real-time telemetry ingestion, automated anomaly detection, and GenAI-powered diagnostics across a containerized microservices ecosystem.

---

## 📖 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [License](#-license)
- [Author](#-author)

---

## 🔍 Overview
FleetGenAI is designed to handle high-frequency vehicle telemetry. The platform ingests data through a Node.js gateway, processes it via a Python-based AI worker that utilizes Groq (Llama 3) for real-time diagnostics, and visualizes the health of the fleet on a modern React dashboard.

## ✨ Key Features
- **Real-time Ingestion**: High-throughput telemetry simulation and ingestion via Redis Streams.
- **AI-Driven Diagnostics**: Automated anomaly detection coupled with GenAI-assisted technical insights using Llama 3.
- **Interactive Dashboard**: Live telemetry charts, vehicle health status, and a real-time AI alert feed.
- **Full Containerization**: Seamless local deployment and orchestration using Docker Compose.

## 🛠 Tech Stack
| Layer | Technologies |
|---|---|
| **Frontend** | React, TypeScript, Vite, TailwindCSS, Recharts |
| **Ingestion Gateway** | Node.js, TypeScript, Express, ioredis |
| **AI Diagnostics** | Python 3.11, FastAPI, LangChain, Groq (Llama 3) |
| **Data & Messaging** | Redis (Pub/Sub + Streams + Persistence) |
| **Orchestration** | Docker, Docker Compose |

## 📂 Project Structure
```text
├── ai-worker/        # FastAPI service for anomaly detection & AI diagnostics
├── dashboard/        # React frontend for fleet visualization
├── gateway/          # Node.js ingestion engine & telemetry simulator
├── docker-compose.yml # Service orchestration
└── .env              # Environment configuration
```

## 🚀 Installation

### Prerequisites
- [Docker & Docker Compose](https://docs.docker.com/get-docker/)
- [Groq API Key](https://console.groq.com/)

### Setup Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/nagasaicharanh/FleetGenAI-Telemetry-Diagnostic-Microservices-Platform.git
   cd FleetGenAI-Telemetry-Diagnostic-Microservices-Platform
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Open .env and set your GROQ_API_KEY
   ```

3. **Launch the platform**:
   ```bash
   docker compose up --build
   ```

## 💡 Usage
Once the containers are running, you can access the platform at the following endpoints:

- **Dashboard**: `http://localhost:5173`
- **Gateway Health**: `http://localhost:3000/health`
- **AI Worker Health**: `http://localhost:8000/health`

## ⚙️ Configuration
The platform relies on the following environment variables in the `.env` file:
| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Required for AI-generated diagnostics |
| `REDIS_HOST` | Hostname for the Redis service (default: `redis`) |

## 🔌 API Reference (Gateway)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/vehicles` | List all active vehicles and status |
| `GET` | `/api/vehicles/:vin/history` | Retrieve telemetry history for a VIN |
| `GET` | `/api/diagnostics` | Get the latest GenAI diagnostic reports |

## 📜 License
Distributed under the **MIT License**. See `LICENSE` for more information.

## 👤 Author
**nagasaicharanh**  
[GitHub Profile](https://github.com/nagasaicharanh)
