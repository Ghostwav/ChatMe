import { useState } from "react";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

export default function Login() {
  const [username, setUsername] = useState("");
  const { user } = useAuth();
  const loginMutation = useLogin();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  if (user) {
    setLocation("/");
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    loginMutation.mutate(
      { data: { username: username.trim(), displayName: username.trim() } },
      {
        onSuccess: async (data: any) => {
          if (data?.token) {
            localStorage.setItem("chatme_token", data.token);
          }
          await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          await queryClient.refetchQueries({ queryKey: getGetMeQueryKey() });
          setLocation("/");
        },
        onError: (err: any) => {
          toast({
            title: "Login failed",
            description: err.message || "An error occurred",
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-[#111b21]">
      <Card className="w-full max-w-md shadow-lg border-0 dark:bg-[#202c33] dark:text-[#e9edef]">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4 text-[#00a884]">
            <MessageSquare size={48} />
          </div>
          <CardTitle className="text-2xl font-semibold">Welcome to ChatMe</CardTitle>
          <CardDescription className="dark:text-[#8696a0]">
            Enter your username to get started. No password needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                disabled={loginMutation.isPending}
                className="w-full h-12 text-lg dark:bg-[#2a3942] dark:border-transparent dark:focus-visible:ring-[#00a884]"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-lg bg-[#00a884] hover:bg-[#008f6f] text-white"
              disabled={!username.trim() || loginMutation.isPending}
            >
              {loginMutation.isPending ? "Connecting..." : "Enter Chat"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-6 text-sm text-[#8696a0]">
        by <span className="font-semibold text-[#00a884]">Ghostwav</span>
      </p>
    </div>
  );
}
