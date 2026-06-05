import { OperationalStatus, ThreatLevel, HardwareMode } from '../types';
import { CryptoEngine } from './CryptoEngine';
import { AIService } from './AIService';

export interface ParsedTelemetryData {
    temperature: number;
    voltage: number;
    altitude: number;
    vectorX: string;
    vectorY: string;
    vectorZ: string;
}

export interface ProcessingResult {
    status: OperationalStatus;
    threatLevel: ThreatLevel;
    description: string;
}

export interface ForensicResult {
    category: 'MILITARY_LEAK' | 'USER_LEAK' | 'COMMAND_LEAK' | 'UNKNOWN';
    sensitivity: 'High' | 'Medium' | 'Critical' | 'Low';
    confidenceScore: number;
    detectedPattern: string;
    rawDump: string;
    authenticityIndex?: number;
    aiAnalysis?: {
        leakType: string;
        severity: string;
        analysis: string;
    };
    layerStatus?: 'LAYER1_ONLY' | 'LAYER2_COMPLETE' | 'LAYER2_FAILED';
}

/**
 * TelemetryProcessor: Handles raw HEX data processing and high-level 
 * state transitions between GROUND and SPACE segments.
 */
export class TelemetryProcessor {
  private lastDataTime: number = 0;
  private readonly TIMEOUT_MS = 5000;
  private crypto: CryptoEngine;
  private mode: HardwareMode;

  constructor(mode: HardwareMode = 'SIMULATION_MODE') {
    this.crypto = new CryptoEngine(mode);
    this.mode = mode;
  }

  private applyNoise20(hex: string): string {
    let charArray = hex.split('');
    const numFlips = Math.floor(hex.length * 0.20);
    for(let i=0; i<numFlips; i++) {
        const idx = Math.floor(Math.random() * hex.length);
        charArray[idx] = Math.floor(Math.random() * 16).toString(16).toUpperCase();
    }
    return charArray.join('');
  }

  private fuzzyMatch(hex: string, pattern: string): boolean {
    for (let i = 0; i <= hex.length - pattern.length; i++) {
        let matches = 0;
        for (let j = 0; j < pattern.length; j++) {
            if (hex[i+j] === pattern[j]) matches++;
        }
        // Require 75% match
        if (matches >= Math.floor(pattern.length * 0.75)) return true;
    }
    return false;
  }

  public async analyzeInjection(hexData: string): Promise<ForensicResult> {
      let processedHex = hexData.toUpperCase();
      let confidenceScore = this.mode === 'LIVE_MODE' ? 1.00 : 0.80;

      if (this.mode === 'SIMULATION_MODE') {
           processedHex = this.applyNoise20(processedHex);
      }

      // Layer 1: Deterministic Data Authenticity
      const hasHeader = processedHex.length >= 12;
      const validSignature = this.crypto.verifySignature(processedHex, new Uint8Array(32), new Uint8Array(32));
      
      const freq: Record<string, number> = {};
      for (const char of processedHex) freq[char] = (freq[char] || 0) + 1;
      let entropy = 0;
      for (const key in freq) {
         const p = freq[key] / processedHex.length;
         entropy -= p * Math.log2(p);
      }
      const normalizedEntropy = entropy / 4; 
      
      let authenticityIndex = 0;
      if (hasHeader) authenticityIndex += 0.3;
      if (validSignature) authenticityIndex += 0.3;
      
      if (normalizedEntropy > 0.3 && normalizedEntropy < 0.95) authenticityIndex += 0.4;
      else authenticityIndex += 0.1;

      const patterns: Record<string, { cat: 'MILITARY_LEAK' | 'USER_LEAK' | 'COMMAND_LEAK', sens: 'High' | 'Medium' | 'Critical' }> = {
          'A1B2C3D4': { cat: 'MILITARY_LEAK', sens: 'High' },
          'E1F2A3B4': { cat: 'USER_LEAK', sens: 'Medium' },
          'FF00EE11': { cat: 'COMMAND_LEAK', sens: 'Critical' }
      };

      let category: 'MILITARY_LEAK' | 'USER_LEAK' | 'COMMAND_LEAK' | 'UNKNOWN' = 'UNKNOWN';
      let sensitivity: 'High' | 'Medium' | 'Critical' | 'Low' = 'Low';
      let detectedPattern = 'NONE';

      for (const [pattern, info] of Object.entries(patterns)) {
           if (this.fuzzyMatch(processedHex, pattern)) {
               category = info.cat;
               sensitivity = info.sens;
               detectedPattern = pattern;
               break;
           }
      }
      
      if (category === 'UNKNOWN') confidenceScore = 0.00;

      // Layer 2: Contextual AI
      let aiAnalysis = undefined;
      let layerStatus: 'LAYER1_ONLY' | 'LAYER2_COMPLETE' | 'LAYER2_FAILED' = 'LAYER1_ONLY';
      
      if (category !== 'UNKNOWN' || authenticityIndex > 0.5) {
          try {
             // Fallback to Layer 1 if AI completes too fast or failed
             const aiResult = await AIService.forensicContextualAnalysis(processedHex, category);
             if (aiResult) {
                 aiAnalysis = aiResult;
                 layerStatus = 'LAYER2_COMPLETE';
             } else {
                 layerStatus = 'LAYER2_FAILED';
             }
          } catch(e) {
             layerStatus = 'LAYER2_FAILED';
          }
      }

      return {
          category,
          sensitivity,
          confidenceScore,
          detectedPattern,
          rawDump: processedHex,
          authenticityIndex,
          aiAnalysis,
          layerStatus
      };
  }

  processHexPayload(hex: string): ProcessingResult {
    try {
        this.lastDataTime = Date.now();
        
        // Safety guard against massive inputs causing memory/regex leaks
        if (typeof hex !== 'string' || hex.length > 8192) {
             throw new Error("Payload size exceeded hard limits.");
        }

        // 1. Verify Command Signature (PQC Dilithium)
        const signature = new Uint8Array(32); 
        const isValid = this.crypto.verifySignature(hex, signature, new Uint8Array(32));

        if (!isValid) {
          return {
            status: 'STANDBY',
            threatLevel: 'Critical',
            description: 'PQC_SIGNATURE_VERIFICATION_FAILED_DILITHIUM'
          };
        }

        // 2. HEX Logic
        if (!/^[0-9A-Fa-f]+$/.test(hex)) {
          return { 
            status: 'STANDBY', 
            threatLevel: 'Warning', 
            description: 'INVALID_HEX_FORMAT' 
          };
        }

        const unauthorizedCommandPrefix = "FF00EE"; 
        if (hex.toUpperCase().startsWith(unauthorizedCommandPrefix)) {
          return { 
            status: 'ISOLATING', 
            threatLevel: 'Critical', 
            description: 'UNAUTHORIZED_CMD_INJECTION_DETECTED' 
          };
        }

        if (hex.length > 512) {
          return {
            status: 'ACTIVE',
            threatLevel: 'Warning',
            description: 'LARGE_PAYLOAD_THRESHOLD_EXCEEDED'
          };
        }

        return { 
          status: 'ACTIVE', 
          threatLevel: 'Normal', 
          description: 'NOMINAL_TELEMETRY_FLOW' 
        };
    } catch (e: any) {
        console.error(`[TelemetryProcessor] Critical fault detecting payload: ${e.message}`);
        return {
           status: 'ISOLATING',
           threatLevel: 'Critical',
           description: 'RUNTIME_EXCEPTION_DURING_PROCESSING'
        };
    }
  }

  getHeartbeatStatus(): OperationalStatus {
    const elapsed = Date.now() - this.lastDataTime;
    return elapsed > this.TIMEOUT_MS ? 'STANDBY' : 'ACTIVE';
  }

  async parseHexTelemetry(hex: string): Promise<ParsedTelemetryData | null> {
    try {
        if (typeof hex !== 'string' || hex.length < 32 || hex.length > 8192 || !/^[0-9A-Fa-f]+$/.test(hex)) {
            return null;
        }

        // Authenticated Decryption simulation using AES-GCM
        const staticSimKey = new Uint8Array(32).fill(0xAA); 
        await this.crypto.aesEncrypt(hex, staticSimKey); // Simulate timing 

        const tempHex = hex.substring(0, 4);
        const voltageHex = hex.substring(4, 8);
        const altHex = hex.substring(8, 12);

        const temperature = parseInt(tempHex, 16) / 100 - 50; 
        const voltage = parseInt(voltageHex, 16) / 1000;
        const altitude = parseInt(altHex, 16);

        // Fail tightly on NaN to prevent undefined behavior poisoning state
        if (isNaN(temperature) || isNaN(voltage) || isNaN(altitude)) {
            throw new Error("Corrupt payload decoding result bounds");
        }

        return {
            temperature: parseFloat(temperature.toFixed(2)),
            voltage: parseFloat(voltage.toFixed(2)),
            altitude: altitude,
            vectorX: (Math.random() * 2 - 1).toFixed(4),
            vectorY: (Math.random() * 2 - 1).toFixed(4),
            vectorZ: (Math.random() * 2 - 1).toFixed(4),
        };
    } catch(e) {
        console.error(`[TelemetryProcessor] parseHexTelemetry failure:`, e);
        return null;
    }
  }
}
