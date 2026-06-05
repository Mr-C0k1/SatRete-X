/**
 * AIService: Local AI Intelligence integration
 * Intended to be run totally offline via Ollama in a secure installation.
 */
export class AIService {
  static async analyzeTelemetry(data: any): Promise<string> {
    // Structure a tactical prompt for the local LLM
    const prompt = `Analyze this incoming satellite telemetry securely decrypted via Kyber/AES: Temp: ${data.temperature}°C, Volt: ${data.voltage}V, Alt: ${data.altitude}km. Write a short, highly professional 1-sentence tactical summary report of the satellite health. Start with "AI REPORT:"`;
    
    try {
      // Connect to the locally hosted Ollama service
      const response = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistral', // Target model (ensure downloaded locally e.g. ollama run mistral)
          prompt: prompt,
          stream: false
        })
      });

      if (!response.ok) {
          throw new Error("Ollama Node Unreachable");
      }
      
      const json = await response.json();
      return json.response;
    } catch (error) {
      // Offline / Simulation fallback if Ollama isn't active
      return `AI REPORT: Target nominal. Environmental variables within expected operational thresholds. [OLLAMA_OFFLINE_MOCK]`;
    }
  }

  static async forensicContextualAnalysis(hexDump: string, layer1Category: string): Promise<{ leakType: string, severity: string, analysis: string } | null> {
    const systemPrompt = `You are a Senior Satellite Forensic Expert. Analyze the given intercept hex payload and Layer 1 classification. Respond ONLY with a valid JSON object matching this structure: {"leakType": "...", "severity": "...", "analysis": "..."}. Do not add any markdown formatting or extra text.`;
    const prompt = `${systemPrompt}\n\nHex Dump: ${hexDump}\nLayer 1 Category: ${layer1Category}`;

    try {
      const response = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistral',
          prompt: prompt,
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) {
          throw new Error("Ollama Node Unreachable");
      }
      
      const json = await response.json();
      const resultObj = JSON.parse(json.response);
      return {
        leakType: resultObj.leakType || 'Unknown Context',
        severity: resultObj.severity || 'Medium',
        analysis: resultObj.analysis || 'Fallback offline analysis due to hallucination.'
      };
    } catch (error) {
      console.warn("[AIService] Contextual Analysis failed:", error);
      return null;
    }
  }
}
