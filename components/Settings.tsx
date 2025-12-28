
import React from 'react';
import { LLMConfig, LLMProvider } from '../types';
import { Settings as SettingsIcon, X, Info } from 'lucide-react';

interface SettingsProps {
  config: LLMConfig;
  onUpdate: (config: LLMConfig) => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onUpdate, onClose }) => {
  const isGemini = config.provider === 'gemini';
  const isLocal = config.provider === 'ollama' || config.provider === 'lmstudio';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <SettingsIcon className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold">AI 模型引擎配置</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">服务提供商</label>
            <select 
              value={config.provider}
              onChange={(e) => {
                const p = e.target.value as LLMProvider;
                let defaultModel = "gemini-3-pro-preview";
                if (p === 'openai') defaultModel = "gpt-4o";
                if (p === 'deepseek') defaultModel = "deepseek-chat";
                if (p === 'ollama') defaultModel = "llama3:8b";
                if (p === 'lmstudio') defaultModel = "local-model";
                onUpdate({ ...config, provider: p, model: defaultModel });
              }}
              className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
            >
              <option value="gemini">Google Gemini (内置)</option>
              <option value="openai">OpenAI (ChatGPT)</option>
              <option value="deepseek">DeepSeek (深度求索)</option>
              <option value="ollama">Ollama (本地运行)</option>
              <option value="lmstudio">LM Studio (本地 API)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">模型名称</label>
            <input 
              type="text"
              value={config.model}
              onChange={(e) => onUpdate({ ...config, model: e.target.value })}
              className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              placeholder="e.g. gpt-4o, gemini-3-pro-preview"
            />
          </div>

          {!isGemini && (
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                {isLocal ? '服务器地址' : 'API 基址 (Base URL)'}
              </label>
              <input 
                type="text"
                value={config.baseUrl || ''}
                onChange={(e) => onUpdate({ ...config, baseUrl: e.target.value })}
                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                placeholder={isLocal ? "http://localhost:11434/v1" : "https://api.openai.com/v1"}
              />
            </div>
          )}

          {!isGemini && !isLocal && (
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">API Key / Access Token</label>
              <input 
                type="password"
                value={config.apiKey || ''}
                onChange={(e) => onUpdate({ ...config, apiKey: e.target.value })}
                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                placeholder="sk-..."
              />
            </div>
          )}

          {isGemini && (
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 items-start">
              <Info className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                Gemini 已通过平台预置。切换到其他服务需要您自行配置 API 地址与密钥。
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">创造性 (Temperature)</label>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{config.temperature}</span>
            </div>
            <input 
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => onUpdate({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="pt-4 shrink-0">
            <button 
              onClick={onClose}
              className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 active:scale-[0.98] transition-all hover:bg-blue-700"
            >
              应用配置并保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
