
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LLMConfig, 
  KnowledgeNode, 
  NodeStatus, 
  QuizQuestion, 
  HistoryItem,
} from './types';
import { STORAGE_KEY_CONFIG, STORAGE_KEY_HISTORY, DEFAULT_LLM_CONFIG } from './constants';
import { LLMGateway } from './services/llm';
import { 
  Search, 
  Compass, 
  User, 
  Brain, 
  Sparkles, 
  Loader2, 
  Settings as SettingsIcon, 
  AlertCircle,
  Home,
  Clock,
  ChevronRight,
  Trash2
} from 'lucide-react';
import KnowledgeGraph from './components/KnowledgeGraph';
import QuizModule from './components/QuizModule';
import Settings from './components/Settings';

const App: React.FC = () => {
  // --- States ---
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [config, setConfig] = useState<LLMConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    return saved ? JSON.parse(saved) : DEFAULT_LLM_CONFIG;
  });
  
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'home' | 'graph' | 'quiz' | 'summary'>('home');
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [activeNode, setActiveNode] = useState<KnowledgeNode | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [summary, setSummary] = useState('');

  const gateway = useMemo(() => new LLMGateway(config), [config]);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  }, [history]);

  // --- Helpers ---
  const updateHistory = (id: string, topicName: string, updatedNodes: KnowledgeNode[]) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h.id !== id);
      return [{
        id,
        topic: topicName,
        nodes: updatedNodes,
        lastAccessed: Date.now()
      }, ...filtered].slice(0, 10); // Keep last 10
    });
  };

  const deleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const startJourney = async (existingHistory?: HistoryItem) => {
    if (!existingHistory && !topic.trim()) return;

    if (existingHistory) {
      setTopic(existingHistory.topic);
      setNodes(existingHistory.nodes);
      setCurrentSessionId(existingHistory.id);
      setActiveView('graph');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setLoadingText('AI 正在规划专属技能树...');
    
    try {
      const graphNodes = await gateway.generateGraph(topic, "");
      if (graphNodes.length === 0) throw new Error("未能生成知识图谱，请重试或检查配置。");
      
      const newId = `session_${Date.now()}`;
      setNodes(graphNodes);
      setCurrentSessionId(newId);
      updateHistory(newId, topic, graphNodes);
      setActiveView('graph');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '连接 AI 服务时出现问题。请检查网络或配置。');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (node: KnowledgeNode) => {
    setLoading(true);
    setErrorMessage(null);
    setLoadingText(`正在为「${node.label}」生成考题...`);
    try {
      const questions = await gateway.generateQuiz(node, topic);
      if (questions.length === 0) throw new Error("未能生成题目，请重试。");
      setActiveQuestions(questions);
      setActiveNode(node);
      setActiveView('quiz');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '生成题目失败。');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizFinish = async (correctCount: number) => {
    if (!activeNode || !currentSessionId) return;
    setLoading(true);
    setLoadingText('正在分析你的学习成果...');
    
    try {
      const stars = Math.min(3, Math.ceil((correctCount / activeQuestions.length) * 3));
      const summaryMsg = await gateway.generateSummary(correctCount, activeQuestions.length, activeNode.label);
      setSummary(summaryMsg);

      setNodes(prev => {
        const updated = prev.map(n => {
          if (n.id === activeNode.id) {
            return { ...n, status: NodeStatus.COMPLETED, stars: Math.max(n.stars, stars) };
          }
          return n;
        });

        const currentIndex = updated.findIndex(n => n.id === activeNode.id);
        if (currentIndex !== -1 && currentIndex + 1 < updated.length) {
          const nextNode = updated[currentIndex + 1];
          if (nextNode.status === NodeStatus.LOCKED) {
            nextNode.status = NodeStatus.AVAILABLE;
          }
        }
        
        updateHistory(currentSessionId, topic, updated);
        return [...updated];
      });

      setActiveView('summary');
    } catch (err: any) {
      console.error(err);
      setSummary("完成了！表现出色。");
      setActiveView('summary');
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => {
    setActiveView('home');
    // We don't clear nodes/topic so user can "resume" if they just clicked home by accident,
    // but the Home view will prioritize the history list.
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden select-none">
      {/* Top Navbar */}
      <nav className="h-16 bg-white border-b px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={goHome}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform">
            <Brain className="text-white" size={18} />
          </div>
          <span className="text-xl font-black text-gray-800 tracking-tight">智图流</span>
        </div>
        <div className="flex items-center gap-2">
          {activeView !== 'home' && (
            <button 
              onClick={goHome}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 flex items-center gap-2 px-3"
            >
              <Home size={20} />
              <span className="text-sm font-bold hidden sm:inline">首页</span>
            </button>
          )}
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {activeView === 'home' && (
          <div className="flex-1 flex flex-col items-center justify-start p-6 overflow-y-auto pt-12 md:pt-20">
            <div className="max-w-2xl w-full space-y-12 animate-in fade-in slide-in-from-bottom duration-700">
              {/* Header Section */}
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <div className="absolute -inset-4 bg-blue-100 rounded-full blur-2xl opacity-50 animate-pulse" />
                  <Sparkles size={56} className="text-blue-600 relative" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">探索知识的流向</h1>
                  <p className="text-lg text-gray-500 font-medium">输入主题，AI 将为你即时构建可视化成长地图</p>
                </div>
              </div>
              
              {/* Search Section */}
              <div className="space-y-4">
                <div className="relative group">
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && startJourney()}
                    placeholder="Python、文艺复兴、量子力学..."
                    className="w-full p-6 pl-14 text-xl bg-white border-2 border-gray-100 rounded-3xl shadow-xl shadow-gray-100 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all group-hover:border-blue-200"
                  />
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" size={24} />
                  <button 
                    disabled={!topic || loading}
                    onClick={() => startJourney()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <ChevronRight size={24} />}
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-bold animate-in shake duration-300">
                    <AlertCircle size={20} />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* History Section */}
              {history.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock size={18} />
                      <span className="text-sm font-black uppercase tracking-widest">继续学习</span>
                    </div>
                    <span className="text-xs font-bold text-gray-300">{history.length}/10</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {history.map((item) => {
                      const completedCount = item.nodes.filter(n => n.status === NodeStatus.COMPLETED).length;
                      const progress = Math.round((completedCount / item.nodes.length) * 100);
                      const totalStars = item.nodes.reduce((acc, n) => acc + n.stars, 0);

                      return (
                        <div 
                          key={item.id}
                          onClick={() => startJourney(item)}
                          className="group bg-white p-5 rounded-[2rem] border-2 border-gray-100 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-50 transition-all cursor-pointer relative overflow-hidden"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-black text-gray-800 text-lg group-hover:text-blue-600 transition-colors line-clamp-1">{item.topic}</h3>
                            <button 
                              onClick={(e) => deleteHistory(e, item.id)}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-sm font-bold mb-4">
                            <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                              <Sparkles size={14} />
                              <span>{progress}% 已完成</span>
                            </div>
                            <span className="text-yellow-500">★ {totalStars}</span>
                          </div>
                          <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-1000" 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="flex flex-wrap justify-center gap-2 pb-12">
                {['JavaScript 入门', '文艺复兴史', '深度学习', '摄影基础'].map(t => (
                  <button 
                    key={t}
                    onClick={() => { setTopic(t); }}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-all"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'graph' && (
          <div className="flex-1 p-4 md:p-8 animate-in fade-in duration-500 flex flex-col gap-4">
            <div className="flex items-center gap-2">
               <button 
                onClick={goHome}
                className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-blue-600 transition-all bg-gray-100/50"
              >
                <ChevronRight className="rotate-180" size={24} />
              </button>
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest">当前路径: {topic}</div>
            </div>
            <KnowledgeGraph 
              topic={topic} 
              nodes={nodes} 
              onNodeClick={startQuiz}
            />
          </div>
        )}

        {activeView === 'summary' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500">
            <div className="max-w-lg w-full bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl space-y-8 border-4 border-blue-50">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-blue-200">
                <TrophyIcon className="text-white" size={48} />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-gray-900">关卡结算</h2>
                <div className="p-6 bg-gray-50 rounded-3xl text-left font-medium leading-relaxed text-gray-700 italic border border-gray-100">
                  "{summary}"
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setActiveView('graph')}
                  className="w-full py-4 bg-blue-600 text-white text-lg font-black rounded-3xl shadow-xl shadow-blue-100 active:scale-[0.98] transition-all"
                >
                  继续下一关
                </button>
                <button 
                  onClick={goHome}
                  className="w-full py-4 bg-gray-100 text-gray-600 text-lg font-black rounded-3xl active:scale-[0.98] transition-all"
                >
                  返回首页查看记录
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <Brain className="absolute inset-0 m-auto text-blue-600 animate-pulse" size={24} />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-black text-gray-800 animate-bounce">{loadingText}</p>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">AI 正在飞速运转中</p>
          </div>
        </div>
      )}

      {/* Quiz Overlay */}
      {activeView === 'quiz' && activeNode && (
        <QuizModule 
          node={activeNode} 
          questions={activeQuestions} 
          onFinish={handleQuizFinish}
          onClose={() => setActiveView('graph')}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <Settings 
          config={config} 
          onUpdate={(newConfig) => {
            setConfig(newConfig);
            localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
          }} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
};

// Helper Icons
const TrophyIcon = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export default App;
