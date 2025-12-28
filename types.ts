
export enum NodeStatus {
  LOCKED = 'LOCKED',
  AVAILABLE = 'AVAILABLE',
  COMPLETED = 'COMPLETED',
}

export interface KnowledgeNode {
  id: string;
  label: string;
  description: string;
  status: NodeStatus;
  stars: number;
  dependencies: string[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GraphData {
  topic: string;
  nodes: KnowledgeNode[];
}

export interface HistoryItem {
  id: string;
  topic: string;
  nodes: KnowledgeNode[];
  lastAccessed: number;
}

export type LLMProvider = 'gemini' | 'openai' | 'ollama' | 'deepseek' | 'lmstudio';

export interface LLMConfig {
  provider: LLMProvider;
  baseUrl?: string;
  apiKey?: string;
  model: string;
  temperature: number;
}

export interface UserProgress {
  completedNodes: Record<string, { stars: number }>;
}
