"use client"

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Upload, Loader2, Plus, X, Music, FileText } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Album } from "@/types";

interface UploadCard {
  id: string;
  audioFile: File | null;
  trackList: string;
  albumTitle: string;
  isUploading: boolean;
}

interface FileUploadSectionProps {
  onAlbumCreated: (album: Album) => void;
}

export function FileUploadSection({ onAlbumCreated }: FileUploadSectionProps) {
  const [cards, setCards] = useState<UploadCard[]>([
    { id: "1", audioFile: null, trackList: "", albumTitle: "", isUploading: false }
  ]);
  const [isExpanded, setIsExpanded] = useState(false);

  const addCard = () => {
    setCards([
      ...cards,
      {
        id: String(Date.now()),
        audioFile: null,
        trackList: "",
        albumTitle: "",
        isUploading: false,
      },
    ]);
  };

  const removeCard = (id: string) => {
    if (cards.length > 1) {
      setCards(cards.filter((card) => card.id !== id));
    }
  };

  const updateCard = (id: string, updates: Partial<UploadCard>) => {
    setCards(cards.map((card) => (card.id === id ? { ...card, ...updates } : card)));
  };

  const onDrop = useCallback((acceptedFiles: File[], cardId: string) => {
    const file = acceptedFiles[0];
    if (file) {
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        toast.error("File too large. Maximum size: 500MB");
        return;
      }

      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/mp4'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid file type. Allowed: MP3, WAV, FLAC, OGG, M4A");
        return;
      }

      updateCard(cardId, { audioFile: file });
    }
  }, []);

  const parseTrackList = (text: string) => {
    const lines = text.trim().split('\n');
    const tracks = [];
    for (const line of lines) {
      const match = line.match(/^(\d{1,2}):(\d{2})\s+(.+)$/);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        tracks.push({
          title: match[3].trim(),
          startTimestamp: minutes * 60 + seconds,
        });
      }
    }
    return tracks;
  };

  const handleSplit = async (card: UploadCard) => {
    if (!card.audioFile) {
      toast.error("Please upload an audio file");
      return;
    }

    if (!card.trackList) {
      toast.error("Please provide a track list");
      return;
    }

    const tracks = parseTrackList(card.trackList);
    if (tracks.length === 0) {
      toast.error("Invalid track list format. Use: MM:SS Track Title");
      return;
    }

    updateCard(card.id, { isUploading: true });

    try {
      // Create album with tracks
      const album = await api.albums.create({
        title: card.albumTitle || card.audioFile.name.replace(/\.[^/.]+$/, ""),
        tracks,
      });

      // Upload file
      await api.upload.file(album.id, card.audioFile);

      // Trigger split
      await api.split.trigger(album.id, { tracks });

      toast.success("Album created and split started!");
      onAlbumCreated(album);

      // Reset card
      updateCard(card.id, {
        audioFile: null,
        trackList: "",
        albumTitle: "",
        isUploading: false,
      });

    } catch (error: any) {
      toast.error(error.message || "Failed to process album");
      updateCard(card.id, { isUploading: false });
    }
  };

  return (
    <Accordion
      type="single"
      collapsible
      value={isExpanded ? "upload" : ""}
      onValueChange={(value) => setIsExpanded(value === "upload")}
    >
      <AccordionItem value="upload" className="border rounded-lg">
        <AccordionTrigger className="px-4">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-500" />
            <span>Upload Audio File</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-4">
            {cards.map((card, index) => (
              <Card key={card.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Upload #{index + 1}</CardTitle>
                    {cards.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCard(card.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Dropzone */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      card.audioFile
                        ? "border-green-500 bg-green-50 dark:bg-green-950"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50"
                    }`}
                  >
                    {card.audioFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <Music className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="font-medium">{card.audioFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(card.audioFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer"
                        onClick={() => document.getElementById(`dropzone-${card.id}`)?.click()}
                      >
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Drag & drop or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground">
                          MP3, WAV, FLAC, OGG, M4A (max 500MB)
                        </p>
                      </div>
                    )}
                    <input
                      id={`dropzone-${card.id}`}
                      type="file"
                      className="hidden"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onDrop([file], card.id);
                        }
                      }}
                    />
                  </div>

                  {/* Track List */}
                  <div className="space-y-2">
                    <Label>Track List</Label>
                    <textarea
                      className="w-full h-24 px-3 py-2 text-sm border rounded-md bg-background"
                      placeholder={`00:00 Track 1\n03:45 Track 2\n07:30 Track 3`}
                      value={card.trackList}
                      onChange={(e) => updateCard(card.id, { trackList: e.target.value })}
                      disabled={card.isUploading}
                    />
                  </div>

                  {/* Album Title */}
                  <div className="space-y-2">
                    <Label>Album Title (optional)</Label>
                    <Input
                      placeholder="My Album"
                      value={card.albumTitle}
                      onChange={(e) => updateCard(card.id, { albumTitle: e.target.value })}
                      disabled={card.isUploading}
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={() => handleSplit(card)}
                    disabled={card.isUploading || !card.audioFile || !card.trackList}
                    className="w-full"
                  >
                    {card.isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Split Album
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}

            {/* Add Card Button */}
            <Button variant="outline" onClick={addCard} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Another Album
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
