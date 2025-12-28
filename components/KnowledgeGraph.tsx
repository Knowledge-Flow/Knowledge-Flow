
import React from 'react';
import { KnowledgeNode, NodeStatus } from '../types';
import { Star, Lock, PlayCircle, CheckCircle2 } from 'lucide-react';

interface KnowledgeGraphProps {
  topic: string;
  nodes: KnowledgeNode[];
  onNodeClick: (node: KnowledgeNode) => void;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ topic, nodes, onNodeClick }) => {
  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
      <div className="p-6 border-b flex justify-between items-center bg-white/80 backdrop-blur sticky top-0 z-10">
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">{topic}</h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100 uppercase">探索中</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12">
        <div className="relative max-w-3xl mx-auto flex flex-col items-center gap-16 py-12">
          {/* Vertical layout for mobile/simplicity, can be replaced by complex graph library */}
          {nodes.map((node, index) => {
            const isLocked = node.status === NodeStatus.LOCKED;
            const isCompleted = node.status === NodeStatus.COMPLETED;
            const isAvailable = node.status === NodeStatus.AVAILABLE;

            return (
              <div key={node.id} className="relative group w-full max-w-sm">
                {index < nodes.length - 1 && (
                  <div className={`absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-16 transition-colors duration-500 ${isCompleted ? 'bg-blue-400' : 'bg-gray-100'}`} />
                )}
                
                <button
                  disabled={isLocked}
                  onClick={() => onNodeClick(node)}
                  className={`
                    w-full relative z-10 p-6 rounded-3xl transition-all duration-300 text-left flex items-start gap-4 border-2
                    ${isLocked ? 'bg-gray-50 border-gray-100 opacity-60 grayscale cursor-not-allowed' : ''}
                    ${isAvailable ? 'bg-white border-blue-500 shadow-xl shadow-blue-100 active-node scale-105' : ''}
                    ${isCompleted ? 'bg-blue-50 border-blue-200' : ''}
                  `}
                >
                  <div className={`
                    p-3 rounded-2xl shrink-0
                    ${isLocked ? 'bg-gray-200 text-gray-400' : ''}
                    ${isAvailable ? 'bg-blue-600 text-white' : ''}
                    ${isCompleted ? 'bg-green-100 text-green-600' : ''}
                  `}>
                    {isLocked ? <Lock size={24} /> : isCompleted ? <CheckCircle2 size={24} /> : <PlayCircle size={24} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className={`font-bold text-lg truncate ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>
                        {node.label}
                      </h3>
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <Star key={s} size={14} className={node.stars >= s ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                        ))}
                      </div>
                    </div>
                    <p className={`text-sm line-clamp-2 ${isLocked ? 'text-gray-400' : 'text-gray-500'}`}>
                      {node.description}
                    </p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
