# Album Splitter — Original Codebase Analysis

## Architecture Overview

**Language:** Python 3.12+
**Build System:** setuptools with setuptools-scm for versioning
**Entry Point:** `album-splitter` CLI command → `album_splitter.__main__:main`

```
album_splitter/
├── __main__.py          # CLI entry point, argument parsing, orchestration
├── parse_tracks.py      # Track list parsing (timestamp/duration modes)
├── split_file.py        # FFmpeg-based audio splitting
├── tag_file.py          # ID3 tag writing via music_tag
├── utils/
│   ├── secure_filename.py    # Sanitize filenames for filesystem safety
│   └── ytdl_interface.py     # yt-dlp download config and progress hooks
└── tests/
    └── test_parse_tracks.py  # Unit tests for timestamp parsing
```

## Execution Flow

### 1. Input Handling
- Mutually exclusive input: `-f AUDIO_FILE` or `-yt YOUTUBE_URL`
- If YouTube URL provided → extract video ID from URL (youtube.com or youtu.be)
- Download audio if not already cached locally (checks `{video_id}.wav`)

### 2. Track Parsing (`parse_tracks.py`)
- **Timestamp mode** (default): Each line has `MM:SS Title` or `HH:MM:SS Title`
  - Timestamp is absolute position in the audio file
  - Timestamp can be at beginning or end of line
- **Duration mode** (`-d` flag): Each line has `MM:SS Title` where timestamp is relative duration
  - Accumulates: current_time += parsed_duration
- Regex: `(?:\d+:)?(?:0[0-9]|[1-5][0-9]):(?:0[0-9]|[1-5][0-9])`
- Returns `List[Track(title, start_timestamp)]`
- Lines starting with `#` or empty lines are skipped

### 3. Output Directory Generation
Priority order:
1. `-o FOLDER` flag → use as-is
2. `--album` + `--artist` → `"{artist} - {album}"` sanitized
3. `--album` only → sanitized album name
4. `--artist` only → sanitized artist name
5. YouTube URL → `./splits/{video_id}`
6. Local file → `./splits/{sanitized_filename}`
- Uses `secure_filename()` from werkzeug (adapted)

### 4. Audio Splitting (`split_file.py`)
- Gets total duration via `ffprobe -show_entries format=duration`
- For each track: `ffmpeg -y -hide_banner -loglevel error -stats -i input -vn -c copy -ss START -to END output`
- Key: uses **stream copy** (`-c copy`), no re-encoding — fast but less precise
- File naming: `{zero_padded_index} {title}.{original_format}`
  - Zero-padding width = `len(str(total_tracks))`
- Single FFmpeg command with multiple outputs (batch processing)

### 5. Metadata Tagging (`tag_file.py`)
- Uses `music_tag` library to write ID3 tags
- Tags written: artist, album, year, title, tracknumber
- Extra metadata via `-md key=value` format (repeatable)
- All tags from argparse + track-specific (title, tracknumber)

### 6. YouTube Download (`ytdl_interface.py`)
- Config: `format: bestaudio/best`
- Post-processor: `FFmpegExtractAudio` → converts to WAV
- Output template: `{video_id}.{ext}`
- Progress hooks: prints ETA during download, conversion status
- Logger: suppresses debug/warning, only prints errors

## Features Inventory

| Feature | Implementation | Notes |
|---------|---------------|-------|
| Split local audio files | `-f AUDIO_FILE` | Primary use case |
| Download from YouTube | `-yt URL` | Converts to WAV first |
| Timestamp-based track list | Default mode | `MM:SS Title` or `HH:MM:SS Title` |
| Duration-based track list | `-d` flag | Relative timestamps |
| Track list from file | `-t tracks.txt` | Default: `tracks.txt` |
| Artist metadata | `-a ARTIST` | Written to ID3 tags |
| Album metadata | `-A ALBUM` | Written to ID3 tags |
| Year metadata | `-y YEAR` | Written to ID3 tags |
| Extra metadata | `-md key=value` | Repeatable |
| Custom output folder | `-o FOLDER` | Overrides auto-generated |
| Dry run | `--dry-run` | Shows tracks without splitting |
| Stream copy splitting | `-c copy` | Fast, no re-encoding |
| Batch FFmpeg | Single command | All tracks split in one FFmpeg invocation |
| Secure filenames | werkzeug adapted | ASCII-only, no special chars |
| YouTube video ID caching | Check local file | Avoids re-download |

## Supported Input Formats

- **Audio files:** Any format FFmpeg can read (MP3, WAV, FLAC, M4A, OGG, etc.)
- **YouTube URLs:** `youtube.com` and `youtu.be` formats
- **Track lists:** Plain text files with timestamp + title per line

## Error Handling

- Invalid YouTube URL → `ValueError` (missing scheme, unknown host)
- Missing tracks file → print error + `exit(-1)`
- No tracks parsed → print error + `exit(-1)`
- Missing input file → print error + `exit(-1)`
- FFmpeg failure → `raise Exception` with generic message
- **Weaknesses:** No graceful error recovery, no partial results, no progress reporting beyond console

## Limitations

1. **No web interface** — CLI only
2. **No async processing** — blocks during download and split
3. **No progress tracking** — only console output
4. **No job queue** — single process, single job
5. **No database** — all state in filesystem
6. **No cleanup** — generated files persist indefinitely
7. **No concurrent jobs** — one split at a time
8. **No file upload** — must provide local path
9. **No web-based track editing** — must prepare tracks.txt externally
10. **No partial download** — YouTube download is all-or-nothing
11. **No error recovery** — if split fails, start over
12. **No metadata preview** — tags written blindly
13. **Stream copy precision** — `-c copy` means cuts happen at keyframes, not exact timestamps
14. **WAV intermediate** — YouTube downloads convert to WAV (large files) before splitting

## Reusable Components for Web Backend

| Component | Reuse Strategy |
|-----------|---------------|
| `parse_tracks.py` | Port to TypeScript or call via child process |
| `split_file.py` | Port FFmpeg commands to TypeScript (fluent-ffmpeg) |
| `tag_file.py` | Port to TypeScript (music-metadata) |
| `secure_filename.py` | Direct port to TypeScript |
| `ytdl_interface.py` | Call yt-dlp as subprocess, parse progress hooks |
| Track regex pattern | Port directly: `(?:\d+:)?(?:0[0-9]|[1-5][0-9]):(?:0[0-9]|[1-5][0-9])` |

## Improvement Opportunities

1. **Stream copy → re-encode option** for precise cuts
2. **Progress callbacks** instead of console print
3. **Configurable output format** (MP3, FLAC, etc.)
4. **Batch processing** — multiple albums simultaneously
5. **Resume capability** — skip already-split tracks
6. **Metadata validation** — preview before writing
7. **Album art** — embed from YouTube thumbnail or upload
8. **Chapter markers** — import from YouTube description
9. **Playlist support** — split multiple YouTube videos
10. **API layer** — expose all functionality via REST endpoints
