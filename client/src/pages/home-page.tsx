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
import { Heart, LogOut } from "lucide-react";
import { format } from "date-fns";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  const { data: photos, isLoading } = useQuery<Photo[]>({
    queryKey: ["/api/photos"],
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
                  src={photo.imageUrl}
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
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
