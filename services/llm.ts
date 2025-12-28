
import { GoogleGenAI, Type } from "@google/genai";
import { LLMConfig, KnowledgeNode, QuizQuestion, NodeStatus } from "../types";

export class LLMGateway {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  private async callProvider(prompt: string, jsonMode: boolean = false): Promise<string> {
    if (this.config.provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: this.config.model,
        contents: prompt,
        config: {
          temperature: this.config.temperature,
          responseMimeType: jsonMode ? "application/json" : undefined,
        }
      });
      return response.text || "";
    }

    let baseUrl = this.config.baseUrl || "";
    if (this.config.provider === 'openai' && !baseUrl) baseUrl = "https://api.openai.com/v1";
    if (this.config.provider === 'deepseek' && !baseUrl) baseUrl = "https://api.deepseek.com/v1";
    if (this.config.provider === 'ollama' && !baseUrl) baseUrl = "http://localhost:11434/v1";
    if (this.config.provider === 'lmstudio' && !baseUrl) baseUrl = "http://localhost:1234/v1";

    const payload = {
      model: this.config.model,
      