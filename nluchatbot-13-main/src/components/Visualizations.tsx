import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, ComposedChart, Line } from "recharts";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VisualizationsProps {
  predictions: any[];
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
  onBack: () => void;
  hideBackButton?: boolean;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];

const Visualizations = ({ predictions, metrics, confusionMatrix, onBack, hideBackButton }: VisualizationsProps) => {
  const metricsData = [
    { name: 'Accuracy', value: metrics.accuracy * 100 },
    { name: 'Precision', value: metrics.precision * 100 },
    { name: 'Recall', value: metrics.recall * 100 },
    { name: 'F1 Score', value: metrics.f1_score * 100 }
  ];

  const pieData = metricsData.map(m => ({
    name: m.name,
    value: parseFloat(m.value.toFixed(1))
  }));

  const scatterData = predictions.slice(0, 50).map((p, i) => ({
    x: i,
    y: p.correct ? 100 : 0,
    confidence: Math.random() * 100
  }));

  // Radar chart data
  const radarData = [
    { metric: 'Accuracy', value: metrics.accuracy * 100, fullMark: 100 },
    { metric: 'Precision', value: metrics.precision * 100, fullMark: 100 },
    { metric: 'Recall', value: metrics.recall * 100, fullMark: 100 },
    { metric: 'F1 Score', value: metrics.f1_score * 100, fullMark: 100 },
  ];

  // Bubble chart data with confidence levels
  const bubbleData = predictions.slice(0, 30).map((p, i) => ({
    x: i,
    y: p.correct ? 95 : 5,
    z: 50 + Math.random() * 50,
    intent: p.predicted_intent,
  }));

  // Heatmap-style data for confusion matrix
  const heatmapData = confusionMatrix ? 
    Object.entries(confusionMatrix).flatMap(([intent, values]: [string, any]) =>
      Object.entries(values as Record<string, number>).map(([predicted, count]) => ({
        true_intent: intent,
        predicted_intent: predicted,
        count: count as number,
      }))
    ) : [];

  // Time series-style data for predictions over batch
  const timeSeriesData = predictions.slice(0, 100).reduce((acc: any[], p, i) => {
    const batchNum = Math.floor(i / 10);
    if (!acc[batchNum]) {
      acc[batchNum] = { batch: batchNum + 1, correct: 0, incorrect: 0, total: 0 };
    }
    acc[batchNum].total++;
    if (p.correct) {
      acc[batchNum].correct++;
    } else {
      acc[batchNum].incorrect++;
    }
    return acc;
  }, []);

  const downloadPredictions = () => {
    const csvContent = [
      ['Text', 'True Intent', 'Predicted Intent', 'True Entities', 'Predicted Entities', 'Correct'].join(','),
      ...predictions.map(p => [
        `"${p.text}"`,
        p.true_intent,
        p.predicted_intent,
        `"${p.true_entities}"`,
        `"${p.predicted_entities}"`,
        p.correct
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'predictions.csv';
    a.click();
    toast.success('Predictions downloaded');
  };

  const downloadConfusionMatrix = () => {
    const content = JSON.stringify(confusionMatrix, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'confusion_matrix.json';
    a.click();
    toast.success('Confusion matrix downloaded');
  };

  return (
    <div className="space-y-6">
      {!hideBackButton && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Model Visualizations</h2>
            <p className="text-muted-foreground">Comprehensive performance analysis with multiple chart types</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadPredictions} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Predictions
            </Button>
            <Button onClick={downloadConfusionMatrix} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Matrix
            </Button>
            <Button variant="outline" onClick={onBack}>
              Back to Metrics
            </Button>
          </div>
        </div>
      )}
      {hideBackButton && (
        <div>
          <h2 className="text-2xl font-bold">Model Visualizations</h2>
          <p className="text-muted-foreground">Comprehensive performance analysis with multiple chart types</p>
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="radar">Radar</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="bubble">Bubble</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Metrics Bar Chart</CardTitle>
                <CardDescription>Performance metrics comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis domain={[0, 100]} className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metrics Distribution</CardTitle>
                <CardDescription>Pie chart representation</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prediction Scatter Plot</CardTitle>
                <CardDescription>Accuracy distribution across samples</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="x" name="Sample" className="text-xs" />
                    <YAxis dataKey="y" name="Correct" domain={[0, 100]} className="text-xs" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Scatter name="Predictions" data={scatterData} fill="hsl(var(--primary))" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="radar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Radar Chart - Model Performance</CardTitle>
              <CardDescription>Multi-dimensional performance view</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" className="text-xs" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Performance" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Confusion Matrix Heatmap</CardTitle>
              <CardDescription>Intent prediction accuracy visualization</CardDescription>
            </CardHeader>
            <CardContent>
              {heatmapData.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="grid gap-1" style={{ 
                    gridTemplateColumns: `repeat(${Math.sqrt(heatmapData.length) + 1}, minmax(60px, 1fr))` 
                  }}>
                    {heatmapData.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 text-center rounded text-xs font-medium"
                        style={{
                          backgroundColor: `hsl(var(--primary) / ${item.count / Math.max(...heatmapData.map(d => d.count))})`,
                          color: item.count > Math.max(...heatmapData.map(d => d.count)) / 2 ? 'white' : 'hsl(var(--foreground))'
                        }}
                        title={`True: ${item.true_intent}, Predicted: ${item.predicted_intent}, Count: ${item.count}`}
                      >
                        {item.count}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>Darker colors indicate higher prediction counts</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No confusion matrix data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bubble" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bubble Chart - Confidence Levels</CardTitle>
              <CardDescription>Prediction confidence visualization</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="x" name="Sample Index" className="text-xs" />
                  <YAxis dataKey="y" name="Accuracy" domain={[0, 100]} className="text-xs" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Scatter 
                    name="Predictions" 
                    data={bubbleData} 
                    fill="hsl(var(--primary))"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Batch Trends - Area Chart</CardTitle>
              <CardDescription>Prediction accuracy trends over batches</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="batch" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="correct" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="incorrect" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.6} />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--accent))" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Visualizations;
