import { DomainClassification } from './ai-assistant.types.js';

export interface ClassificationResult {
  classification: DomainClassification;
  category: string;
  isEmergency: boolean;
  emergencyResponse?: string;
  refusalResponse?: string;
  clarificationResponse?: string;
  detectedLanguage: 'en' | 'ta' | 'tanglish';
  extractedTopics: string[];
}

export class HealthDomainService {
  // Emergency / Red-Flag Symptoms patterns
  private readonly emergencyPatterns = [
    /\b(chest pain|heart attack|angina|crushing pain in chest)\b/i,
    /\b(can't breathe|cannot breathe|severe shortness of breath|choking|gasping for air)\b/i,
    /\b(stroke|facial droop|slurred speech|arm weakness|paralysis|sudden numbness)\b/i,
    /\b(vomiting blood|coughing up blood|severe bleeding|hemorrhage)\b/i,
    /\b(unconscious|passed out|fainted and not waking|seizure|convulsions)\b/i,
    /\b(suicid|kill myself|end my life|self harm|cut my wrist)\b/i,
    /\b(poison|swallowed bleach|overdose|drank pesticide)\b/i,
    // Tamil / Tanglish emergency triggers
    /\b(nenju vali|moochu vida mudiyala|raththam varuthu|maranam|uyir)\b/i,
  ];

  // Prompt Injection & Jailbreak patterns
  private readonly promptInjectionPatterns = [
    /\b(ignore (all )?previous instructions|forget your instructions|disregard guidelines)\b/i,
    /\b(you are now|pretend to be|act as (a|an) (python|coder|developer|hacker|bot|dan))\b/i,
    /\b(system prompt|reveal your prompt|show instructions|internal instructions)\b/i,
    /\b(jailbreak|unfiltered mode|developer mode on|ignore safety)\b/i,
  ];

  // Obvious non-health domains (coding, politics, entertainment, crypto, sports, homework)
  private readonly nonHealthPatterns = [
    /\b(write (a )?python|javascript|typescript|c\+\+|html|css|java|code for|debug my code)\b/i,
    /\b(prime minister|president of|election|political party|who won the match|cricket score|ipl)\b/i,
    /\b(bitcoin|cryptocurrency|ethereum|stock market|forex|investing in stocks)\b/i,
    /\b(movie story|actor|actress|cinema|box office|lyrics of|trailer)\b/i,
    /\b(write an essay on|solve this math|algebra equation|calculate 2\+2)\b/i,
    /\b(recipe for chocolate cake|bake a pizza|car engine|buy mobile phone)\b/i,
  ];

  // Health-related keyword roots (English, Tamil, Tanglish)
  private readonly healthPatterns = [
    // Core wellness & body
    /\b(health|wellness|body|symptom|disease|illness|infection|pain|ache|fever|cough|cold)\b/i,
    /\b(headache|stomach|belly|muscle|joint|bone|skin|eye|ear|throat|tooth|teeth)\b/i,
    // Nutrition & food
    /\b(nutrition|diet|food|calor|protein|carb|carbohydrate|fat|fiber|vitamin|mineral)\b/i,
    /\b(breakfast|lunch|dinner|snack|meal|eat|eating|sugar|salt|oil|rice|wheat|dosa|idli)\b/i,
    // BMI & weight
    /\b(bmi|weight|obese|obesity|overweight|underweight|lose weight|gain weight|fat loss|slimming)\b/i,
    // Physical activity & fitness
    /\b(exercise|walk|walking|steps|gym|workout|cardio|stamina|running|yoga|fitness|stretch)\b/i,
    // Water & sleep
    /\b(water|hydration|fluid|drink|dehydration|thirst|sleep|insomnia|rest|tired|fatigue|nap)\b/i,
    // Vitals & heart
    /\b(heart|pulse|bpm|blood pressure|bp|hypertension|hypotension|oxygen|spo2|temperature)\b/i,
    // Medication & habits
    /\b(medication|medicine|tablet|pill|dosage|prescription|side effect|habit|routine)\b/i,
    // Demographics & prevention
    /\b(men|women|pediatric|child|elderly|aging|pregnancy|stress|anxiety|depression|mental health)\b/i,
    // Tanglish / Tamil health terms
    /\b(udambu|vali|thalaivali|kaichal|irumal|sali|saapadu|thookam|thanneer|marunthu)\b/i,
    /\b(raththam|udal|edai|kuraika|kooda|stamina|nadai|payirchi|sugar|presure)\b/i,
  ];

  /**
   * Classify user input into appropriate domain classification
   */
  public classify(userPrompt: string): ClassificationResult {
    const trimmed = userPrompt.trim();

    // 1. Detect Emergency Symptoms
    for (const pattern of this.emergencyPatterns) {
      if (pattern.test(trimmed)) {
        return {
          classification: 'EMERGENCY_OR_HIGH_RISK',
          category: 'EMERGENCY',
          isEmergency: true,
          emergencyResponse:
            '⚠️ **Immediate Medical Care Recommended**\n\n' +
            'Your description contains symptoms that may indicate a serious medical emergency.\n\n' +
            '• **Action Required:** Please seek immediate emergency medical care or call your local emergency services (e.g. **108 / 112** in India, **911** in the US, or your regional emergency helpline).\n' +
            '• **Do not wait:** Do not rely on digital applications or online chat during acute emergencies such as severe chest pain, breathing collapse, suspected stroke, severe bleeding, or crisis distress.',
          detectedLanguage: this.detectLanguage(trimmed),
          extractedTopics: ['emergency', 'urgent_care'],
        };
      }
    }

    // 2. Detect Prompt Injection / Jailbreaks
    for (const pattern of this.promptInjectionPatterns) {
      if (pattern.test(trimmed)) {
        return {
          classification: 'NOT_HEALTH_RELATED',
          category: 'INJECTION_ATTEMPT',
          isEmergency: false,
          refusalResponse:
            "I'm UYIRA Health Assistant. I can help you with health, nutrition, fitness, wellness, sleep, and lifestyle-related questions. Please ask me something related to your health.",
          detectedLanguage: 'en',
          extractedTopics: [],
        };
      }
    }

    // 3. Detect Explicit Non-Health Topics
    for (const pattern of this.nonHealthPatterns) {
      if (pattern.test(trimmed)) {
        return {
          classification: 'NOT_HEALTH_RELATED',
          category: 'OFF_TOPIC',
          isEmergency: false,
          refusalResponse:
            "I'm UYIRA Health Assistant. I can help you with health, nutrition, fitness, wellness, sleep, and lifestyle-related questions. Please ask me something related to your health.",
          detectedLanguage: this.detectLanguage(trimmed),
          extractedTopics: [],
        };
      }
    }

    // 4. Match Health Topics
    const matchedTopics: string[] = [];
    let isHealth = false;

    for (const pattern of this.healthPatterns) {
      if (pattern.test(trimmed)) {
        isHealth = true;
        const match = trimmed.match(pattern);
        if (match && match[0]) {
          matchedTopics.push(match[0].toLowerCase());
        }
      }
    }

    const detectedLang = this.detectLanguage(trimmed);

    // If health keywords matched, mark as HEALTH_RELATED
    if (isHealth || matchedTopics.length > 0) {
      return {
        classification: 'HEALTH_RELATED',
        category: this.categorizeTopics(matchedTopics),
        isEmergency: false,
        detectedLanguage: detectedLang,
        extractedTopics: matchedTopics,
      };
    }

    // If very short query with no context (e.g. "hello", "hi", "hey")
    if (/^(hi|hello|hey|vanakkam|namaste|morning|evening)(\s+there)?$/i.test(trimmed)) {
      return {
        classification: 'HEALTH_RELATED',
        category: 'GREETING',
        isEmergency: false,
        detectedLanguage: detectedLang,
        extractedTopics: ['greeting'],
      };
    }

    // If query is ambiguous or uncertain
    if (trimmed.length > 3 && trimmed.split(' ').length <= 3) {
      return {
        classification: 'UNCERTAIN',
        category: 'UNCERTAIN',
        isEmergency: false,
        clarificationResponse:
          "Could you please tell me how this relates to your health, nutrition, or wellness? I'm here to provide health-focused guidance.",
        detectedLanguage: detectedLang,
        extractedTopics: [],
      };
    }

    // Default polite health-only refusal
    return {
      classification: 'NOT_HEALTH_RELATED',
      category: 'UNRECOGNIZED',
      isEmergency: false,
      refusalResponse:
        "I'm UYIRA Health Assistant. I can help you with health, nutrition, fitness, wellness, sleep, and lifestyle-related questions. Please ask me something related to your health.",
      detectedLanguage: detectedLang,
      extractedTopics: [],
    };
  }

  private detectLanguage(text: string): 'en' | 'ta' | 'tanglish' {
    // Unicode Tamil check
    if (/[\u0B80-\u0BFF]/.test(text)) {
      return 'ta';
    }
    // Tanglish phonetic check
    if (/\b(epadi|enna|mudiyala|pani|kudu|saapadu|thookam|vanakkam|vali|udambu)\b/i.test(text)) {
      return 'tanglish';
    }
    return 'en';
  }

  private categorizeTopics(topics: string[]): string {
    const joined = topics.join(' ');
    if (/bmi|weight|obese/i.test(joined)) return 'BMI_AND_WEIGHT';
    if (/calor|protein|carb|nutrition|diet|eat|food|meal/i.test(joined)) return 'NUTRITION';
    if (/walk|step|exercise|gym|workout|stamina/i.test(joined)) return 'ACTIVITY';
    if (/water|hydration|drink/i.test(joined)) return 'HYDRATION';
    if (/sleep|insomnia|rest/i.test(joined)) return 'SLEEP';
    if (/heart|pulse|blood pressure|bp|spo2/i.test(joined)) return 'VITALS';
    if (/medication|medicine|pill|tablet/i.test(joined)) return 'MEDICATION';
    return 'GENERAL_WELLNESS';
  }
}

export const healthDomainService = new HealthDomainService();

