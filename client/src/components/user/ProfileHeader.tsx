import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Edit, User, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const profileUpdateSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  bio: z.string().max(500, "Bio must be 500 characters or less"),
  avatarUrl: z.string().url("Please enter a valid image URL").or(z.string().length(0)),
});

interface ProfileHeaderProps {
  user: {
    id: number;
    username: string;
    fullName: string;
    bio: string;
    avatarUrl: string;
    isPremium: boolean;
    isAuthor: boolean;
    email?: string;
  };
  isOwnProfile: boolean;
  isPremium: boolean;
  isAuthorPage?: boolean;
}

export default function ProfileHeader({ user, isOwnProfile, isPremium, isAuthorPage = false }: ProfileHeaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const form = useForm<z.infer<typeof profileUpdateSchema>>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: user.fullName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
    },
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileUpdateSchema>) => {
      const res = await apiRequest("PUT", `/api/users/${user.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditOpen(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: z.infer<typeof profileUpdateSchema>) => {
    updateProfileMutation.mutate(data);
  };
  
  return (
    <div className="bg-amber-50/80 rounded-lg border border-amber-500/30 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-amber-200 border-4 border-amber-500/30">
            <img 
              src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=D68C47&color=fff`} 
              alt={`${user.fullName}'s avatar`}
              className="w-full h-full object-cover"
            />
          </div>
          {isPremium && (
            <Badge className="absolute bottom-0 right-0 bg-gold-rich text-brown-dark border-2 border-white">
              <CheckCircle className="h-3 w-3 mr-1" /> Premium
            </Badge>
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h1 className="font-cinzel text-2xl md:text-3xl font-bold text-brown-dark">{user.fullName}</h1>
              <p className="text-gray-500">@{user.username}</p>
            </div>
            
            {isOwnProfile && (
              <div className="flex justify-center md:justify-end">
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-amber-500 text-brown-dark">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-amber-50 border-amber-500">
                    <DialogHeader>
                      <DialogTitle className="font-cinzel text-brown-dark">Edit Your Profile</DialogTitle>
                      <DialogDescription>
                        Make changes to your profile information.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-cinzel">Full Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Your name" 
                                  className="border-amber-500/50 focus:border-amber-500"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-cinzel">Bio</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell us about yourself..." 
                                  className="h-32 border-amber-500/50 focus:border-amber-500"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="avatarUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-cinzel">Avatar URL</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="https://example.com/your-avatar.jpg" 
                                  className="border-amber-500/50 focus:border-amber-500"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                            disabled={updateProfileMutation.isPending}
                          >
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
            <Badge variant="outline" className="bg-amber-50 border-amber-500 text-brown-dark">
              <User className="h-3 w-3 mr-1" />
              {isAuthorPage ? 'Author' : (user.isAuthor ? 'Author' : 'Reader')}
            </Badge>
            
            {user.isPremium && (
              <Badge className="bg-gold-rich text-brown-dark">
                Premium Member
              </Badge>
            )}
          </div>
          
          {user.bio ? (
            <p className="mt-4 text-gray-700 line-clamp-3 max-w-2xl">{user.bio}</p>
          ) : (
            <p className="mt-4 text-gray-500 italic max-w-2xl">
              {isOwnProfile 
                ? "You haven't added a bio yet. Click 'Edit Profile' to add one." 
                : `${user.fullName} hasn't added a bio yet.`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
