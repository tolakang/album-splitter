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

# Create splits directory
RUN mkdir -p /app/splits

# Expose port if needed (optional, for future web interface)
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Default command
CMD ["album-splitter", "--help"]
