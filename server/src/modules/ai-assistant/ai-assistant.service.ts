import { Types } from 'mongoose';
import {
  AIConversationModel,
  AIMessageModel,
} from './ai-assistant.model.js';
import {
  ChatResponseDto,
  ConversationSummaryDto,
  DomainClassification,
  MessageFeedback,
  SendMessageDto,
} from './ai-assistant.types.js';
import { healthDomainService } from './health-domain.service.js';
import { healthContextService } from './health-context.service.js';
import { aiProviderService } from '../ai-recommendations/ai-provider.service.js';
import { BMIRecordModel } from '../bmi/bmi.model.js';

export class AIAssistantService {
  private readonly defaultDisclaimer =
    'Medical Disclaimer: UYIRA Health Assistant provides general wellness education and personal tracking insights. It is not a substitute for clinical medical advice, professional diagnosis, or treatment.';

  /**
   * Main conversational interface
   */
  async chat(userId: string, dto: SendMessageDto): Promise<ChatResponseDto> {
    const userPrompt = dto.message.trim();
    const userObjId = new Types.ObjectId(userId);

    // 1. Resolve or create Conversation
    let conversation;
    if (dto.conversationId && Types.ObjectId.isValid(dto.conversationId)) {
      conversation = await AIConversationModel.findOne({
        _id: new Types.ObjectId(dto.conversationId),
        userId: userObjId,
      });
    }

    if (!conversation) {
      // Auto-generate clean title from first few words of prompt
      const generatedTitle =
        userPrompt.length > 40 ? userPrompt.substring(0, 37) + '...' : userPrompt;
      conversation = await AIConversationModel.create({
        userId: userObjId,
        title: generatedTitle || 'Health Chat',
        lastMessageAt: new Date(),
      });
    }

    const convId = conversation._id;

    // 2. Perform Domain Classification & Safety Guardrails
    const classificationResult = healthDomainService.classify(userPrompt);

    // 3. Save User Message
    const userMsgDoc = await AIMessageModel.create({
      conversationId: convId,
      userId: userObjId,
      sender: 'USER',
      content: userPrompt,
      classification: classificationResult.classification,
      category: classificationResult.category,
    });

    // 4. Handle Emergency / Red-Flag Symptoms immediately
    if (classificationResult.classification === 'EMERGENCY_OR_HIGH_RISK') {
      const emergencyContent =
        classificationResult.emergencyResponse ||
        '⚠️ Please seek immediate medical care or contact local emergency services (108/112).';

      const assistantMsgDoc = await AIMessageModel.create({
        conversationId: convId,
        userId: userObjId,
        sender: 'ASSISTANT',
        content: emergencyContent,
        classification: 'EMERGENCY_OR_HIGH_RISK',
        category: 'EMERGENCY',
        disclaimer: 'Emergency Alert: Seek immediate professional medical care.',
        contextUsed: [],
      });

      await this.updateConversationLastMessage(convId, emergencyContent);

      return this.formatChatResponse(conversation._id.toString(), userMsgDoc, assistantMsgDoc);
    }

    // 5. Handle Non-Health Topic Refusal strictly
    if (classificationResult.classification === 'NOT_HEALTH_RELATED') {
      const refusalContent =
        classificationResult.refusalResponse ||
        "I'm UYIRA Health Assistant. I can help you with health, nutrition, fitness, wellness, sleep, and lifestyle-related questions. Please ask me something related to your health.";

      const assistantMsgDoc = await AIMessageModel.create({
        conversationId: convId,
        userId: userObjId,
        sender: 'ASSISTANT',
        content: refusalContent,
        classification: 'NOT_HEALTH_RELATED',
        category: classificationResult.category,
        disclaimer: this.defaultDisclaimer,
        contextUsed: [],
      });

      await this.updateConversationLastMessage(convId, refusalContent);

      return this.formatChatResponse(conversation._id.toString(), userMsgDoc, assistantMsgDoc);
    }

    // 6. Handle Uncertain / Clarification
    if (classificationResult.classification === 'UNCERTAIN') {
      const clarificationContent =
        classificationResult.clarificationResponse ||
        "Could you please tell me more about how this relates to your health, nutrition, or wellness?";

      const assistantMsgDoc = await AIMessageModel.create({
        conversationId: convId,
        userId: userObjId,
        sender: 'ASSISTANT',
        content: clarificationContent,
        classification: 'UNCERTAIN',
        category: 'UNCERTAIN',
        disclaimer: this.defaultDisclaimer,
        contextUsed: [],
      });

      await this.updateConversationLastMessage(convId, clarificationContent);

      return this.formatChatResponse(conversation._id.toString(), userMsgDoc, assistantMsgDoc);
    }

    // 7. Health-Related: Retrieve Minimum Authorized Context
    const { formattedContext, contextSources } =
      await healthContextService.getSelectiveContext(
        userId,
        userPrompt,
        classificationResult.extractedTopics
      );

    // Retrieve recent conversation history for coherence (last 4 messages)
    const recentMessages = await AIMessageModel.find({ conversationId: convId })
      .sort({ createdAt: -1 })
      .skip(1) // skip the user message just saved
      .limit(4)
      .lean();

    const formattedHistory = recentMessages
      .reverse()
      .map((m) => `${m.sender}: ${m.content}`)
      .join('\n');

    // 8. Generate AI Response via Centralized Provider or Physiological Fallback
    const assistantContent = await this.generateAssistantResponse(
      userPrompt,
      formattedContext,
      formattedHistory,
      classificationResult.detectedLanguage,
      classificationResult.category
    );

    // 9. Save Assistant Message
    const assistantMsgDoc = await AIMessageModel.create({
      conversationId: convId,
      userId: userObjId,
      sender: 'ASSISTANT',
      content: assistantContent,
      classification: 'HEALTH_RELATED',
      category: classificationResult.category,
      disclaimer: this.defaultDisclaimer,
      contextUsed: contextSources,
    });

    await this.updateConversationLastMessage(convId, assistantContent);

    return this.formatChatResponse(conversation._id.toString(), userMsgDoc, assistantMsgDoc);
  }

  /**
   * AI response generation with multi-layered fallback
   */
  private async generateAssistantResponse(
    userPrompt: string,
    userContext: string,
    conversationHistory: string,
    language: 'en' | 'ta' | 'tanglish',
    category: string
  ): Promise<string> {
    const systemPrompt = `You are UYIRA Health Assistant, an empathetic, evidence-based, clinical-grade wellness AI companion integrated into the UYIRA Smart Health platform.
Your objective is to provide actionable, easy-to-understand, friendly, and structured health guidance.

CRITICAL RESPONSIBILITIES & CONSTRAINTS:
1. Ground your answer in the provided user health context records when relevant.
2. NEVER prescribe medications or declare a definitive medical diagnosis.
3. Recommend consulting a qualified physician or healthcare specialist for clinical conditions.
4. Maintain a warm, encouraging, and professional tone.
5. Format your output with Markdown headers, bullet points, and clear sections where appropriate.
6. Language: If the user communicates in Tamil or Tanglish, provide the response in natural, fluent ${
      language === 'ta' ? 'Tamil' : language === 'tanglish' ? 'Tanglish / Tamil-friendly English' : 'English'
    }.
7. Keep responses concise, direct, and actionable (under 300 words).

USER VERIFIED HEALTH RECORDS:
${userContext}

RECENT CHAT HISTORY:
${conversationHistory || 'None'}
`;

    // Safe physiological deterministic fallback generator
    const fallbackGenerator = (): { answer: string } => {
      return {
        answer: this.generatePhysiologicalFallback(userPrompt, userContext, category, language),
      };
    };

    try {
      const response = await aiProviderService.generateStructuredJson<{ answer: string }>(
        systemPrompt,
        `User Health Question: ${userPrompt}\n\nRespond with a JSON object format: { "answer": "your markdown formatted response" }`,
        fallbackGenerator
      );

      return response.answer || fallbackGenerator().answer;
    } catch {
      return fallbackGenerator().answer;
    }
  }

  /**
   * Clinically sound, high-fidelity physiological fallback engine
   * Activated when external OpenAI is unavailable or rate-limited
   */
  private generatePhysiologicalFallback(
    prompt: string,
    userContext: string,
    category: string,
    language: 'en' | 'ta' | 'tanglish'
  ): string {
    const hasContext = userContext.includes('[Profile Demographics]') || userContext.includes('[Latest BMI]');

    // Tanglish / Tamil Response
    if (language === 'tanglish' || language === 'ta') {
      if (category === 'BMI_AND_WEIGHT') {
        return (
          `### UYIRA உடல் எடை & BMI வழிகாட்டுதல் (Weight & BMI Insights)\n\n` +
          `உங்கள் உடல் எடையை சீராகவும் ஆரோக்கியமாகவும் பராமரிக்க சில முக்கிய வழிமுறைகள்:\n\n` +
          `• **சீரான உணவு:** அதிக புரதச்சத்து (Protein) உள்ள உணவுகள் மற்றும் காய்கறிகளை உணவில் அதிகம் சேர்த்துக் கொள்ளுங்கள்.\n` +
          `• **நடைப்பயிற்சி:** தினமும் 30 முதல் 45 நிமிடங்கள் மிதமான நடைப்பயிற்சி (Brisk Walking) அல்லது உடற்பயிற்சி செய்வது உடல் வளர்சிதை மாற்றத்தை (Metabolism) அதிகரிக்கும்.\n` +
          `• **நீர் சத்து:** தினமும் போதுமான அளவு தண்ணீர் குடிப்பது செரிமானத்திற்கும் எடை குறைப்பிற்கும் மிகவும் நல்லது.\n\n` +
          `*குறிப்பு: உங்கள் விரிவான உடல் எடையை UYIRA BMI & Calorie பகுதியில் தொடர்ந்து கண்காணிக்கலாம்.*`
        );
      }
      if (category === 'HYDRATION') {
        return (
          `### UYIRA நீரேற்றம் வழிகாட்டுதல் (Hydration Guidance)\n\n` +
          `நமது உடல் உறுப்புகள் சீராக இயங்க தினமும் போதுமான தண்ணீர் குடிப்பது மிக அவசியம்:\n\n` +
          `• **பரிந்துரைக்கப்படும் அளவு:** ஒரு நாளைக்கு சராசரியாக 2.5 முதல் 3 லிட்டர் தண்ணீர் குடிப்பது நல்லது.\n` +
          `• **பயன்கள்:** உடல் சோர்வை நீக்குகிறது, இரத்த ஓட்டத்தை சீராக்குகிறது, மற்றும் தோலின் ஆரோக்கியத்தை மேம்படுத்துகிறது.\n` +
          `• **UYIRA Water Tracker:** ஒவ்வொரு முறை தண்ணீர் குடிக்கும் போதும் உங்கள் UYIRA ஆப்பில் log செய்து உங்கள் இலக்கை அடையுங்கள்!`
        );
      }
      return (
        `### UYIRA நலவாழ்வு வழிகாட்டுதல் (Wellness Insights)\n\n` +
        `உங்கள் ஆரோக்கியத்தை மேம்படுத்த சில எளிய மற்றும் பயனுள்ள பழக்கங்கள்:\n\n` +
        `• **சீரான தூக்கம்:** தினமும் 7-8 மணி நேர ஆழ்ந்த தூக்கம் உடல் புத்துணர்ச்சிக்கு அவசியம்.\n` +
        `• **ஆரோக்கிய உணவு:** சமச்சீரான உணவு, அதிக நார்சத்து மற்றும் குறைந்த சர்க்கரை உட்கொள்ளுதல்.\n` +
        `• **உடற்பயிற்சி:** வாரத்திற்கு குறைந்தது 150 நிமிடங்கள் சுறுசுறுப்பான செயல்பாடுகளில் ஈடுபடுங்கள்.\n\n` +
        `*உங்களுக்கு ஏதேனும் தீவிர உடல் உபாதைகள் இருப்பின் மருத்துவரை அணுகி ஆலோசனை பெறுவது சிறந்தது.*`
      );
    }

    // English Fallback by Category
    switch (category) {
      case 'BMI_AND_WEIGHT':
        return (
          `### Understanding Weight & BMI Management\n\n` +
          `Body Mass Index (BMI) evaluates weight relative to height as an initial wellness indicator:\n\n` +
          `• **Healthy Baseline:** A standard adult healthy BMI range is **18.5 – 24.9 kg/m²**.\n` +
          `• **Sustainable Fat Loss:** Safe, lasting weight management targets a moderate deficit of **300–500 kcal/day**, leading to 0.5–1.0 kg/week of gradual fat loss while preserving lean muscle.\n` +
          `• **Nutrition Anchor:** Focus on lean proteins, fiber-rich legumes, whole grains, and leafy vegetables.\n` +
          `• **Physical Activity:** Combine 150 minutes of weekly moderate aerobic activity with resistance exercises.\n\n` +
          (hasContext
            ? `*Your tracked health baseline in UYIRA has been integrated into this evaluation.*`
            : `*Log your height and weight in UYIRA's BMI module for real-time personalized tracking.*`)
        );

      case 'NUTRITION':
        return (
          `### Evidence-Based Nutrition & Macronutrients\n\n` +
          `A balanced daily plate optimizes cellular metabolism, cognitive focus, and energy stability:\n\n` +
          `• **Proteins (20–30% of energy):** Essential for muscle preservation and satiety. Quality sources include lentils, chickpeas, paneer, eggs, fish, and Greek yogurt.\n` +
          `• **Complex Carbohydrates (45–55%):** Prioritize unrefined complex carbs (millets, oats, brown rice, whole wheat) over refined sugars to prevent blood glucose spikes.\n` +
          `• **Essential Healthy Fats (20–30%):** Include nuts, seeds, extra virgin olive oil, and avocado for hormone synthesis and cardiovascular protection.\n` +
          `• **Micronutrient Density:** Aim for colorful vegetables at every meal for dietary fiber, antioxidants, and electrolytes.\n\n` +
          `*You can track your exact meals and monitor daily calorie burn inside UYIRA's Nutrition section.*`
        );

      case 'HYDRATION':
        return (
          `### Optimal Hydration & Fluid Balance\n\n` +
          `Adequate daily hydration maintains blood volume, kidney filtration, and cognitive sharpness:\n\n` +
          `• **Daily Goal:** Adults typically benefit from **2,500 – 3,000 ml** (8–10 glasses) of fluids daily, adjusted for physical activity and climate.\n` +
          `• **Optimal Timing:** Drink 1 glass upon waking to replenish nocturnal fluid loss, and drink steadily between meals rather than chugging large amounts at once.\n` +
          `• **Hydration Check:** Pale straw-colored urine is an accurate clinical sign of optimal hydration.\n\n` +
          `*Log your water glasses in UYIRA Water Tracker to achieve your daily hydration goal.*`
        );

      case 'SLEEP':
        return (
          `### Restorative Sleep & Circadian Hygiene\n\n` +
          `Quality sleep is fundamental to cardiovascular recovery, neuroplasticity, and metabolic regulation:\n\n` +
          `• **Recommended Duration:** Adults need **7 to 9 hours** of uninterrupted sleep nightly.\n` +
          `• **Circadian Rhythm:** Maintain a consistent sleep and wake time every day, including weekends.\n` +
          `• **Digital Sunset:** Limit exposure to blue-light emitting screens 60 minutes before bed to allow natural melatonin surge.\n` +
          `• **Sleep Environment:** Keep your bedroom cool, dark, and quiet.\n\n` +
          `*Monitor your sleep duration and sleep quality scores in UYIRA Sleep Tracking.*`
        );

      case 'ACTIVITY':
        return (
          `### Daily Physical Activity & Cardiovascular Health\n\n` +
          `Regular daily movement significantly lowers risks of hypertension, type-2 diabetes, and mental fatigue:\n\n` +
          `• **Step Goal:** Striving toward **8,000 – 10,000 steps daily** provides powerful cardiovascular protection.\n` +
          `• **Aerobic Exercise:** Aim for at least 150 minutes of moderate aerobic exercise (brisk walking, cycling, swimming) each week.\n` +
          `• **Break Sedentary Time:** Take a 2-minute movement or posture stretch for every 45 minutes of continuous sitting.\n\n` +
          `*Check your daily step progress and calorie burn in the UYIRA Activity module.*`
        );

      case 'VITALS':
        return (
          `### Vital Signs Education & Cardiovascular Wellness\n\n` +
          `Monitoring vital signs provides valuable preventive insights into your cardiovascular health:\n\n` +
          `• **Blood Pressure:** Normal adult resting blood pressure is typically below **120/80 mmHg**.\n` +
          `• **Resting Heart Rate:** A healthy resting heart rate ranges between **60 and 100 beats per minute (BPM)**.\n` +
          `• **Oxygen Saturation (SpO₂):** Healthy normal room-air SpO₂ is **95% – 100%**.\n\n` +
          `*Note: Isolated readings can fluctuate with stress, caffeine, or posture. Consult a doctor for any persistent abnormalities.*`
        );

      default:
        return (
          `### UYIRA Comprehensive Health & Wellness Insights\n\n` +
          `Maintaining vibrant health relies on small, consistent daily habits across core wellness pillars:\n\n` +
          `1. **Nourishing Diet:** Prioritize whole, unprocessed foods rich in natural protein, dietary fiber, and healthy micronutrients.\n` +
          `2. **Active Living:** Stay physically active with at least 8,000 daily steps and regular movement.\n` +
          `3. **Consistent Hydration:** Keep your body energized with 2.5 to 3 liters of clean water daily.\n` +
          `4. **Quality Sleep:** Prioritize 7–8 hours of sound sleep for cellular regeneration.\n` +
          `5. **Stress Management:** Practice daily deep breathing, mindfulness, or outdoor walks to regulate cortisol.\n\n` +
          `*I am here to help you navigate your health metrics in UYIRA whenever you have a question!*`
        );
    }
  }

  /**
   * List user's conversations
   */
  async getConversations(userId: string): Promise<ConversationSummaryDto[]> {
    const list = await AIConversationModel.find({
      userId: new Types.ObjectId(userId),
    })
      .sort({ lastMessageAt: -1 })
      .limit(30)
      .lean();

    return list.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      createdAt: c.createdAt,
    }));
  }

  /**
   * Get single conversation with full message history
   */
  async getConversationById(userId: string, conversationId: string) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new Error('Invalid conversation ID');
    }

    const conv = await AIConversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      userId: new Types.ObjectId(userId),
    }).lean();

    if (!conv) {
      throw new Error('Conversation not found or unauthorized');
    }

    const messages = await AIMessageModel.find({
      conversationId: conv._id,
      userId: new Types.ObjectId(userId),
    })
      .sort({ createdAt: 1 })
      .lean();

    return {
      conversation: {
        id: conv._id.toString(),
        title: conv.title,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
      },
      messages: messages.map((m) => ({
        id: m._id.toString(),
        sender: m.sender,
        content: m.content,
        category: m.category,
        classification: m.classification,
        disclaimer: m.disclaimer,
        contextUsed: m.contextUsed,
        feedback: m.feedback,
        createdAt: m.createdAt,
      })),
    };
  }

  /**
   * Delete conversation and associated messages
   */
  async deleteConversation(userId: string, conversationId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new Error('Invalid conversation ID');
    }

    const conv = await AIConversationModel.findOneAndDelete({
      _id: new Types.ObjectId(conversationId),
      userId: new Types.ObjectId(userId),
    });

    if (conv) {
      await AIMessageModel.deleteMany({ conversationId: conv._id });
      return true;
    }
    return false;
  }

  /**
   * Clear all messages in a conversation
   */
  async clearConversation(userId: string, conversationId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new Error('Invalid conversation ID');
    }

    const conv = await AIConversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      userId: new Types.ObjectId(userId),
    });

    if (conv) {
      await AIMessageModel.deleteMany({ conversationId: conv._id });
      conv.lastMessage = '';
      conv.lastMessageAt = new Date();
      await conv.save();
      return true;
    }
    return false;
  }

  /**
   * Submit feedback on assistant response
   */
  async submitFeedback(
    userId: string,
    messageId: string,
    feedback: MessageFeedback,
    comment?: string
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new Error('Invalid message ID');
    }

    const msg = await AIMessageModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(messageId),
        userId: new Types.ObjectId(userId),
        sender: 'ASSISTANT',
      },
      {
        $set: {
          feedback,
          feedbackComment: comment ? comment.trim() : undefined,
        },
      },
      { new: true }
    );

    return !!msg;
  }

  /**
   * Get dynamic suggested questions grounded in user metrics
   */
  async getSuggestedQuestions(userId: string): Promise<string[]> {
    const questions: string[] = [
      'How can I improve my health progress this week?',
      'Explain my latest BMI result and healthy weight target',
      'Am I drinking enough water based on my daily target?',
      'Suggest healthy protein-rich food options for my diet',
      'What are practical tips to improve deep sleep quality?',
      'How many steps should I walk daily to improve stamina?',
    ];

    try {
      const userObjId = new Types.ObjectId(userId);
      const bmi = await BMIRecordModel.findOne({ userId: userObjId }).sort({ createdAt: -1 });
      if (bmi) {
        questions[1] = `Explain my BMI of ${bmi.bmiValue} (${bmi.category}) and how to optimize it`;
      }
    } catch {
      // Non-blocking
    }

    return questions;
  }

  private async updateConversationLastMessage(
    conversationId: Types.ObjectId,
    lastMessage: string
  ): Promise<void> {
    await AIConversationModel.findByIdAndUpdate(conversationId, {
      $set: {
        lastMessage: lastMessage.substring(0, 200),
        lastMessageAt: new Date(),
      },
    });
  }

  private formatChatResponse(
    conversationId: string,
    userMsg: any,
    assistantMsg: any
  ): ChatResponseDto {
    return {
      conversationId,
      messageId: assistantMsg._id.toString(),
      userMessage: {
        id: userMsg._id.toString(),
        content: userMsg.content,
        createdAt: userMsg.createdAt,
      },
      assistantMessage: {
        id: assistantMsg._id.toString(),
        content: assistantMsg.content,
        category: assistantMsg.category,
        classification: assistantMsg.classification,
        disclaimer: assistantMsg.disclaimer,
        contextUsed: assistantMsg.contextUsed,
        createdAt: assistantMsg.createdAt,
      },
    };
  }
}

export const aiAssistantService = new AIAssistantService();
