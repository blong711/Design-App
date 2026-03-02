FROM python:3.11-slim

WORKDIR /app

# Install dos2unix to fix potential line ending issues in requirements.txt
RUN apt-get update && \
    apt-get install -y --no-install-recommends dos2unix && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN dos2unix requirements.txt && pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose port
EXPOSE 8000

# Start FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
