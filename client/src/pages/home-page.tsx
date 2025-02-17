import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Photo } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Heart, LogOut, Upload, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPhotoSchema } from "@shared/schema";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertPhotoSchema),
    defaultValues: {
      description: "",
      takenAt: new Date().toISOString(),
    },
  });

  const { data: photos, isLoading } = useQuery<Photo[]>({
    queryKey: ["/api/photos"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/photos', {
        method: 'POST',
        body: data,
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Erro ao fazer upload');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      setIsUploadOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Foto enviada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao enviar a foto: " + error.message,
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
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

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
                  Upload Photo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload a New Photo</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={form.handleSubmit((data) => {
                    const formData = new FormData();
                    const photoInput = document.getElementById('photo') as HTMLInputElement;
                    if (!photoInput.files?.[0]) {
                      toast({
                        title: "Erro",
                        description: "Por favor selecione uma foto",
                        variant: "destructive"
                      });
                      return;
                    }
                    formData.append('photo', photoInput.files[0]);
                    formData.append('description', data.description);
                    formData.append('takenAt', data.takenAt);
                    uploadMutation.mutate(formData);
                  })}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="photo">Foto</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      placeholder="Descreva este momento..."
                      {...form.register("description")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="takenAt">Data</Label>
                    <Input
                      id="takenAt"
                      type="date"
                      {...form.register("takenAt")}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={uploadMutation.isPending}
                  >
                    Upload
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <span>Welcome, {user?.username}</span>
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos?.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <CardHeader className="p-0">
                <img
                  src={`/uploads/${photo.filename}`}
                  alt={photo.description}
                  className="w-full h-64 object-cover"
                />
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-lg">{photo.description}</CardTitle>
                <CardDescription>
                  {format(new Date(photo.takenAt), "MMMM d, yyyy")}
                </CardDescription>
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
                      if (confirm("Are you sure you want to delete this photo?")) {
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