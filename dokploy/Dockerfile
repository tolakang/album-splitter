FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy project files
COPY . /app/

# Install Python dependencies
# Dokploy clones without full git history, so we provide a fallback version
# for setuptools-scm. Override SETUPTOOLS_SCM_PRETEND_VERSION via env var in
# dokploy.json to pin a specific version at deploy time.
ARG SETUPTOOLS_SCM_PRETEND_VERSION=0.0.0
ENV SETUPTOOLS_SCM_PRETEND_VERSION_FOR_ALBUM_SPLITTER=${SETUPTOOLS_SCM_PRETEND_VERSION}
RUN pip install --no-cache-dir .

# Create necessary directories
RUN mkdir -p /app/splits /app/uploads /app/output

# Set environment variables for web UI
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV FLASK_APP=album_splitter.web
ENV UPLOAD_FOLDER=/app/uploads
ENV OUTPUT_FOLDER=/app/output
ENV SECRET_KEY=change-this-in-production

# Expose port for web interface
EXPOSE 8000

# Default command: run Flask web server
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--threads", "2", "album_splitter.web:create_app()"]
