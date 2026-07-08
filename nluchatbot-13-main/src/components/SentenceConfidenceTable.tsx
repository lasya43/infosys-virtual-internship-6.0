import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, Filter, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Prediction {
  text: string;
  true_intent: string | null;
  predicted_intent: string;
  confidence_score: number;
  correct: boolean;
}

interface SentenceConfidenceTableProps {
  predictions: Prediction[];
  onTransferToActiveLearning: (sentences: Prediction[]) => void;
}

const SentenceConfidenceTable = ({ predictions, onTransferToActiveLearning }: SentenceConfidenceTableProps) => {
  const [selectedSentences, setSelectedSentences] = useState<Set<number>>(new Set());
  const [filterThreshold, setFilterThreshold] = useState<string>("all");

  const getConfidenceColor = (score: number) => {
    if (score < 0.3) return "bg-destructive text-destructive-foreground";
    if (score < 0.5) return "bg-orange-500 text-white";
    if (score < 0.6) return "bg-yellow-500 text-black";
    return "bg-green-500 text-white";
  };

  const filteredPredictions = predictions.filter(p => {
    if (filterThreshold === "all") return true;
    if (filterThreshold === "60") return p.confidence_score < 0.6;
    if (filterThreshold === "50") return p.confidence_score < 0.5;
    return true;
  });

  const lowConfidenceSentences = predictions.filter(p => p.confidence_score < 0.6);

  const toggleSelection = (index: number) => {
    const newSelection = new Set(selectedSentences);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedSentences(newSelection);
  };

  const selectAllLowConfidence = () => {
    const newSelection = new Set<number>();
    filteredPredictions.forEach((p, idx) => {
      if (p.confidence_score < 0.6) {
        newSelection.add(idx);
      }
    });
    setSelectedSentences(newSelection);
  };

  const handleTransfer = () => {
    const sentencesToTransfer = Array.from(selectedSentences).map(idx => filteredPredictions[idx]);
    onTransferToActiveLearning(sentencesToTransfer);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Sentence Confidence Scores
            </CardTitle>
            <CardDescription>
              View confidence scores for each sentence. Select low-confidence sentences to transfer to Active Learning.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterThreshold} onValueChange={setFilterThreshold}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by confidence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentences</SelectItem>
                <SelectItem value="60">Below 60%</SelectItem>
                <SelectItem value="50">Below 50%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold">{predictions.length}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Low Confidence (&lt;60%): </span>
              <span className="font-semibold text-yellow-600">{lowConfidenceSentences.length}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Selected: </span>
              <span className="font-semibold text-primary">{selectedSentences.size}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAllLowConfidence}>
              Select All &lt;60%
            </Button>
            <Button 
              size="sm" 
              onClick={handleTransfer}
              disabled={selectedSentences.size === 0}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Transfer to Active Learning
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Select</TableHead>
                <TableHead>Sentence</TableHead>
                <TableHead>True Intent</TableHead>
                <TableHead>Predicted Intent</TableHead>
                <TableHead className="text-center">Confidence</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPredictions.map((prediction, index) => (
                <TableRow 
                  key={index}
                  className={prediction.confidence_score < 0.6 ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedSentences.has(index)}
                      onCheckedChange={() => toggleSelection(index)}
                    />
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate font-medium">
                    {prediction.text}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{prediction.true_intent || "N/A"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{prediction.predicted_intent}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getConfidenceColor(prediction.confidence_score)}>
                      {(prediction.confidence_score * 100).toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {prediction.correct ? (
                      <Badge variant="default" className="bg-green-600">Correct</Badge>
                    ) : (
                      <Badge variant="destructive">Incorrect</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {lowConfidenceSentences.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              {lowConfidenceSentences.length} sentences have confidence below 60%. 
              Transfer them to Active Learning to improve model accuracy.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SentenceConfidenceTable;
