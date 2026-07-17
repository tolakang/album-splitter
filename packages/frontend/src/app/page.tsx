"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, RefreshCw, Loader2, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { YouTubeSection } from "@/components/youtube-section";
import { FileUploadSection } from "@/components/file-upload-section";
import { AlbumCard } from "@/components/album-card";
import { api } from "@/lib/api";
import { Album } from "@/types";
import { toast } from "sonner";

export default function Home() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, setTheme } = useTheme();

  const fetchAlbums = async () => {
    try {
      const data = await api.albums.list();
      setAlbums(data);
    } catch (error) {
      toast.error("Failed to fetch albums");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchAlbums, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAlbumCreated = (album: Album) => {
    setAlbums((prev) => [album, ...prev]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Album Splitter</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Upload Sections */}
          <div className="space-y-4">
            <YouTubeSection onAlbumCreated={handleAlbumCreated} />
            <FileUploadSection onAlbumCreated={handleAlbumCreated} />
          </div>

          {/* Albums List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Albums</h2>
              <Button variant="outline" size="sm" onClick={fetchAlbums}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : albums.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Music className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">
                    No albums yet. Upload a file or paste a YouTube URL to get started!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {albums.map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    onRefresh={fetchAlbums}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          Album Splitter — Split audio albums into individual tracks
        </div>
      </footer>
    </div>
  );
}
