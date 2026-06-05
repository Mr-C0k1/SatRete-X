SatRete-X: Sovereign RF Intelligence Engine
SatRete-X is an autonomous radio frequency (RF) intelligence framework designed to detect, validate, and analyze threats in satellite (LEO) telemetry in real time.
Overview
In the era of massive satellite constellations, satellite-to-Earth communications infrastructure is often a weak point. SatRete-X aims to provide a sovereign defense solution—it does not rely on third-party APIs, runs air-gapped on Kali Linux, and uses a dual-layer detection approach to separate legitimate data from intrusions or cyberattacks.
Core Features
Deterministic Orbital Calculator: Calculates satellite positions and transmission windows locally without relying on external APIs.

Dual-Layer Detection Engine:
Layer 1 (Mathematical): Validates the CCSDS protocol and analyzes entropy to calculate the Authenticity Index (0.0 - 1.0).
Layer 2 (Contextual AI): In-depth analysis using Local LLM (Ollama) to detect data leaks (PII, command hijacking, military intelligence).
Post-Quantum Cryptography (PQC) Readiness: Integrating ML-KEM and ML-DSA standards to safeguard the integrity of satellite commands from future quantum computing threats.
Zero-Dependency Forensic Pipeline: The entire data analysis process is performed locally, ensuring full confidentiality for operators.

Architecture
SatRete-X is developed through a collaborative human-AI framework, leveraging AI's deductive logic capabilities to build a modular, stable, and precise detection system.
Quick Start
Environment: Ensure you are running the system on Kali Linux.
AI Engine: Ensure the Ollama service is running on localhost:11434.

Installation:
npm install
npm run dev
