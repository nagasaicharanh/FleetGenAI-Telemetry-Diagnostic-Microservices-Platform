import json
import logging
import os
import threading
import time
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from groq import Groq
from langchain.prompts import PromptTemplate
from pydantic import BaseModel, Field, ValidationError
from redis import Redis

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

PROMPT = PromptTemplate.from_template(
    "Vehicle {vin} reported Engine Temp {engine_temp}C and Error Code {error_code} at {speed}km/h. "
    "Act as a senior vehicle diagnostic engineer. Explain the likely mechanical failure and suggest a repair "
    "action in exactly 2 concise sentences."
)


class SensorData(BaseModel):
    vin: str
    speed: int
    engineTemp: int = Field(alias="engineTemp")
    errorCode: str | None = Field(default=None, alias="errorCode")
    timestamp: int


class WorkerState:
    running: bool = True


redis_client = Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
worker_state = WorkerState()


def is_anomaly(payload: SensorData) -> bool:
    return payload.engineTemp > 115 or payload.errorCode is not None


def generate_report(payload: SensorData) -> str:
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is required for AI diagnostics.")

    client = Groq(api_key=GROQ_API_KEY)
    prompt = PROMPT.format(
        vin=payload.vin,
        engine_temp=payload.engineTemp,
        error_code=payload.errorCode or "None",
        speed=payload.speed,
    )
    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=160,
    )
    return completion.choices[0].message.content.strip()


def persist_report(vin: str, report: str, source: str) -> None:
    payload: dict[str, Any] = {
        "vin": vin,
        "report": report,
        "timestamp": int(time.time() * 1000),
        "source": source,
    }
    serialized = json.dumps(payload)
    redis_client.hset("diagnostics:latest", vin, serialized)
    redis_client.lpush("diagnostics:feed", serialized)
    redis_client.ltrim("diagnostics:feed", 0, 199)


def process_telemetry(raw_data: str) -> None:
    parsed = SensorData.model_validate_json(raw_data)
    if not is_anomaly(parsed):
        return

    report = generate_report(parsed)
    persist_report(parsed.vin, report, "groq")
    logging.info("Diagnostic generated for %s", parsed.vin)


def run_worker_loop() -> None:
    pubsub = redis_client.pubsub()
    pubsub.subscribe("telemetry_stream")
    logging.info("Subscribed to telemetry_stream")

    try:
        for message in pubsub.listen():
            if not worker_state.running:
                break
            if message.get("type") != "message":
                continue
            raw_data = message.get("data")
            if not isinstance(raw_data, str):
                continue
            try:
                process_telemetry(raw_data)
            except ValidationError as validation_error:
                logging.error("Invalid telemetry payload: %s", validation_error)
            except Exception as processing_error:
                logging.error("Diagnostic processing failure: %s", processing_error)
                try:
                    raw_json = json.loads(raw_data)
                    vin = str(raw_json.get("vin", "UNKNOWN"))
                    persist_report(vin, f"AI diagnostics failed: {processing_error}", "worker_error")
                except Exception as report_error:
                    logging.error("Failed to persist worker error payload: %s", report_error)
    finally:
        pubsub.close()


worker_thread: threading.Thread | None = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global worker_thread
    worker_state.running = True
    worker_thread = threading.Thread(target=run_worker_loop, daemon=True)
    worker_thread.start()
    yield
    worker_state.running = False
    if worker_thread is not None:
        worker_thread.join(timeout=5)


app = FastAPI(title="FleetGenAI AI Worker", lifespan=lifespan)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-worker"}
