import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Target, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface EvaluationMetricsProps {
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
  };
  confusionMatrix: {
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
  };
  onViewVisualizations: () => void;
  hideButton?: boolean;
}

const EvaluationMetrics = ({ metrics, confusionMatrix, onViewVisualizations, hideButton }: EvaluationMetricsProps) => {
  const metricItems = [
    {
      label: "Accuracy",
      value: metrics.accuracy,
      icon: Target,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10"
    },
    {
      label: "Precision",
      value: metrics.precision,
      icon: Zap,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10"
    },
    {
      label: "Recall",
      value: metrics.recall,
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10"
    },
    {
      label: "F1 Score",
      value: metrics.f1_score,
      icon: BarChart3,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-500/10"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluation Metrics</CardTitle>
        <CardDescription>
          Performance metrics for your trained model
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metricItems.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className={`p-6 rounded-lg border ${metric.bgColor}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                  <span className={`text-3xl font-bold ${metric.color}`}>
                    {(metric.value * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{metric.label}</p>
                  <Progress value={metric.value * 100} className="h-2" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">True Positives</p>
            <p className="text-2xl font-bold">{confusionMatrix.truePositives}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">False Positives</p>
            <p className="text-2xl font-bold">{confusionMatrix.falsePositives}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">True Negatives</p>
            <p className="text-2xl font-bold">{confusionMatrix.trueNegatives}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">False Negatives</p>
            <p className="text-2xl font-bold">{confusionMatrix.falseNegatives}</p>
          </div>
        </div>
      </CardContent>
      {!hideButton && (
        <CardFooter>
          <Button onClick={onViewVisualizations} className="w-full">
            View Detailed Visualizations
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default EvaluationMetrics;
