import OpenAI from 'openai';
import { ENV } from '../../config/env.js';

export class AiProviderService {
  private openaiClient: OpenAI | null = null;
  private readonly provider: 'gemini' | 'openai' | 'claude';
  private readonly model: string;
  private readonly apiKey: string;

  constructor() {
    const rawProvider = (ENV.AI_PROVIDER || 'claude').toLowerCase();
    if (rawProvider === 'openai') {
      this.provider = 'openai';
      this.apiKey = ENV.AI_API_KEY || '';
      this.model = ENV.AI_MODEL || 'gpt-4o-mini';
      if (this.apiKey) {
        this.openaiClient = new OpenAI({
          apiKey: this.apiKey,
          timeout: 15000,
          maxRetries: 2,
        });
      }
    } else if (rawProvider === 'claude' || rawProvider === 'anthropic') {
      this.provider = 'claude';
      this.apiKey =
        (ENV as any).CLAUDE_API_KEY ||
        (ENV as any).ANTHROPIC_API_KEY ||
        ENV.AI_API_KEY ||
        '';
      this.model =
        ENV.AI_MODEL && !ENV.AI_MODEL.includes('gemini') && !ENV.AI_MODEL.includes('gpt')
          ? ENV.AI_MODEL
          : 'claude-3-5-haiku-20241022';
    } else {
      this.provider = 'gemini';
      this.apiKey = ENV.AI_API_KEY || (ENV as any).GEMINI_API_KEY || '';
      this.model =
        ENV.AI_MODEL && !ENV.AI_MODEL.includes('gpt') && !ENV.AI_MODEL.includes('claude')
          ? ENV.AI_MODEL
          : 'gemini-1.5-flash';
    }
  }

  public isAvailable(): boolean {
    if (this.provider === 'openai') {
      return !!this.openaiClient;
    }
    return !!this.apiKey;
  }

  public getModelIdentifier(): string {
    return `${this.provider}:${this.model}`;
  }

  /**
   * Universal Structured JSON generator supporting Anthropic Claude, Google Gemini, and OpenAI
   */
  async generateStructuredJson<T>(
    systemPrompt: string,
    userPrompt: string,
    fallbackGenerator: () => T
  ): Promise<T> {
    if (!this.apiKey) {
      console.warn(`⚠️ ${this.provider.toUpperCase()} API key not configured, using safe physiological fallback.`);
      return fallbackGenerator();
    }

    // Google Gemini API keys from Google AI Studio strictly start with "AIzaSy"
    if (this.provider === 'gemini' && !this.apiKey.startsWith('AIzaSy')) {
      console.warn(
        '⚠️ Gemini API key must be a Google AI Studio key (starting with AIzaSy...). Google Cloud Console token detected. Using verified clinical fallback engine.'
      );
      return fallbackGenerator();
    }

    try {
      if (this.provider === 'claude') {
        return await this.callClaude<T>(systemPrompt, userPrompt);
      } else if (this.provider === 'openai') {
        return await this.callOpenAI<T>(systemPrompt, userPrompt);
      } else {
        return await this.callGemini<T>(systemPrompt, userPrompt);
      }
    } catch (err: any) {
      console.error(`❌ ${this.provider.toUpperCase()} API Error:`, err?.message || err);
      // Safe fallback to deterministic clinical default ensures the app never crashes
      return fallbackGenerator();
    }
  }

  /**
   * Anthropic Claude Messages REST API call
   */
  private async callClaude<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    const url = 'https://api.anthropic.com/v1/messages';
    const promptText = `${userPrompt}\n\nCRITICAL INSTRUCTION: Return ONLY a valid JSON object matching the requested schema without any markdown commentary or text outside the JSON.`;

    const payload = {
      model: this.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: promptText,
        },
      ],
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const errorJson: any = await response.json().catch(() => ({}));
      const errorMsg =
        errorJson?.error?.message ||
        `Claude API returned HTTP ${response.status} (${response.statusText})`;
      throw new Error(errorMsg);
    }

    const data: any = await response.json();
    const rawContent = data?.content?.[0]?.text;

    if (!rawContent) {
      throw new Error('Claude API returned empty response content');
    }

    let cleaned = rawContent.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return JSON.parse(cleaned) as T;
  }

  /**
   * Google Gemini REST API call
   */
  private async callGemini<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const promptText = `${systemPrompt}\n\nCRITICAL INSTRUCTION: Return ONLY a valid JSON object matching the requested schema without any markdown formatting.\n\nUser Request:\n${userPrompt}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const errorMsg =
        errorJson?.error?.message ||
        `Gemini API returned HTTP ${response.status} (${response.statusText})`;
      throw new Error(errorMsg);
    }

    const data: any = await response.json();
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      throw new Error('Gemini API returned empty response candidates');
    }

    // Clean JSON string in case code fences are returned
    let cleaned = rawContent.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned) as T;
    return parsed;
  }

  /**
   * OpenAI API call
   */
  private async callOpenAI<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.openaiClient.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return JSON.parse(content) as T;
  }
}

export const aiProviderService = new AiProviderService();
