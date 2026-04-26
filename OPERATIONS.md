# RepoChat — Operations & Production Guide 🛠️

This document outlines the operational requirements, monitoring strategies, and scaling patterns for RepoChat in a production environment.

## 1. Monitoring & Logging

### Structured Logging
We use `winston` for structured logging. Logs are rotated daily and kept for 14 days.
- **Error Logs**: `/server/logs/error-YYYY-MM-DD.log`
- **Combined Logs**: `/server/logs/combined-YYYY-MM-DD.log`

### Recommendations
- **Log Aggregation**: In production, push logs to ELK Stack, Datadog, or CloudWatch.
- **Apex Monitoring**: Monitor the `/health` endpoint for uptime checks.
- **Resource Profiling**: Monitor memory usage of `tree-sitter` during heavy repository parsing.

## 2. Scaling Patterns

### Horizontal Scaling
- **Express Server**: Stateless. Can be scaled horizontally behind an Nginx or ALB load balancer.
- **Queueing (Urgent)**: For production, move repository cloning and indexing to a background worker (e.g., BullMQ + Redis) to prevent blocking the main event loop.

### Database Scaling
- **MongoDB**: Use Replica Sets for high availability.
- **ChromaDB**: Deploy in distributed mode or use a managed vector DB (e.g., Pinecone/Milvus) for very large datasets.

## 3. Security Hardening

### Credentials
- **Encryption**: API keys are encrypted at rest using AES-256-GCM. Rotate `ENCRYPTION_KEY` periodically.
- **JWT**: Tokens should be stored in `HttpOnly` cookies to prevent XSS.

### Network
- Ensure internal services (MongoDB, ChromaDB) are not exposed to the public internet. Use a VPC.

## 4. Disaster Recovery

### Backups
- **MongoDB**: Daily snapshots.
- **Vector DB**: ChromaDB persists data to the volume; ensure volume snapshots are enabled.

## 5. Maintenance

### Dependency Updates
Run `npm audit` weekly. The CI/CD pipeline will fail on high-vulnerability packages.

### Cache Analytics
Periodically clear the `server/temp` directory where repositories are cloned.
