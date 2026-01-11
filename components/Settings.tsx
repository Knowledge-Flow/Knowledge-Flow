
import React from 'react';
import { LLMConfig, LLMProvider, UserLevel } from '../types';
import { Settings as SettingsIcon, X, Info, Moon, Sun, Volume2, VolumeX, GraduationCap, Cpu } from 'lucide-react';

interface SettingsProps {
  config: LLMConfig;
  onUpdate: (config: LLMConfig) => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onUpdate, onClose }) => {
  const levels: { value: UserLevel; label: string; desc: string }[] = [
    { value: 'beginner', label: '入门小白', desc: '基础概念，易于理解' },
    { value: 'intermediate', label: '进阶选手', desc: '核心原理，实战技巧' },
    { value: 'expert', label: '资深专家', desc: '底层逻辑，架构思维' }
  ];

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as LLMProvider;
    let newModel = config.model;
    
    // Auto-switch default model based on provider
    if (newProvider === 'deepseek') {
      newModel = 'deepseek-chat';
    } else if (newProvider === 'openai') {
      newModel = 'gpt-4o';
    } else if (newProvider === 'gemini') {
      newModel = 'gemini-3-pro-preview';
    }

    onUpdate({ 
      ...config, 
      provider: newProvider, 
      model: newModel 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] ${config.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="p-6 border-b border-gray-100/10 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <SettingsIcon className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold">偏好与引擎配置</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* 用户等级 */}
          <div className="space-y-3">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <GraduationCap size={14} /> 学习等级
            </label>
            <div className="grid grid-cols-1 gap-2">
              {levels.map((l) => (
                <button
                  key={l.value}
                  onClick={() => onUpdate({ ...config, userLevel: l.value })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    config.userLevel === l.value 
                      ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5' 
                      : 'border-transparent bg-gray-100/50 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-bold">{l.label}</div>
                  <div className="text-xs opacity-60">{l.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 交互开关 */}
          <div className="flex gap-4">
            <button 
              onClick={() => onUpdate({ ...config, theme: config.theme === 'light' ? 'dark' : 'light' })}
              className={`flex-1 p-4 rounded-2xl flex items-center justify-center gap-3 font-bold border-2 transition-all ${config.theme === 'dark' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-100 bg-gray-50'}`}
            >
              {config.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              {config.theme === 'dark' ? '暗黑模式' : '明亮模式'}
            </button>
            <button 
              onClick={() => onUpdate({ ...config, soundEnabled: !config.soundEnabled })}
              className={`flex-1 p-4 rounded-2xl flex items-center justify-center gap-3 font-bold border-2 transition-all ${config.soundEnabled ? 'border-green-500 bg-green-500/10' : 'border-gray-100 bg-gray-50'}`}
            >
              {config.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              音效{config.soundEnabled ? '已开' : '已关'}
            </button>
          </div>

          <hr className="opacity-10" />

          {/* AI 引擎设置 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Cpu size={14} /> 模型服务提供商
              </label>
              <select 
                value={config.provider}
                onChange={handleProviderChange}
                className={`w-full p-3 border-2 rounded-xl outline-none transition-all font-medium ${config.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}
              >
                <option value="gemini">Google Gemini (内置)</option>
                <option value="deepseek">DeepSeek (深度求索)</option>
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="ollama">Ollama (本地)</option>
              </select>
            </div>

            {/* 模型名称输入 (所有模式下均可修改) */}
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Model Name</label>
              <input 
                type="text"
                value={config.model || ''}
                onChange={(e) => onUpdate({ ...config, model: e.target.value })}
                className={`w-full p-3 border-2 rounded-xl outline-none transition-all ${config.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}
                placeholder="例如: deepseek-chat, gpt-4o"
              />
              <p className="text-[10px] opacity-50 px-1">
                {config.provider === 'deepseek' && '推荐: deepseek-chat (V3) 或 deepseek-reasoner (R1)'}
                {config.provider === 'openai' && '推荐: gpt-4o 或 gpt-3.5-turbo'}
                {config.provider === 'gemini' && '推荐: gemini-3-pro-preview'}
              </p>
            </div>

            {/* API Key */}
            {config.provider !== 'gemini' && config.provider !== 'ollama' && (
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">API Key</label>
                <input 
                  type="password"
                  value={config.apiKey || ''}
                  onChange={(e) => onUpdate({ ...config, apiKey: e.target.value })}
                  className={`w-full p-3 border-2 rounded-xl outline-none transition-all ${config.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}
                  placeholder={config.provider === 'deepseek' ? "ds-..." : "sk-..."}
                />
              </div>
            )}

            {/* Base URL (Optional) */}
            {config.provider !== 'gemini' && (
               <div className="space-y-2">
               <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Base URL (可选)</label>
               <input 
                 type="text"
                 value={config.baseUrl || ''}
                 onChange={(e) => onUpdate({ ...config, baseUrl: e.target.value })}
                 className={`w-full p-3 border-2 rounded-xl outline-none transition-all ${config.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}
                 placeholder={config.provider === 'deepseek' ? "https://api.deepseek.com" : "默认地址"}
               />
             </div>
            )}
          </div>

          <div className="pt-4 shrink-0">
            <button 
              onClick={onClose}
              className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all hover:bg-blue-700"
            >
              保存并返回
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
