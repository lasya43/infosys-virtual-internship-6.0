import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle2 } from "lucide-react";

interface ModelSelectionProps {
  onModelSelect: (modelType: string, modelId: string) => void;
  trainedModels: any[];
}

const MODEL_TYPES = [
  {
    id: "spacy",
    name: "spaCy",
    description: "Fast and efficient NLU with neural networks",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400"
  },
  {
    id: "rasa",
    name: "RASA",
    description: "Open-source conversational AI framework",
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400"
  },
  {
    id: "bert",
    name: "BERT",
    description: "Transformer-based language understanding",
    color: "bg-green-500/10 text-green-700 dark:text-green-400"
  },
  {
    id: "distilbert",
    name: "DistilBERT",
    description: "Lighter and faster BERT variant",
    color: "bg-teal-500/10 text-teal-700 dark:text-teal-400"
  },
  {
    id: "roberta",
    name: "RoBERTa",
    description: "Robustly optimized BERT approach",
    color: "bg-orange-500/10 text-orange-700 dark:text-orange-400"
  },
  {
    id: "albert",
    name: "ALBERT",
    description: "A Lite BERT for self-supervised learning",
    color: "bg-pink-500/10 text-pink-700 dark:text-pink-400"
  },
  {
    id: "xlm-roberta",
    name: "XLM-RoBERTa",
    description: "Cross-lingual language understanding",
    color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
  },
  {
    id: "deberta",
    name: "DeBERTa",
    description: "Decoding-enhanced BERT with disentangled attention",
    color: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"
  },
  {
    id: "t5",
    name: "T5",
    description: "Text-to-Text Transfer Transformer",
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-400"
  },
  {
    id: "gpt2",
    name: "GPT-2",
    description: "Generative pre-trained transformer for NLU",
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
  }
];

const ModelSelection = ({ onModelSelect, trainedModels }: ModelSelectionProps) => {
  const [selectedType, setSelectedType] = useState<string>("");

  const getModelsForType = (type: string) => {
    return trainedModels.filter(m => m.model_type === type && m.status === "completed");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Model Type</CardTitle>
          <CardDescription>
            Choose the NLU framework for intent and entity predictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MODEL_TYPES.map((model) => {
              const availableModels = getModelsForType(model.id);
              return (
                <button
                  key={model.id}
                  onClick={() => setSelectedType(model.id)}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    selectedType === model.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Brain className="h-8 w-8 text-primary" />
                    {selectedType === model.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{model.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {model.description}
                  </p>
                  <Badge variant="secondary" className={model.color}>
                    {availableModels.length} trained models
                  </Badge>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedType && (
        <Card>
          <CardHeader>
            <CardTitle>Select Trained {MODEL_TYPES.find(m => m.id === selectedType)?.name} Model</CardTitle>
            <CardDescription>
              Choose from your trained models to generate predictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getModelsForType(selectedType).map((model) => (
                <div
                  key={model.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-primary transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{model.model_name}</h4>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      <span>Accuracy: {(model.accuracy * 100).toFixed(1)}%</span>
                      <span>Samples: {model.training_data_count}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => onModelSelect(selectedType, model.id)}
                    variant="default"
                  >
                    Use Model
                  </Button>
                </div>
              ))}
              {getModelsForType(selectedType).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No trained models available for this type</p>
                  <p className="text-sm mt-2">Train a model first in the Model Training tab</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModelSelection;
