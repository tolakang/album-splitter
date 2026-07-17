"use client"

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Video, Loader2, CheckCircle, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Album } from "@/types";

interface YouTubeSectionProps {
  onAlbumCreated: (album: Album) => void;
}

export function YouTubeSection({ onAlbumCreated }: YouTubeSectionProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [trackList, setTrackList] = useState("");
  const [albumTitle, setAlbumTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [albumName, setAlbumName] = useState("");
  const [year, setYear] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const parseTrackList = (text: string) => {
    const lines = text.trim().split('\n');
    const tracks = [];
    for (const line of lines) {
      const match = line.match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s+(.+)$/);
      if (match) {
        const hours = match[1] ? parseInt(match[1], 10) : 0;
        const minutes = parseInt(match[2], 10);
        const seconds = parseInt(match[3], 10);
        tracks.push({
          title: match[4].trim(),
          startTimestamp: hours * 3600 + minutes * 60 + seconds,
        });
      }
    }
    return tracks;
  };

  const handleSplit = async () => {
    if (!youtubeUrl) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    if (!trackList) {
      toast.error("Please provide a track list");
      return;
    }

    const tracks = parseTrackList(trackList);
    if (tracks.length === 0) {
      toast.error("Invalid track list format. Use: MM:SS Track Title");
      return;
    }

    setIsProcessing(true);

    try {
      // Create album with tracks
      const album = await api.albums.create({
        youtubeUrl,
        title: albumTitle || undefined,
        artist: artist || undefined,
        albumName: albumName || undefined,
        year: year ? parseInt(year, 10) : undefined,
        tracks,
      });

      // Trigger split (YouTube URL will be downloaded by backend worker)
      await api.split.trigger(album.id, { tracks });

      toast.success("Album created! Processing started...");
      onAlbumCreated(album);

      // Reset form
      setYoutubeUrl("");
      setTrackList("");
      setAlbumTitle("");
      setArtist("");
      setAlbumName("");
      setYear("");
      setIsExpanded(false);

    } catch (error: any) {
      toast.error(error.message || "Failed to create album");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Accordion
      value={isExpanded ? ["youtube"] : []}
      onValueChange={(value: string[]) => setIsExpanded(value.includes("youtube"))}
    >
      <AccordionItem value="youtube" className="border rounded-lg">
        <AccordionTrigger className="px-4">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-red-500" />
            <span>YouTube Album Splitter</span>
            <Badge variant="secondary">Popular</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <Card>
            <CardHeader>
              <CardTitle>Split YouTube Album</CardTitle>
              <CardDescription>
                Download and split a YouTube video into individual tracks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* YouTube URL */}
              <div className="space-y-2">
                <Label htmlFor="youtube-url">YouTube URL</Label>
                <Input
                  id="youtube-url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  disabled={isProcessing}
                />
              </div>

              {/* Track List */}
              <div className="space-y-2">
                <Label htmlFor="track-list">Track List (timestamps + titles)</Label>
                <textarea
                  id="track-list"
                  className="w-full h-32 px-3 py-2 text-sm border rounded-md bg-background"
                  placeholder={`00:00 Track 1\n03:45 Track 2\n07:30 Track 3`}
                  value={trackList}
                  onChange={(e) => setTrackList(e.target.value)}
                  disabled={isProcessing}
                />
              </div>

              {/* Album Title */}
              <div className="space-y-2">
                <Label htmlFor="album-title">Album Title (optional)</Label>
                <Input
                  id="album-title"
                  placeholder="My Album"
                  value={albumTitle}
                  onChange={(e) => setAlbumTitle(e.target.value)}
                  disabled={isProcessing}
                />
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="youtube-artist">Artist (optional)</Label>
                  <Input
                    id="youtube-artist"
                    placeholder="Artist"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube-album">Album Name (optional)</Label>
                  <Input
                    id="youtube-album"
                    placeholder="Album Name"
                    value={albumName}
                    onChange={(e) => setAlbumName(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube-year">Year (optional)</Label>
                  <Input
                    id="youtube-year"
                    placeholder="2024"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {/* Submit */}
              <Button
                onClick={handleSplit}
                disabled={isProcessing || !youtubeUrl || !trackList}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Split Album
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
