import { ShieldAlert, Fingerprint, Crosshair, AlertTriangle, Cpu, BrainCircuit } from 'lucide-react';
import { ForensicResult } from '../services/TelemetryProcessor';

interface ForensicOutputProps {
    result: ForensicResult;
}

export default function ForensicOutput({ result }: ForensicOutputProps) {
    let colorConfig = { border: 'border-slate-800', bg: 'bg-slate-900/50', text: 'text-slate-400', icon: AlertTriangle };
    
    switch (result.category) {
        case 'MILITARY_LEAK':
            colorConfig = { border: 'border-blue-500/50', bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Crosshair };
            break;
        case 'USER_LEAK':
            colorConfig = { border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: Fingerprint };
            break;
        case 'COMMAND_LEAK':
            colorConfig = { border: 'border-red-500/50', bg: 'bg-red-500/10', text: 'text-red-400', icon: ShieldAlert };
            break;
        default:
            break;
    }

    const Icon = colorConfig.icon;
    const authPercent = Math.round((result.authenticityIndex || 0) * 100);

    return (
        <div className={`p-6 rounded-2xl border ${colorConfig.border} ${colorConfig.bg} mt-6 backdrop-blur-sm box-glow`}>
           <div className="flex items-center gap-3 mb-4 border-b border-inherit pb-4">
              <Icon className={colorConfig.text} size={24} />
              <h3 className={`text-lg font-mono font-bold tracking-widest uppercase ${colorConfig.text}`}>
                 {result.category !== 'UNKNOWN' ? result.category : 'CORRUPT_PAYLOAD'}
              </h3>
           </div>
           
           <div className="mb-6 bg-slate-950/50 rounded-xl p-4 border border-cyan-900/10">  
             <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-2">
                    <Cpu size={12} className="text-cyan-500"/> Layer 1: Authenticity Index
                 </span>
                 <span className="text-xs font-mono font-bold text-cyan-400">{authPercent}%</span>
             </div>
             <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                 <div className="bg-cyan-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${authPercent}%` }} />
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                  <p className="text-[10px] uppercase font-mono text-slate-500">Sensitivity</p>
                  <p className={`text-sm font-bold font-mono ${colorConfig.text}`}>{result.sensitivity}</p>
              </div>
              <div>
                  <p className="text-[10px] uppercase font-mono text-slate-500">Confidence</p>
                  <p className={`text-sm font-bold font-mono ${result.confidenceScore === 0 ? 'text-red-400' : 'text-white'}`}>
                      {((result.confidenceScore || 0) * 100).toFixed(0)}%
                  </p>
              </div>
              <div className="col-span-2">
                  <p className="text-[10px] uppercase font-mono text-slate-500">Detected Signature</p>
                  <p className="text-sm font-mono text-slate-300">{result.detectedPattern}</p>
              </div>
           </div>

           {result.aiAnalysis && (
               <div className="mb-6 bg-indigo-950/30 rounded-xl p-4 border border-indigo-500/20">
                  <div className="flex items-center gap-2 mb-3">
                      <BrainCircuit size={14} className="text-indigo-400" />
                      <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold">Layer 2: AI Contextual Analysis</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                          <p className="text-[9px] uppercase font-mono text-slate-500">Leak Type</p>
                          <p className="text-xs font-mono text-indigo-200">{result.aiAnalysis.leakType}</p>
                      </div>
                      <div>
                          <p className="text-[9px] uppercase font-mono text-slate-500">AI Severity</p>
                          <p className="text-xs font-mono text-indigo-200">{result.aiAnalysis.severity}</p>
                      </div>
                  </div>
                  <div>
                      <p className="text-[9px] uppercase font-mono text-slate-500">Deep Analysis</p>
                      <p className="text-xs font-mono text-slate-300 mt-1 leading-relaxed">{result.aiAnalysis.analysis}</p>
                  </div>
               </div>
           )}

           <div>
               <p className="text-[10px] uppercase font-mono text-slate-500 mb-1 flex justify-between">
                  <span>Raw Dump</span>
                  {result.layerStatus === 'LAYER2_FAILED' && <span className="text-amber-500 italic">Ollama unreachable - Layer 2 Failed</span>}
               </p>
               <p className="text-xs font-mono text-slate-600 break-all bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                   {result.rawDump}
               </p>
           </div>
        </div>
    );
}
