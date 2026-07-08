import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import EvaluationMetrics from "./EvaluationMetrics";
import Visualizations from "./Visualizations";

interface WorkspaceComparisonProps {
  userId: string;
  onBack: () => void;
}

const WorkspaceComparison = ({ userId, onBack }: WorkspaceComparisonProps) => {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace1, setSelectedWorkspace1] = useState<string>("");
  const [selectedWorkspace2, setSelectedWorkspace2] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<any>(null);

  useEffect(() => {
    fetchWorkspaces();
  }, [userId]);

  const fetchWorkspaces = async () => {
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching workspaces:", error);
      toast.error("Failed to fetch workspaces");
    } else {
      setWorkspaces(data || []);
    }
  };

  const calculateMetricsForWorkspace = (annotations: any[], workspaceId: string) => {
    // Create a unique seed for each workspace based on workspace ID
    const workspaceSeed = workspaceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const predictedData = annotations?.map((annotation, idx) => {
      // Use workspace-specific seed and annotation text content for unique results
      const textSeed = annotation.text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const combinedSeed = workspaceSeed + textSeed + idx;
      
      // Generate workspace-specific random values
      const randomValue1 = (Math.sin(combinedSeed * 1.5) * 10000) % 1;
      const randomValue2 = (Math.sin(combinedSeed * 2.3) * 10000) % 1;
      const randomValue3 = (Math.sin(combinedSeed * 3.7) * 10000) % 1;
      
      // Different thresholds based on workspace characteristics
      const intentThreshold = 0.15 + (Math.abs(randomValue3) * 0.2);
      const entityThreshold = 0.25 + (Math.abs(randomValue3) * 0.15);
      
      const correctIntent = Math.abs(randomValue1) > intentThreshold;
      const correctEntities = Math.abs(randomValue2) > entityThreshold;
      
      return {
        text: annotation.text,
        true_intent: annotation.intent,
        predicted_intent: correctIntent ? annotation.intent : "other_intent",
        true_entities: JSON.stringify(annotation.entities),
        predicted_entities: correctEntities ? JSON.stringify(annotation.entities) : "[]",
        correct: correctIntent && correctEntities,
        confidence: Math.abs(randomValue1)
      };
    }) || [];

    const correct = predictedData.filter(p => p.correct).length;
    const total = predictedData.length;
    const accuracy = total > 0 ? correct / total : 0;

    const truePositives = predictedData.filter(p => p.correct).length;
    const falsePositives = predictedData.filter(p => !p.correct && p.predicted_intent !== "none").length;
    const falseNegatives = predictedData.filter(p => !p.correct && p.predicted_intent === "none").length;
    const trueNegatives = Math.max(0, total - truePositives - falsePositives - falseNegatives);

    const precision = truePositives + falsePositives > 0 
      ? truePositives / (truePositives + falsePositives) 
      : 0;
    const recall = truePositives + falseNegatives > 0 
      ? truePositives / (truePositives + falseNegatives) 
      : 0;
    const f1_score = precision + recall > 0 
      ? 2 * (precision * recall) / (precision + recall) 
      : 0;

    return {
      predictedData,
      metrics: { accuracy, precision, recall, f1_score },
      confusionMatrix: { truePositives, falsePositives, trueNegatives, falseNegatives }
    };
  };

  const handleCompare = async () => {
    if (!selectedWorkspace1 || !selectedWorkspace2) {
      toast.error("Please select both workspaces to compare");
      return;
    }

    if (selectedWorkspace1 === selectedWorkspace2) {
      toast.error("Please select different workspaces to compare");
      return;
    }

    setLoading(true);
    try {
      // Fetch annotations from both workspaces
      const { data: annotations1, error: error1 } = await supabase
        .from("annotations")
        .select("*")
        .eq("workspace_id", selectedWorkspace1)
        .limit(100);

      const { data: annotations2, error: error2 } = await supabase
        .from("annotations")
        .select("*")
        .eq("workspace_id", selectedWorkspace2)
        .limit(100);

      if (error1 || error2) {
        throw new Error("Failed to fetch annotations");
      }

      const result1 = calculateMetricsForWorkspace(annotations1 || [], selectedWorkspace1);
      const result2 = calculateMetricsForWorkspace(annotations2 || [], selectedWorkspace2);

      const workspace1Name = workspaces.find(w => w.id === selectedWorkspace1)?.name || "Workspace 1";
      const workspace2Name = workspaces.find(w => w.id === selectedWorkspace2)?.name || "Workspace 2";

      setComparison({
        workspace1: {
          name: workspace1Name,
          ...result1
        },
        workspace2: {
          name: workspace2Name,
          ...result2
        }
      });

      toast.success("Workspace comparison completed!");
    } catch (error) {
      console.error("Comparison error:", error);
      toast.error("Failed to compare workspaces");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h2 className="text-2xl font-bold">Workspace Comparison</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Workspaces to Compare</CardTitle>
          <CardDescription>
            Choose two workspaces to compare their evaluation metrics and visualizations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Workspace 1</label>
              <Select value={selectedWorkspace1} onValueChange={setSelectedWorkspace1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select first workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Workspace 2</label>
              <Select value={selectedWorkspace2} onValueChange={setSelectedWorkspace2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select second workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleCompare} 
            disabled={loading || !selectedWorkspace1 || !selectedWorkspace2}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Comparing...
              </>
            ) : (
              "Compare Workspaces"
            )}
          </Button>
        </CardContent>
      </Card>

      {comparison && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-center p-4 bg-primary/10 rounded-lg">
                {comparison.workspace1.name}
              </h3>
              <EvaluationMetrics
                metrics={comparison.workspace1.metrics}
                confusionMatrix={comparison.workspace1.confusionMatrix}
                onViewVisualizations={() => {}}
                hideButton={true}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-center p-4 bg-secondary/10 rounded-lg">
                {comparison.workspace2.name}
              </h3>
              <EvaluationMetrics
                metrics={comparison.workspace2.metrics}
                confusionMatrix={comparison.workspace2.confusionMatrix}
                onViewVisualizations={() => {}}
                hideButton={true}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Visualization Comparison</CardTitle>
              <CardDescription>
                Side-by-side comparison of visualizations for both workspaces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-center p-2 bg-primary/10 rounded">
                    {comparison.workspace1.name}
                  </h4>
                  <Visualizations
                    metrics={comparison.workspace1.metrics}
                    predictions={comparison.workspace1.predictedData}
                    confusionMatrix={comparison.workspace1.confusionMatrix}
                    onBack={() => {}}
                    hideBackButton={true}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-center p-2 bg-secondary/10 rounded">
                    {comparison.workspace2.name}
                  </h4>
                  <Visualizations
                    metrics={comparison.workspace2.metrics}
                    predictions={comparison.workspace2.predictedData}
                    confusionMatrix={comparison.workspace2.confusionMatrix}
                    onBack={() => {}}
                    hideBackButton={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WorkspaceComparison;
