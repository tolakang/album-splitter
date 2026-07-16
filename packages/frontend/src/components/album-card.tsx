"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Clock, FileAudio } from "lucide-react";
import { Album, GeneratedFile } from "@/types";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface AlbumCardProps {
  album: Album;
  onRefresh: () => void;
}

export function AlbumCard({ album, onRefresh }: AlbumCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500';
      case 'DOWNLOADING': case 'PARSING': case 'SPLITTING': return 'bg-blue-500 animate-pulse';
      case 'COMPLETED': return 'bg-green-500';
      case 'FAILED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m remaining`;
  };

  const handleDownloadZip = () => {
    window.open(api.download.zip(album.id), '_blank');
  };

  const handleDelete = async () => {
    try {
      await api.albums.delete(album.id);
      toast.success('Album deleted');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete album');
    }
  };

  const handleDownloadFile = (fileId: string) => {
    window.open(api.download.file(fileId), '_blank');
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await api.download.deleteFile(fileId);
      toast.success('File deleted');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileAudio className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {album.title || album.youtubeUrl || 'Untitled Album'}
            </CardTitle>
          </div>
          <Badge className={getStatusColor(album.status)}>
            {album.status}
          </Badge>
        </div>
        {album.youtubeUrl && (
          <CardDescription className="truncate">
            {album.youtubeUrl}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{album.progress}%</span>
          </div>
          <Progress value={album.progress} className="h-2" />
        </div>

        {/* Time remaining */}
        {album.expiresAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {getTimeRemaining(album.expiresAt)}
          </div>
        )}

        {/* Generated Files */}
        {album.generatedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Generated Files:</p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {album.generatedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{file.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(Number(file.size))}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadFile(file.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {album.status === 'COMPLETED' && album.generatedFiles.length > 0 && (
          <div className="flex gap-2">
            <Button onClick={handleDownloadZip} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download ZIP
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
