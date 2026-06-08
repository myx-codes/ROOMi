import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model, Types } from 'mongoose';
import { ChatHistoryInput, ChatThreadInput, SendChatMessageInput } from '../../libs/dto/chat/chat.input';
import { ChatMessage, ChatThread, ChatThreadReply } from '../../libs/dto/chat/chat';
import { ChatSenderType, ChatThreadStatus } from '../../libs/enums/chat.enum';
import { PropertyService } from '../property/property.service';
import { AvailabilityService } from '../availability/availability.service';
import { formatDateOnly } from '../../libs/config';
import { PricePreview } from '../../libs/dto/availability/availability';

type ChatThreadDoc = ChatThread & { _id: Types.ObjectId };
type ChatMessageDoc = ChatMessage & { _id: Types.ObjectId };

interface AssistantContext {
  language: 'en' | 'ko' | 'uz';
  propertySummary?: string;
  availabilitySummary?: string;
  policySummary: string;
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

type SupportedLanguage = 'en' | 'ko' | 'uz';

type AssistantIntent = 'greeting' | 'thanks' | 'pricing' | 'availability' | 'general';

interface StructuredBookingRequest {
  dateText: string | null;
  guestText: string | null;
  startDate: string | null;
  endDate: string | null;
  guestCount: number | null;
}

interface ProviderConfig {
  provider: 'ollama' | 'openai' | 'custom';
  baseUrl: string;
  model: string;
  apiKey: string;
  enabled: boolean;
}

@Injectable()
export class ChatService {
  private readonly timeZone = process.env.BATCH_TIMEZONE ?? 'UTC';

  constructor(
    @InjectModel('ChatThread') private readonly chatThreadModel: Model<any>,
    @InjectModel('ChatMessage') private readonly chatMessageModel: Model<any>,
    private readonly propertyService: PropertyService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  public async ensureThread(memberId: Types.ObjectId | null, input: ChatThreadInput): Promise<ChatThread> {
    const thread = await this.resolveThread(memberId, input);
    return this.populateThread(thread._id);
  }

  public async getThread(memberId: Types.ObjectId | null, input: ChatHistoryInput): Promise<ChatThread> {
    const thread = await this.resolveThread(memberId, input);
    return this.populateThread(thread._id);
  }

  public async sendMessage(
    memberId: Types.ObjectId | null,
    input: SendChatMessageInput,
  ): Promise<ChatThreadReply> {
    const thread = await this.resolveThread(memberId, input);
    const threadId = new Types.ObjectId(thread._id);
    const sanitizedMessage = input.message.trim();

    const userMessage = await this.chatMessageModel.create({
      threadId,
      senderType: ChatSenderType.USER,
      content: sanitizedMessage,
    });

    const assistantText = await this.generateAssistantReply(
      threadId,
      memberId,
      sanitizedMessage,
      input.propertyId ?? thread.propertyId ?? null,
      this.normalizeLanguage(input.language ?? (input as any).language ?? (thread as any).language),
    );
    const assistantMessage = await this.chatMessageModel.create({
      threadId,
      senderType: ChatSenderType.ASSISTANT,
      content: assistantText,
    });

    await this.chatThreadModel.updateOne(
      { _id: threadId },
      {
        $set: {
          lastMessageAt: new Date(),
          status: ChatThreadStatus.OPEN,
        },
      },
    ).exec();

    const populated = await this.populateThread(threadId);
    return {
      thread: populated,
      userMessage: this.mapMessage(userMessage),
      assistantMessage: this.mapMessage(assistantMessage),
      messageCount: populated.messages?.length ?? 0,
    };
  }

  private async resolveThread(
    memberId: Types.ObjectId | null,
    input: ChatThreadInput | ChatHistoryInput | SendChatMessageInput,
  ): Promise<ChatThreadDoc> {
    const threadId = input.threadId ? new Types.ObjectId(input.threadId) : null;
    const propertyId = input.propertyId ? new Types.ObjectId(input.propertyId) : null;
    const sessionId = input.sessionId?.trim() || null;

    if (threadId) {
      const existing = await this.chatThreadModel.findById(threadId).exec();
      if (!existing) throw new NotFoundException('Chat thread not found');
      if (memberId && existing.memberId && String(existing.memberId) !== String(memberId)) {
        throw new NotFoundException('Chat thread not found');
      }
      if (sessionId && existing.sessionId && existing.sessionId !== sessionId) {
        throw new NotFoundException('Chat thread not found');
      }
      if (memberId && !existing.memberId) {
        existing.memberId = memberId;
        existing.sessionId = null;
        await existing.save();
      }
      return existing as unknown as ChatThreadDoc;
    }

    if (!memberId && !sessionId) {
      throw new InternalServerErrorException('sessionId is required for guest chat');
    }

    let existing: any = null;

    if (memberId && sessionId) {
      const guestThread = await this.chatThreadModel.findOne({
        sessionId,
        propertyId: propertyId ?? null,
        memberId: null,
      }).sort({ updatedAt: -1 }).exec();

      if (guestThread) {
        guestThread.memberId = memberId;
        guestThread.sessionId = null;
        guestThread.updatedAt = new Date();
        await guestThread.save();
        existing = guestThread;
      }
    }

    if (!existing) {
      const search: Record<string, unknown> = {};
      if (propertyId) search.propertyId = propertyId;
      if (memberId) search.memberId = memberId;
      else if (sessionId) search.sessionId = sessionId;

      existing = await this.chatThreadModel.findOne(search).sort({ updatedAt: -1 }).exec();
    }

    if (!existing) {
      const title = this.buildThreadTitle('title' in input ? input.title : undefined, propertyId);
      existing = await this.chatThreadModel.create({
        memberId: memberId ?? null,
        sessionId,
        propertyId,
        title,
        status: ChatThreadStatus.OPEN,
        lastMessageAt: new Date(),
      });
    }

    return existing as unknown as ChatThreadDoc;
  }

  private async populateThread(threadId: Types.ObjectId): Promise<ChatThread> {
    const thread = await this.chatThreadModel.findById(threadId).lean().exec();
    if (!thread) throw new NotFoundException('Chat thread not found');

    const messages = await this.chatMessageModel
      .find({ threadId })
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    return {
      ...(thread as unknown as ChatThread),
      messages: messages.map((message: any) => this.mapMessage(message)),
    };
  }

  private mapMessage(message: any): ChatMessage {
    return {
      _id: message._id,
      threadId: message.threadId,
      senderType: message.senderType,
      content: message.content,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  private buildThreadTitle(explicitTitle?: string | null, propertyId?: Types.ObjectId | null): string {
    if (explicitTitle?.trim()) return explicitTitle.trim();
    if (propertyId) return 'Property support chat';
    return 'ROOMi support';
  }

  private async generateAssistantReply(
    threadId: Types.ObjectId,
    memberId: Types.ObjectId | null,
    userMessage: string,
    propertyId: Types.ObjectId | null,
    language: SupportedLanguage,
  ): Promise<string> {
    const context = await this.buildAssistantContext(threadId, memberId, propertyId, language);
    const structured = this.extractStructuredRequest(userMessage);
    const intent = this.detectIntent(userMessage);

    if (intent === "greeting" && !structured.dateText && !structured.guestText) {
      return this.buildGreetingReply(context, userMessage);
    }

    if (intent === "thanks" && !structured.dateText && !structured.guestText) {
      return this.buildThanksReply(context);
    }

    const bookingIntent = this.resolveBookingFlowIntent(intent, context, userMessage, structured);
    if (bookingIntent) {
      const bookingReply = await this.buildBookingFlowReply(context, propertyId, structured);
      if (bookingReply) return bookingReply;
    }

    const provider = this.resolveProviderConfig();
    const shouldAttemptProvider =
      provider.enabled && (provider.provider === "ollama" || provider.apiKey.length > 0 || provider.provider === "custom");

    if (shouldAttemptProvider) {
      const providerMessages = this.getProviderMessages(context, userMessage);
      const providerText = await this.callProvider(provider, context, providerMessages, userMessage);
      if (providerText) return providerText;
    }

    return this.buildFallbackReply(context, userMessage);
  }

  private resolveProviderConfig(): ProviderConfig {
    const fallbackProvider = process.env.OPENAI_API_KEY ? 'openai' : 'ollama';
    const providerValue = String(process.env.AI_PROVIDER ?? fallbackProvider).trim().toLowerCase();
    const provider: ProviderConfig['provider'] =
      providerValue === 'openai' ? 'openai' : providerValue === 'custom' ? 'custom' : 'ollama';

    const enabled = String(process.env.AI_ENABLED ?? 'true').trim().toLowerCase() !== 'false';
    const ollamaBaseUrl = String(process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1').trim().replace(/\/$/, '');
    const openAiBaseUrl = String(process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').trim().replace(/\/$/, '');
    const customBaseUrl = String(process.env.AI_BASE_URL ?? '').trim().replace(/\/$/, '');

    const baseUrl = provider === 'openai'
      ? openAiBaseUrl
      : provider === 'custom'
        ? customBaseUrl || ollamaBaseUrl
        : customBaseUrl || ollamaBaseUrl;

    const model = provider === 'openai'
      ? String(process.env.OPENAI_MODEL ?? 'gpt-4o-mini').trim()
      : provider === 'custom'
        ? String(process.env.AI_MODEL ?? process.env.OLLAMA_MODEL ?? process.env.OPENAI_MODEL ?? 'gemma3:1b').trim()
        : String(process.env.OLLAMA_MODEL ?? process.env.AI_MODEL ?? 'gemma3:1b').trim();

    const apiKey = provider === 'openai'
      ? String(process.env.OPENAI_API_KEY ?? process.env.AI_API_KEY ?? '').trim()
      : provider === 'custom'
        ? String(process.env.AI_API_KEY ?? process.env.OLLAMA_API_KEY ?? process.env.OPENAI_API_KEY ?? '').trim()
        : String(process.env.OLLAMA_API_KEY ?? process.env.AI_API_KEY ?? '').trim();

    return { provider, baseUrl, model, apiKey, enabled };
  }

  private buildProviderHeaders(provider: ProviderConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (provider.apiKey) {
      headers.Authorization = `Bearer ${provider.apiKey}`;
    }

    return headers;
  }

  private getProviderMessages(
    context: AssistantContext,
    currentUserMessage: string,
  ): Array<{ role: "user" | "assistant"; content: string }> {
    const messages = [...context.recentMessages];
    const last = messages[messages.length - 1];

    if (last?.role === "user" && last.content.trim() === currentUserMessage.trim()) {
      messages.pop();
    }

    return messages;
  }

  private async callProvider(
    provider: ProviderConfig,
    context: AssistantContext,
    providerMessages: Array<{ role: "user" | "assistant"; content: string }>,
    userMessage: string,
  ): Promise<string | null> {
    const endpoint = `${provider.baseUrl}/chat/completions`;

    try {
      const response = await axios.post(
        endpoint,
        {
          model: provider.model,
          temperature: 0.2,
          messages: [
            { role: "system", content: this.buildSystemPrompt(context) },
            ...providerMessages,
            { role: "user", content: userMessage },
          ],
        },
        {
          timeout: 20000,
          headers: this.buildProviderHeaders(provider),
        },
      );

      const text = response.data?.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch (error) {
      this.logProviderFailure(provider, endpoint, error);
    }

    if (provider.provider === "ollama") {
      return this.callNativeOllamaProvider(provider, context, providerMessages, userMessage);
    }

    return null;
  }

  private async callNativeOllamaProvider(
    provider: ProviderConfig,
    context: AssistantContext,
    providerMessages: Array<{ role: "user" | "assistant"; content: string }>,
    userMessage: string,
  ): Promise<string | null> {
    const nativeBaseUrl = provider.baseUrl.replace(/\/v1$/i, "");
    const endpoint = `${nativeBaseUrl}/api/chat`;

    try {
      const response = await axios.post(
        endpoint,
        {
          model: provider.model,
          stream: false,
          messages: [
            { role: "system", content: this.buildSystemPrompt(context) },
            ...providerMessages,
            { role: "user", content: userMessage },
          ],
        },
        {
          timeout: 20000,
          headers: this.buildProviderHeaders(provider),
        },
      );

      const text = response.data?.message?.content?.trim();
      if (text) return text;
    } catch (error) {
      this.logProviderFailure(provider, endpoint, error);
    }

    return null;
  }

  private logProviderFailure(provider: ProviderConfig, endpoint: string, error: unknown): void {
    const status = axios.isAxiosError(error) ? error.response?.status ?? "network" : "unknown";
    const message = error instanceof Error ? error.message : String(error);

    console.warn("[chatbot] provider_failed", {
      provider: provider.provider,
      endpoint,
      model: provider.model,
      status,
      message,
    });
  }

  private async buildAssistantContext(
    threadId: Types.ObjectId,
    memberId: Types.ObjectId | null,
    propertyId: Types.ObjectId | null,
    language: SupportedLanguage,
  ): Promise<AssistantContext> {
    const recentMessages = await this.chatMessageModel
      .find({ threadId })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean()
      .exec();

    const reversed = [...recentMessages].reverse().map((message: any) => ({
      role: message.senderType === ChatSenderType.USER ? ('user' as const) : ('assistant' as const),
      content: String(message.content || ''),
    }));

    let propertySummary: string | undefined;
    let availabilitySummary: string | undefined;

    if (propertyId) {
      const property = await this.propertyService.getPropertyForPricing(propertyId);
      propertySummary = [
        `title=${property.propertyTitle ?? 'unknown'}`,
        `type=${property.propertyType ?? 'unknown'}`,
        `basePrice=${property.propertyPrice ?? 0}`,
        `rating=${property.propertyRank ?? 0}`,
        `views=${property.propertyViews ?? 0}`,
        `likes=${property.propertyLikes ?? 0}`,
      ].join(', ');

      const preview = await this.availabilityService.getPropertyPricePreview({
        propertyId,
        startDate: formatDateOnly(new Date()),
        endDate: this.getFutureDateYmd(7),
      });

      availabilitySummary = this.renderPricePreviewSummary(preview);
    }

    const policySummary = [
      'Answers should be concise, practical, and focused on ROOMi booking support.',
      'Explain weekend pricing in terms of nightly price, not a booking-wide markup.',
      'If a direct answer is not available, ask for property, date, or booking details.',
      'Never expose raw database internals or mention hidden implementation details.',
    ].join(' ');

    return {
      language,
      propertySummary,
      availabilitySummary,
      policySummary,
      recentMessages: reversed,
    };
  }

  private buildSystemPrompt(context: AssistantContext): string {
    const languageInstructions = {
      en: 'Respond in English.',
      ko: '한국어로 답변하세요.',
      uz: 'Javobni o‘zbek tilida bering.',
    }[context.language];

    const sections = [
      'You are ROOMi AI assistant for property booking support.',
      'Reply naturally and politely like a helpful human support agent.',
      'Never reveal raw context strings, database-like keys, debug output, or internal labels.',
      'Do not repeat values using formats such as title=..., type=..., nights=..., total=..., sample=....',
      'Use the supplied context only to answer in normal conversational language.',
      context.policySummary,
      languageInstructions,
      context.propertySummary ? `Property context: ${context.propertySummary}` : 'Property context: none',
      context.availabilitySummary ? `Availability context: ${context.availabilitySummary}` : 'Availability context: unavailable',
      'Use only the supplied context, and be honest when information is missing.',
    ];

    return sections.join('\n');
  }

  private resolveBookingFlowIntent(
    intent: AssistantIntent,
    context: AssistantContext,
    userMessage: string,
    structured: StructuredBookingRequest,
  ): "pricing" | "availability" | null {
    if (intent === "pricing" || intent === "availability") return intent;
    if (structured.dateText || structured.guestText) return "pricing";
    if (this.isBookingContinuation(context, userMessage)) return "pricing";
    return null;
  }

  private isBookingContinuation(context: AssistantContext, currentUserMessage: string): boolean {
    const priorMessages = this.getProviderMessages(context, currentUserMessage);
    const lastAssistant = [...priorMessages].reverse().find((message) => message.role === "assistant");
    const content = lastAssistant?.content.toLowerCase() ?? "";

    return /(date|dates|guest count|guests|property name|property id|exact price|availability|sana|mehmon|narx|mavjud|날짜|투숙객|요금)/i.test(content);
  }

  private async buildBookingFlowReply(
    context: AssistantContext,
    propertyId: Types.ObjectId | null,
    structured: StructuredBookingRequest,
  ): Promise<string | null> {
    const copy = this.getBookingCopy(context.language);

    if (!propertyId) {
      return copy.propertyRequired;
    }

    if (!structured.startDate || !structured.endDate) {
      return structured.guestCount ? copy.missingDate : copy.clarify;
    }

    const dateRange = this.formatDateRangeForReply(structured.startDate, structured.endDate);

    if (!structured.guestCount) {
      return copy.missingGuest(dateRange);
    }

    try {
      const preview = await this.availabilityService.getPropertyPricePreview({
        propertyId,
        startDate: structured.startDate,
        endDate: structured.endDate,
      });
      const propertyName = this.extractPropertyName(context.propertySummary) ?? "this property";
      const lockedDates = preview.dates
        .filter((item) => String(item.mode).toUpperCase() === "LOCKED")
        .map((item) => item.date);

      return copy.pricePreview(propertyName, dateRange, structured.guestCount, preview, lockedDates);
    } catch (error) {
      console.warn("[chatbot] price_preview_failed", {
        propertyId: String(propertyId),
        startDate: structured.startDate,
        endDate: structured.endDate,
        message: error instanceof Error ? error.message : String(error),
      });
      return copy.previewUnavailable;
    }
  }

  private getBookingCopy(language: SupportedLanguage): {
    clarify: string
    missingGuest: (dateRange: string) => string
    missingDate: string
    propertyRequired: string
    previewUnavailable: string
    pricePreview: (
      propertyName: string,
      dateRange: string,
      guestCount: number,
      preview: PricePreview,
      lockedDates: string[],
    ) => string
  } {
    if (language === "ko") {
      return {
        clarify: "정확한 요금과 예약 가능 여부를 확인하려면 날짜와 투숙객 수를 보내 주세요.",
        missingGuest: (dateRange: string) => `${dateRange}로 확인하겠습니다. 투숙객 수를 알려 주세요.`,
        missingDate: "투숙객 수는 확인했습니다. 날짜도 보내 주시면 정확한 요금과 예약 가능 여부를 확인하겠습니다.",
        propertyRequired: "정확히 확인하려면 숙소 이름이나 ID도 보내 주세요.",
        previewUnavailable: "지금은 해당 날짜의 요금 확인이 어렵습니다. 잠시 후 다시 시도해 주세요.",
        pricePreview: (propertyName, dateRange, guestCount, preview, lockedDates) => {
          const availabilityText = lockedDates.length
            ? `현재 예약이 어려운 날짜가 있습니다: ${lockedDates.join(", ")}.`
            : "현재 가격 캘린더 기준으로 선택한 날짜는 예약 가능해 보입니다.";
          return `${propertyName} 기준 ${dateRange}, ${guestCount}명 예상 요금은 총 ${this.formatMoney(preview.totalPrice)}입니다. 평균 1박 요금은 ${this.formatMoney(preview.averagePrice)}입니다. ${availabilityText}`;
        },
      };
    }

    if (language === "uz") {
      return {
        clarify: "Aniq narx va mavjudlikni tekshirish uchun sana va mehmonlar sonini yuboring.",
        missingGuest: (dateRange: string) => `${dateRange} sanasi uchun tekshiraman. Mehmonlar sonini ham yuboring.`,
        missingDate: "Mehmonlar sonini oldim. Aniq narx va mavjudlik uchun sanani ham yuboring.",
        propertyRequired: "Aniq tekshirish uchun property nomi yoki ID sini ham yuboring.",
        previewUnavailable: "Hozir bu sana uchun narxni tekshira olmadim. Birozdan keyin qayta urinib koering.",
        pricePreview: (propertyName, dateRange, guestCount, preview, lockedDates) => {
          const availabilityText = lockedDates.length
            ? `Bu sanalarda band yoki yopiq kun bor: ${lockedDates.join(", ")}.`
            : "Hozirgi narx kalendari boyicha bu sanalar mavjud korinyapti.";
          return `${propertyName} uchun ${dateRange}, ${guestCount} ta mehmon: jami taxminiy narx ${this.formatMoney(preview.totalPrice)}. Ortacha bir kecha ${this.formatMoney(preview.averagePrice)}. ${availabilityText}`;
        },
      };
    }

    return {
      clarify: "Send the dates and guest count and I will check the exact price and availability.",
      missingGuest: (dateRange: string) => `I can check ${dateRange}. Send the guest count too, please.`,
      missingDate: "Got the guest count. Send the date as well and I will check the exact price and availability.",
      propertyRequired: "Send the property name or ID too, so I can check the exact price and availability.",
      previewUnavailable: "I could not check that date right now. Please try again in a moment.",
      pricePreview: (propertyName, dateRange, guestCount, preview, lockedDates) => {
        const availabilityText = lockedDates.length
          ? `Some selected nights are locked or unavailable: ${lockedDates.join(", ")}.`
          : "The selected dates look available in the current pricing calendar.";
        return `For ${propertyName}, ${dateRange}, ${guestCount} guest${guestCount === 1 ? "" : "s"}: estimated total is ${this.formatMoney(preview.totalPrice)}. Average nightly price is ${this.formatMoney(preview.averagePrice)}. ${availabilityText}`;
      },
    };
  }

  private formatMoney(value: number): string {
    return `${Math.round(value).toLocaleString("en-US")} UZS`;
  }

  private formatDateRangeForReply(startDate: string, endDate: string): string {
    const nextDay = this.addDays(startDate, 1);
    if (endDate === nextDay) return startDate;
    return `${startDate} to ${endDate}`;
  }

  private buildFallbackReply(context: AssistantContext, userMessage: string): string {
    const normalized = userMessage.toLowerCase();
    const asksPrice = /price|narx|cost|tarif|weekend|week end/.test(normalized);
    const asksAvailability = /available|free|bo'sh|bo'shmi|availability|band/.test(normalized);
    const copy = this.getLanguageCopy(context.language);
    const propertyName = this.extractPropertyName(context.propertySummary);

    if (propertyName) {
      if (asksPrice || asksAvailability) {
        return `${copy.sure}. ${copy.greetingForProperty(propertyName)} ${copy.priceHelp}`;
      }

      return `${copy.greetingForProperty(propertyName)} ${copy.dateHelp}`;
    }

    if (asksPrice) {
      return copy.noPropertyPrice;
    }

    if (/^(hi|hello|hey|salom|assalomu alaykum|salam|hola|안녕|여보세요)\b/i.test(userMessage.trim())) {
      return copy.general;
    }

    return copy.general;
  }

  private detectIntent(userMessage: string): AssistantIntent {
    const normalized = userMessage.trim().toLowerCase();
    if (/^(hi|hello|hey|salom|assalomu alaykum|salam|hola|안녕|여보세요)\b/i.test(normalized)) {
      return 'greeting';
    }

    if (/(thanks|thank you|rahmat|tasakkur|감사|고마워)/i.test(normalized)) {
      return 'thanks';
    }

    if (/(price|narx|cost|tarif|weekend|week end|rate|to'lov|payment|summa)/i.test(normalized)) {
      return 'pricing';
    }

    if (/(available|free|bo'sh|bo'shmi|availability|band|vacant|open)/i.test(normalized)) {
      return 'availability';
    }

    return 'general';
  }

  private buildGreetingReply(context: AssistantContext, userMessage: string): string {
    const copy = this.getLanguageCopy(context.language);
    const propertyName = this.extractPropertyName(context.propertySummary);
    const greetingVariants = copy.greetingVariants(propertyName);
    const selector = this.pickVariantIndex(userMessage, greetingVariants.length);
    return greetingVariants[selector];
  }

  private buildThanksReply(context: AssistantContext): string {
    const copy = this.getLanguageCopy(context.language);
    return copy.thanks;
  }

  private buildClarificationReply(context: AssistantContext, intent: Exclude<AssistantIntent, 'greeting' | 'thanks' | 'general'>): string {
    const copy = this.getLanguageCopy(context.language);
    if (intent === 'pricing' || intent === 'availability') {
      return copy.clarify;
    }

    return copy.general;
  }

  private extractStructuredRequest(userMessage: string): StructuredBookingRequest {
    const normalized = userMessage.trim();
    const dateRange = this.extractDateRange(normalized);
    const guestCount = this.extractGuestCount(normalized);

    return {
      dateText: dateRange ? normalized : null,
      guestText: guestCount ? normalized : null,
      startDate: dateRange?.startDate ?? null,
      endDate: dateRange?.endDate ?? null,
      guestCount,
    };
  }

  private extractDateRange(message: string): { startDate: string; endDate: string } | null {
    const normalized = message.toLowerCase().replace(/,/g, " ").replace(/\s+/g, " ").trim();

    const isoRange = normalized.match(/\b(\d{4}-\d{2}-\d{2})(?:\s*(?:to|until|-|–|—)\s*(\d{4}-\d{2}-\d{2}))?\b/i);
    if (isoRange?.[1] && this.isValidDateOnly(isoRange[1])) {
      return this.normalizeDateRange(isoRange[1], isoRange[2]);
    }

    const slashRange = normalized.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s*(?:to|until|-|–|—)\s*(\d{1,2})\/(\d{1,2})\/(\d{4}))?\b/i);
    if (slashRange?.[1]) {
      const startDate = this.formatPartsAsDate(Number(slashRange[3]), Number(slashRange[2]) - 1, Number(slashRange[1]));
      const endDate = slashRange[4]
        ? this.formatPartsAsDate(Number(slashRange[6]), Number(slashRange[5]) - 1, Number(slashRange[4]))
        : null;
      if (startDate) return this.normalizeDateRange(startDate, endDate ?? undefined);
    }

    const relativeRange = this.extractRelativeDateRange(normalized);
    if (relativeRange) return relativeRange;

    const dayMonthRange = normalized.match(/\b(\d{1,2})\s*(?:-|to|until|–|—)\s*(\d{1,2})\s+([a-zA-Z]+)\b/i);
    if (dayMonthRange?.[1]) {
      const monthIndex = this.getMonthIndex(dayMonthRange[3]);
      if (monthIndex !== null) {
        const startDate = this.dateFromDayMonth(Number(dayMonthRange[1]), monthIndex);
        const endDate = this.dateFromDayMonth(Number(dayMonthRange[2]), monthIndex);
        if (startDate && endDate) return this.normalizeDateRange(startDate, endDate);
      }
    }

    const monthDayRange = normalized.match(/\b([a-zA-Z]+)\s+(\d{1,2})\s*(?:-|to|until|–|—)\s*(?:([a-zA-Z]+)\s+)?(\d{1,2})\b/i);
    if (monthDayRange?.[1]) {
      const startMonth = this.getMonthIndex(monthDayRange[1]);
      const endMonth = this.getMonthIndex(monthDayRange[3] || monthDayRange[1]);
      if (startMonth !== null && endMonth !== null) {
        const startDate = this.dateFromDayMonth(Number(monthDayRange[2]), startMonth);
        const endDate = this.dateFromDayMonth(Number(monthDayRange[4]), endMonth);
        if (startDate && endDate) return this.normalizeDateRange(startDate, endDate);
      }
    }

    const dayMonth = normalized.match(/\b(\d{1,2})\s+([a-zA-Z]+)\b/i);
    if (dayMonth?.[1]) {
      const monthIndex = this.getMonthIndex(dayMonth[2]);
      if (monthIndex !== null) {
        const startDate = this.dateFromDayMonth(Number(dayMonth[1]), monthIndex);
        if (startDate) return this.normalizeDateRange(startDate);
      }
    }

    const monthDay = normalized.match(/\b([a-zA-Z]+)\s+(\d{1,2})\b/i);
    if (monthDay?.[1]) {
      const monthIndex = this.getMonthIndex(monthDay[1]);
      if (monthIndex !== null) {
        const startDate = this.dateFromDayMonth(Number(monthDay[2]), monthIndex);
        if (startDate) return this.normalizeDateRange(startDate);
      }
    }

    return null;
  }

  private extractRelativeDateRange(normalized: string): { startDate: string; endDate: string } | null {
    if (/\b(today|tonight|오늘)\b/i.test(normalized)) {
      const startDate = this.dateFromOffset(0);
      return { startDate, endDate: this.addDays(startDate, 1) };
    }

    if (/\b(tomorrow|내일)\b/i.test(normalized)) {
      const startDate = this.dateFromOffset(1);
      return { startDate, endDate: this.addDays(startDate, 1) };
    }

    if (/\bnext weekend\b/i.test(normalized)) {
      return this.weekendRange(1);
    }

    if (/\b(this weekend|weekend|이번 주말|다음 주말)\b/i.test(normalized)) {
      return this.weekendRange(0);
    }

    return null;
  }

  private extractGuestCount(message: string): number | null {
    const normalized = message.toLowerCase().replace(/,/g, " ").replace(/\s+/g, " ").trim();
    const numericWithUnit = normalized.match(/\b(\d{1,2})\s*(guest|guests|person|people|pax|mehmon|mehmonlar|kishi|odam)\b/i);
    if (numericWithUnit?.[1]) return this.normalizeGuestCount(Number(numericWithUnit[1]));

    const forNumeric = normalized.match(/\bfor\s+(\d{1,2})\b/i);
    if (forNumeric?.[1]) return this.normalizeGuestCount(Number(forNumeric[1]));

    const wordMap: Record<string, number> = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      bir: 1,
      ikki: 2,
      uch: 3,
      tort: 4,
      besh: 5,
      olti: 6,
      yetti: 7,
      sakkiz: 8,
      toqqiz: 9,
      on: 10,
    };

    const wordWithUnit = normalized.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|bir|ikki|uch|tort|besh|olti|yetti|sakkiz|toqqiz|on)\s*(guest|guests|person|people|pax|mehmon|mehmonlar|kishi|odam)\b/i);
    if (wordWithUnit?.[1]) return this.normalizeGuestCount(wordMap[wordWithUnit[1]]);

    return null;
  }

  private normalizeGuestCount(value: number): number | null {
    if (!Number.isInteger(value) || value < 1 || value > 30) return null;
    return value;
  }

  private getMonthIndex(value: string): number | null {
    const key = value.toLowerCase().replace(/\./g, "");
    const months: Record<string, number> = {
      january: 0,
      jan: 0,
      yanvar: 0,
      february: 1,
      feb: 1,
      fevral: 1,
      march: 2,
      mar: 2,
      mart: 2,
      april: 3,
      apr: 3,
      aprel: 3,
      may: 4,
      june: 5,
      jun: 5,
      iyun: 5,
      july: 6,
      jul: 6,
      iyul: 6,
      august: 7,
      aug: 7,
      avgust: 7,
      september: 8,
      sep: 8,
      sept: 8,
      sentabr: 8,
      october: 9,
      oct: 9,
      oktabr: 9,
      november: 10,
      nov: 10,
      noyabr: 10,
      december: 11,
      dec: 11,
      dekabr: 11,
    };

    return months[key] ?? null;
  }

  private dateFromDayMonth(day: number, monthIndex: number): string | null {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const candidate = new Date(Date.UTC(currentYear, monthIndex, day, 12, 0, 0, 0));
    if (candidate.getUTCMonth() !== monthIndex || candidate.getUTCDate() !== day) return null;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const candidateDay = new Date(candidate);
    candidateDay.setUTCHours(0, 0, 0, 0);

    if (candidateDay < today) {
      candidate.setUTCFullYear(currentYear + 1);
    }

    return formatDateOnly(candidate);
  }

  private dateFromOffset(daysAhead: number): string {
    const date = new Date();
    date.setUTCHours(12, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() + daysAhead);
    return formatDateOnly(date);
  }

  private weekendRange(weeksAhead: number): { startDate: string; endDate: string } {
    const today = new Date();
    today.setUTCHours(12, 0, 0, 0);
    const daysUntilSaturday = (6 - today.getUTCDay() + 7) % 7;
    const startOffset = daysUntilSaturday + weeksAhead * 7;
    const startDate = this.dateFromOffset(startOffset);
    return { startDate, endDate: this.addDays(startDate, 2) };
  }

  private formatPartsAsDate(year: number, monthIndex: number, day: number): string | null {
    const date = new Date(Date.UTC(year, monthIndex, day, 12, 0, 0, 0));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== monthIndex || date.getUTCDate() !== day) return null;
    return formatDateOnly(date);
  }

  private normalizeDateRange(startDate: string, explicitEndDate?: string | null): { startDate: string; endDate: string } {
    let endDate = explicitEndDate || this.addDays(startDate, 1);
    if (this.compareDateOnly(endDate, startDate) <= 0) {
      endDate = this.addDays(startDate, 1);
    }

    return { startDate, endDate };
  }

  private isValidDateOnly(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && this.formatPartsAsDate(
      Number(value.slice(0, 4)),
      Number(value.slice(5, 7)) - 1,
      Number(value.slice(8, 10)),
    ) === value;
  }

  private compareDateOnly(left: string, right: string): number {
    return left.localeCompare(right);
  }

  private addDays(dateOnly: string, days: number): string {
    const date = new Date(`${dateOnly}T12:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return formatDateOnly(date);
  }

  private pickVariantIndex(seed: string, length: number): number {
    if (length <= 1) return 0;

    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) {
      hash = (hash << 5) - hash + seed.charCodeAt(index);
      hash |= 0;
    }

    return Math.abs(hash) % length;
  }

  private renderPricePreviewSummary(preview: PricePreview): string {
    const sample = preview.dates.slice(0, 4).map((item) => {
      const mode = item.mode.toLowerCase();
      return `${item.date}:${item.pricePerDay}(${mode})`;
    });

    return [
      `nights=${preview.nights}`,
      `total=${preview.totalPrice}`,
      `avg=${preview.averagePrice}`,
      `sample=${sample.join(', ')}`,
    ].join(', ');
  }

  private getFutureDateYmd(daysAhead: number): string {
    const cursor = new Date();
    cursor.setUTCHours(12, 0, 0, 0);
    cursor.setUTCDate(cursor.getUTCDate() + daysAhead);
    return formatDateOnly(cursor);
  }

  private normalizeLanguage(value?: string | null): SupportedLanguage {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'ko' || normalized === 'uz') return normalized;
    return 'en';
  }

  private getLanguageCopy(language: SupportedLanguage): {
    sure: string
    priceHelp: string
    dateHelp: string
    noPropertyPrice: string
    general: string
    greetingForProperty: (propertyName: string) => string
    greetingVariants: (propertyName?: string | null) => string[]
    thanks: string
    clarify: string
  } {
    if (language === 'ko') {
      return {
        sure: '물론입니다',
        priceHelp: '원하시면 날짜를 보내주시면 총 요금을 계산해 드리겠습니다.',
        dateHelp: '날짜와 투숙객 수를 알려주시면 정확한 요금과 예약 가능 여부를 확인해 드리겠습니다.',
        noPropertyPrice: '요금을 보려면 숙소 이름이나 ID를 보내 주세요. 주말에는 자동으로 가격이 올라갈 수 있지만 최종 금액은 날짜에 따라 계산됩니다.',
        general: 'ROOMi 상담이 준비되어 있습니다. 숙소, 예약 또는 요금에 대해 질문해 주세요.',
        greetingForProperty: (propertyName: string) => `${propertyName}에 대해 도와드리겠습니다.`,
        greetingVariants: (propertyName?: string | null) => {
          if (propertyName) {
            return [
              `${propertyName}에 오신 것을 환영합니다. 무엇을 도와드릴까요?`,
              `${propertyName} 관련해서 궁금한 점이 있으시면 말씀해 주세요.`,
              `${propertyName} 예약이나 요금 확인을 도와드릴게요.`,
            ];
          }

          return [
            '안녕하세요. 무엇을 도와드릴까요?',
            '반갑습니다. 숙소, 예약, 요금 관련해서 말씀해 주세요.',
            '안녕하세요. 원하는 날짜나 숙소를 알려주시면 바로 도와드리겠습니다.',
          ];
        },
        thanks: '천만에요. 또 궁금한 점이 있으면 말씀해 주세요.',
        clarify: '정확한 요금과 예약 가능 여부를 확인하려면 날짜와 투숙객 수를 보내 주세요.',
      }
    }

    if (language === 'uz') {
      return {
        sure: 'Albatta',
        priceHelp: 'Agar xohlasangiz, sanani yuboring, men jami narxni hisoblab beraman.',
        dateHelp: 'Sana va mehmonlar sonini yozing, men aniq narx va mavjud sanalarni tekshirib beraman.',
        noPropertyPrice: 'Narxlarni ko‘rish uchun property nomi yoki ID sini yuboring. Weekend kunlari avtomatik narx oshishi mumkin, lekin yakuniy qiymat sanaga qarab hisoblanadi.',
        general: 'ROOMi yordam chat faol. Property, booking yoki narx bo‘yicha savolingizni yozing, men yordam beraman.',
        greetingForProperty: (propertyName: string) => `${propertyName} bo‘yicha yordam beraman.`,
        greetingVariants: (propertyName?: string | null) => {
          if (propertyName) {
            return [
              `${propertyName} bo‘yicha yordam beraman. Nima kerak bo‘lsa yozing.`,
              `${propertyName} haqida savolingiz bo‘lsa, yozavering.`,
              `${propertyName} uchun narx yoki mavjud sanalarni tekshirib beraman.`,
            ];
          }

          return [
            'Salom. Qanday yordam beray?',
            'Assalomu alaykum. Property, booking yoki narx bo‘yicha yozing.',
            'Salom! Sana yoki property yuborsangiz, tezda tekshirib beraman.',
          ];
        },
        thanks: 'Arzimaydi. Yana savol bo‘lsa yozing.',
        clarify: 'Aniq narx va bo‘sh sanani tekshirish uchun sana va mehmonlar sonini yuboring.',
      }
    }

    return {
      sure: 'Sure',
      priceHelp: 'If you want, send the dates and I will calculate the total price.',
      dateHelp: 'Send the dates and guest count, and I will check the exact price and availability.',
      noPropertyPrice: 'Send the property name or ID to see pricing. Weekend dates may be priced higher automatically, but the final amount is calculated by date.',
      general: 'ROOMi support chat is ready. Ask me about properties, bookings, or pricing.',
      greetingForProperty: (propertyName: string) => `I can help with ${propertyName}.`,
      greetingVariants: (propertyName?: string | null) => {
        if (propertyName) {
          return [
            `I can help with ${propertyName}. What would you like to check?`,
            `You are looking at ${propertyName}. I can help with pricing or availability.`,
            `Sure, I can help with ${propertyName}. Send the dates if you want an exact price.`,
          ];
        }

        return [
          'Hi. How can I help?',
          'Hello. Ask me about a property, booking, or price.',
          'Hey. Send a date or property name and I will check it for you.',
        ];
      },
      thanks: 'You are welcome. If you need anything else, just ask.',
      clarify: 'Send the dates and guest count and I will check the exact price and availability.',
    }
  }

  private extractPropertyName(propertySummary?: string): string | null {
    if (!propertySummary) return null;
    const titleMatch = propertySummary.match(/title=([^,]+)/i);
    if (!titleMatch?.[1]) return null;

    const title = titleMatch[1].trim();
    return title && title !== 'unknown' ? title : null;
  }
}
