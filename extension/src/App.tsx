import { useState } from "react";
import { useAnalyzeRepo, useAppConfig } from "@/hooks/useAnalyze";
import { RepoTree } from "@/components/RepoTree";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Github, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("");

  // 引入 Hooks
  const { data: config } = useAppConfig();
  const { mutate: analyze, isPending, data: result, error } = useAnalyzeRepo();

  const handleAnalyze = () => {
    if (!repoUrl) return;
    analyze({ repoURL: repoUrl, branch: branch || undefined });
  };

  return (
    <div className="w-[600px] min-h-[400px] p-4 bg-zinc-50/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Github className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight">GoLoc</h1>
        </div>
        {config && (
          <Badge variant="outline" className="text-zinc-400 font-normal">
            Max {config.max_repo_size_mb}MB
          </Badge>
        )}
      </div>

      {/* Input Section */}
      <Card className="mb-6 shadow-sm">
        <CardContent className="pt-6 flex gap-2">
          <div className="grid gap-2 flex-1">
            <Input
              placeholder="https://github.com/username/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Input
                placeholder="Branch (optional)"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-1/3 text-xs"
              />
            </div>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isPending || !repoUrl}
            className="h-auto w-24"
          >
            {isPending ? <Loader2 className="animate-spin" /> : "Analyze"}
          </Button>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-4 mb-4 text-sm text-red-500 bg-red-50 rounded-md border border-red-100">
          🚨 {error.message}
        </div>
      )}

      {/* Result Tree */}
      {
      result ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-end mb-2 px-1">
            <h2 className="font-semibold text-lg">{result.data.name}</h2>
            <div className="text-xs text-zinc-500">
              Total Lines: <span className="font-mono text-black">{result.data.stats.lines.toLocaleString()}</span>
            </div>
          </div>
          <RepoTree data={result.data} />
        </div>
      ) : (
        // Empty State
        !isPending && !error && (
          <div className="text-center py-12 text-zinc-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Enter a GitHub URL to start analyzing</p>
          </div>
        )
      )}
    </div>
  );
}

export default App;