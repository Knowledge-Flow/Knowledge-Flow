
import { GoogleGenAI, Type } from "@google/genai";
import { LLMConfig, KnowledgeNode, QuizQuestion, NodeStatus, GraphMode } from "../types";

export class LLMGateway {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * Robustly extract JSON from potentially messy LLM output.
   * Handles Markdown code blocks, DeepSeek <think> tags, and surrounding text.
   */
  private extractJson(text: string): string {
    // 1. Remove <think>...</think> blocks (DeepSeek R1 specific)
    // Using a non-greedy replace for potential multiple blocks or multiline
    let cleanText = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    // 2. Remove Markdown code blocks if present
    cleanText = cleanText.replace(/```json/gi, "").replace(/```/g, "").trim();

    // 3. Find the first valid JSON start character ('{' or '[')
    const firstOpenBrace = cleanText.indexOf('{');
    const firstOpenBracket = cleanText.indexOf('[');
    
    let startIndex = -1;
    if (firstOpenBrace !== -1 && firstOpenBracket !== -1) {
      startIndex = Math.min(firstOpenBrace, firstOpenBracket);
    } else if (firstOpenBrace !== -1) {
      startIndex = firstOpenBrace;
    } else {
      startIndex = firstOpenBracket;
    }

    // 4. Find the last valid JSON end character ('}' or ']')
    const lastCloseBrace = cleanText.lastIndexOf('}');
    const lastCloseBracket = cleanText.lastIndexOf(']');
    const endIndex = Math.max(lastCloseBrace, lastCloseBracket);

    // If we found a valid range, extract it
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      return cleanText.substring(startIndex, endIndex + 1);
    }

    // Fallback: return the cleaned text and hope for the best
    return cleanText;
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
    // DeepSeek official base URL
    if (this.config.provider === 'deepseek' && !baseUrl) baseUrl = "https://api.deepseek.com"; 
    
    const isDeepSeek = this.config.provider === 'deepseek';

    const payload = {
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: this.config.temperature,
      // DeepSeek R1 (reasoner) does NOT support response_format: { type: 'json_object' }.
      // DeepSeek V3 (chat) does support it, but requires 'json' in prompt.
      // To ensure maximum compatibility across DeepSeek models without user intervention, 
      // we disable response_format for DeepSeek and rely on the extractJson method.
      response_format: (jsonMode && !isDeepSeek) ? { type: 'json_object' } : undefined
    };

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey || ''}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (error) {
      console.error("LLM Call Failed:", error);
      throw error;
    }
  }

  async generateGraph(topic: string, mode: GraphMode): Promise<KnowledgeNode[]> {
    const levelDesc = {
      beginner: "零基础，需要通俗易懂的解释",
      intermediate: "有一定的基础，希望深入核心原理",
      expert: "资深专家，侧重前沿技术和架构设计"
    }[this.config.userLevel];

    const modeInstructions = mode === 'mindmap' 
      ? `模式：思维导图（树状结构）。请生成一个清晰的知识树，核心主题为根节点，其下延伸出 2-3 个核心板块，每个板块再细分。`
      : `模式：闯关路径（线性结构）。请生成一个由浅入深的单向关卡序列。`;

    // Added stronger prompt instruction for DeepSeek/JSON compliance
    const prompt = `
      基于主题 "${topic}"，为 "${this.config.userLevel}" (${levelDesc}) 用户生成学习地图。
      ${modeInstructions}
      请务必只返回纯 JSON 数组格式，不要包含任何 Markdown 标记、代码块符号或额外的解释文字。
      JSON 字段包含: 
      id, label, description, dependencies, parentId, 
      examples (对象数组，每个包含 title, content, type['code'|'scenario'])。
      
      生成 6-8 个节点。
    `;

    try {
      const text = await this.callProvider(prompt, true);
      const jsonString = this.extractJson(text);
      const raw = JSON.parse(jsonString);
      
      if (!Array.isArray(raw)) throw new Error("Graph response is not an array");

      return raw.map((n: any, idx: number) => ({
        ...n,
        id: n.id || `node_${Date.now()}_${idx}`,
        status: (n.dependencies?.length === 0 || idx === 0) ? NodeStatus.AVAILABLE : NodeStatus.LOCKED,
        stars: 0,
        examples: n.examples || []
      }));
    } catch (e) {
      console.error("Graph Generation Failed:", e);
      throw e;
    }
  }

  async generateQuiz(node: KnowledgeNode, topic: string): Promise<QuizQuestion[]> {
    const prompt = `为主题 "${topic}" 的知识点 "${node.label}" 生成 3 道单选题。
    针对 ${this.config.userLevel} 等级。
    请务必只返回纯 JSON 数组格式，不要包含任何 Markdown 标记或 <think> 思考过程。
    JSON 结构: [{ "text": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "..." }]`;
    
    try {
      const text = await this.callProvider(prompt, true);
      const jsonString = this.extractJson(text);
      const raw = JSON.parse(jsonString);
      
      if (!Array.isArray(raw)) throw new Error("Quiz response is not an array");
      
      return raw;
    } catch (e) {
      console.error("Quiz Generation Failed:", e);
      throw e;
    }
  }

  async generateSummary(correctCount: number, total: number, nodeLabel: string): Promise<string> {
    const prompt = `用户完成了 "${nodeLabel}" 关卡的学习与测试。表现：答对 ${correctCount} 题（共 ${total} 题）。
    请根据其正确率给出一段极具启发性且准确的评价。
    - 如果满分，夸奖其掌握扎实。
    - 如果错了一些，指出这是一个进步的机会。
    - 如果全错，给予鼓励并建议重新阅读举例。
    评价字数控制在 50 字以内，直接输出纯文本，不带 Markdown。`;
    
    const text = await this.callProvider(prompt, false);
    // Clean up any potential DeepSeek R1 thinking traces even for plain text
    return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  }
}
