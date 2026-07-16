# album-splitter

Use **album-splitter** to automatically split any audio file (youtube videos, albums, podcasts, audiobooks, tapes, vinyls) into separate tracks starting from timestamps. album-splitter will also tag each track with its metadata.

<p align="center">
    <img src='.github/readme/hero.png' width='500px'>
</p>

Common use cases covered:

* music album on YouTube to download and split into tracks
* full audiobook to split into chapters
* music tape/cassette rip to split into tracks
* digitalized vinyl to split into tracks

All you need is:

* The file to split OR an URL of a YouTube video
* Timestamps for each track, for example:
    * `00:06 - When I Was Young`
    * `03:35 Dogs Eating Dogs`

## 🌐 Web Interface

Album Splitter includes a web interface for easy use without the command line.

### Access the Web UI

Once deployed, access the web interface at:
- **Local:** `http://localhost:8000`
- **Remote:** `http://your-server-ip:8000`

### Features
- Upload audio files directly through the browser
- Enter track timestamps in a user-friendly form
- Automatic splitting with real-time progress updates
- Download individual tracks or all files at once
- Support for metadata (artist, album)

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/tolakang/album-splitter.git
cd album-splitter/dokploy

# Start the web interface
docker-compose up --build

# Open in browser
open http://localhost:8000
```

## How to Install (CLI)

### From PyPI

First time only:

+ Install `ffmpeg`
    * Linux: `apt install ffmpeg` (or equivalent)
    * Windows: [Official website](https://ffmpeg.org/)
    * MacOS: [Official website](https://ffmpeg.org/) or `brew install ffmpeg`
+ Install `Python 3` (a version newer or equal to `3.12` is required)
    * Linux: `apt install python3` (or equivalent)
    * Windows: [Official webiste](https://www.python.org/)
    * MacOS: You should have it already installed or `brew install python3`
+ Open your terminal app
+ Create a virtual environment
    * `python3 -m venv venv`
+ Activate the virtual environment
   * Linux/MacOS: `source venv/bin/activate`
   * Windows: `./venv/Scripts/activate`
+ Install album-splitter
    * `python3 -m pip install album-splitter`
+ You are ready to go!

### From Source

```bash
# Clone the repository
git clone https://github.com/tolakang/album-splitter.git
cd album-splitter

# Install in development mode
pip install -e .

# Or install web interface dependencies
pip install -e ".[web]"
```

## Quick Guide (CLI - Local File)

+ Create a copy of the `tracks.txt.example`, rename it as `tracks.txt`
+ Open `tracks.txt`
+ Add your tracks timestamps info in this format:
    * `<start-time> - <title>`
    * A track on each line
    * See *Examples* section, many other formats supported
+ Run the script
    * Basic usage: `python -m album_splitter --file <path/to/your/album.mp3>`
    * With custom output folder: `python -m album_splitter -f </path/to/your_file.mp3> -t </path/to/your_tracks.txt> -o </path/to/output/folder>`
    * More in the *Examples* section
+ Wait for the splitting process to complete
+ You will find your tracks in the `./splits/` folder or in your custom output folder if specified

## Quick Guide (CLI - YouTube Video)

+ Copy the YouTube URL of the album you want to download and split
+ Find in the YouTube comments the tracklist with start-time and title
+ Create a copy of the `tracks.txt.example`, rename it as `tracks.txt`
+ Open `tracks.txt`
+ Copy the tracklist in the file, adjusting for the supported formats
    * `<start-time> - <title>`
    * A track on each line
+ Run the script
    * Basic usage: `python -m album_splitter -yt <youtube_url>`
    * More in the *Examples* section
+ Wait for the Download and for the conversion
+ Wait for the splitting process to complete
+ You will find your tracks in the `./splits` folder

## Output Format

The format of the output tracks is the same as the format of the input (same extension, same codec, same bitrate, ...), it simply does a copy of the codec. If you want to convert the output tracks to a different format you can do so, but album-splitter won't do it for you.

For example to convert from `.wav` to `.mp3` you can use FFmpeg. [Here](https://stackoverflow.com/a/41207442) is how you can do it on Linux/macOS. [This](https://sourceforge.net/projects/ffmpeg-batch/) is a GUI option for Windows.

## Examples

### Downloading and splitting an album from YouTube

+ This is the album I want to download and split: `https://www.youtube.com/watch?v=p_uqD4ng9hw`
+ I find the tracklist in the comments and I copy that in `tracks.txt`, eventually adjusting it to a supported format for the tracklist
+
```
00:06 - When I Was Young
...
14:48 - Pretty Little Girl
```

+ I execute `python -m album_splitter -yt "https://www.youtube.com/watch?v=p_uqD4ng9hw"` and wait
+ Once the process is complete I open the `./splits` and I find all my songs:
```
    When I Was Young.mp3
    ...
    Pretty Little Girl.mp3
```
These songs are already mp3-tagged with their track name and track number, but not their author or their album, since we have not specified it.

### Splitting and tagging with Author and Album a local file

+ I somehow got the file `DogsEatingDogsAlbum.mp3` that I want to split
+ I set the tracklist in `tracks.txt` (same tracks as before)
+ I execute `python -m album_splitter --file DogsEatingDogsAlbum.mp3 --album "Dogs Eating Gods" --artist "blink-182" --folder "2012 - Dogs Eating Dogs"`
+ The software will execute, it will split the album, and mp3-tag each track with the author and the album name I passed as a parameter (as well as track number and name). It will also put the files in the folder I specified with `--folder`

### Specifying a custom output folder

+ Run the script with the `-o` or `--output` flag to specify where the split tracks should be saved:
```
python -m album_splitter -f </path/to/your_file.mp3> -t </path/to/your_tracks.txt> -o </path/to/output/folder>
```
+ The output folder will be created automatically if it doesn't exist
+ All split tracks will be saved in the specified location

## Supported formats for the track list (`tracks.txt`)

These are just some examples, find more in `tracks.txt.example`.

* `[hh:]mm:ss - Title`
* `Title - [hh:]mm:ss`
* `Title [hh:]mm:ss`

To just see which data would be extracted from the tracklist use the option `--dry-run`.

## Available Options

To get the full help and all the available options run `python -m album_splitter --help`

## Web Interface Options

The web interface supports the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Flask secret key | `change-this-in-production` |
| `UPLOAD_FOLDER` | Upload directory | `/app/uploads` |
| `OUTPUT_FOLDER` | Output directory | `/app/output` |
| `PORT` | Server port | `8000` |

## Need help?

If you need any help just [create an Issue](https://github.com/crisbal/album-splitter/issues) or send me an email at the address you can find on my profile.

## Updating

To update to use the latest version of album-splitter you can use `python3 -m pip install --upgrade album-splitter`

## Want to help?

If you want to improve the code and submit a pull request, please feel free to do so.

## License

GPL v3

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=crisbal/album-splitter&type=Date)](https://star-history.com/#crisbal/album-splitter&Date)
