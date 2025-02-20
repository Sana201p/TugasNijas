import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Photo } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Heart, LogOut, Upload, Trash2, User } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: photos, isLoading } = useQuery<(Photo & { username: string })[]>({
    queryKey: ["/api/photos"],
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Selecione uma foto');

      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('description', description || 'Sem descrição');

      const res = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      setIsUploadOpen(false);
      setDescription("");
      setSelectedFile(null);
      toast({
        title: "Sucesso",
        description: "Foto enviada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (photoId: number) => {
      await apiRequest("DELETE", `/api/photos/${photoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      toast({
        title: "Sucesso",
        description: "Foto deletada com sucesso",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const res = await apiRequest("POST", `/api/photos/${photoId}/like`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Por favor selecione uma foto",
        variant: "destructive"
      });
      return;
    }
    uploadMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">School Timeline</h1>
          <div className="flex items-center gap-4">
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Foto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload de Nova Foto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="photo">Foto</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      placeholder="Descreva este momento..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleUpload}
                    className="w-full"
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? "Enviando..." : "Upload"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <span>Bem-vindo, {user?.username}</span>
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos?.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-0">
                <div className="flex items-center gap-2">
                  <Avatar>
                    <User className="h-4 w-4" />
                  </Avatar>
                  <span className="font-medium">{photo.username}</span>
                </div>
              </CardHeader>
              <CardContent className="p-0 mt-4">
                <img
                  src={`/uploads/${photo.filename}`}
                  alt={photo.description}
                  className="w-full h-64 object-cover"
                />
                <div className="p-4">
                  <CardTitle className="text-lg">{photo.description}</CardTitle>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => likeMutation.mutate(photo.id)}
                  disabled={likeMutation.isPending}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  {photo.likes} likes
                </Button>
                {photo.userId === user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Tem certeza que deseja deletar esta foto?")) {
                        deleteMutation.mutate(photo.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}