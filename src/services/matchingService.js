import { sendChatMessage, streamChatMessage, fetchRetrievalFlow, recordUserAction } from './chatService';
import { mapRecommendation } from '../utils/memberMapper';
import {
  resolveRetrievalFlow,
  isFallbackRetrievalFlow,
  mapFlowSteps,
  pickBestRetrievalFlow,
  patchQueryWithUserMessage,
} from '../constants/retrievalFlowSteps';

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchTraceRetrievalFlow(traceId, attempts = 2) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return mapFlowSteps(await fetchRetrievalFlow(traceId));
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await sleep(120);
      }
    }
  }
  throw lastError;
}

async function enrichRetrievalFlow(response, streamRetrievalFlow, streamTraceId, userMessage) {
  const traceId = streamTraceId || response?.analysis_insights?.trace_id;
  const userMsg = userMessage || response?.user_message;
  const candidates = [];

  if (streamRetrievalFlow?.length) {
    candidates.push(mapFlowSteps(streamRetrievalFlow));
  }
  if (response?.retrieval_flow?.length) {
    candidates.push(mapFlowSteps(response.retrieval_flow));
  }

  let best = pickBestRetrievalFlow(candidates);
  if (best.length && !isFallbackRetrievalFlow(best)) {
    return patchQueryWithUserMessage(best, userMsg);
  }

  if (traceId && (!best.length || isFallbackRetrievalFlow(best))) {
    try {
      const fromTrace = await fetchTraceRetrievalFlow(traceId);
      if (fromTrace.length && !isFallbackRetrievalFlow(fromTrace)) {
        return patchQueryWithUserMessage(fromTrace, userMsg);
      }
      if (fromTrace.length) {
        candidates.unshift(fromTrace);
        best = pickBestRetrievalFlow(candidates);
        if (best.length && !isFallbackRetrievalFlow(best)) {
          return patchQueryWithUserMessage(best, userMsg);
        }
      }
    } catch {
      /* trace API optional — fall back to stream payload */
    }
  }

  const resolved = resolveRetrievalFlow(
    { ...response, user_message: userMsg },
    streamRetrievalFlow,
    userMsg,
  );
  return patchQueryWithUserMessage(resolved, userMsg);
}

function mapGateRefusal(raw) {
  if (!raw) return null;
  return {
    variant: raw.variant || 'blocked',
    title: raw.title || '',
    body: raw.body || '',
    gateTag: raw.gate_tag || raw.gateTag || '',
    suggestions: (raw.suggestions || []).map((item) => ({
      label: item.label,
      value: item.value || item.label,
    })),
  };
}

function mapRelatedPost(item) {
  return {
    id: item.id,
    title: item.title,
    author: item.author,
    residentialZone: item.residential_zone,
    summary: item.summary || '',
    relatedGroupId: item.related_group_id || null,
    relatedEventId: item.related_event_id || null,
    reason: item.reason || [],
  };
}

function mapRelatedGroup(item) {
  return {
    id: item.id,
    name: item.name,
    memberCount: item.member_count,
    residentialZone: item.residential_zone,
    reason: item.reason || [],
  };
}

function mapRelatedEvent(item) {
  return {
    id: item.id,
    name: item.name,
    time: item.time,
    residentialZone: item.residential_zone,
    reason: item.reason || [],
  };
}

function normalizeChatResponse(response, streamRetrievalFlow, userMessage) {
  if (!response) {
    return {
      results: [],
      needGroups: [],
      quickReplies: [],
      clarifyingQuestion: null,
      retrievalFlow: [],
      gateRefusal: null,
    };
  }
  const gateRefusal = mapGateRefusal(response.gate_refusal);
  return {
    ...response,
    results: (response.recommendations || []).map(mapRecommendation),
    needGroups: (response.need_groups || []).map((group) => ({
      key: group.key,
      label: group.label,
      userQuote: group.user_quote,
      hint: group.hint || '',
      results: (group.recommendations || []).map(mapRecommendation),
    })),
    quickReplies: gateRefusal ? [] : (response.conversation_progress?.quick_replies || []),
    clarifyingQuestion: response.conversation_progress?.clarifying_question,
    relatedPosts: (response.related_posts || []).map(mapRelatedPost),
    relatedGroups: (response.related_groups || []).map(mapRelatedGroup),
    relatedEvents: (response.related_events || []).map(mapRelatedEvent),
    gateRefusal,
    retrievalFlow: resolveRetrievalFlow(
      { ...response, user_message: userMessage || response?.user_message },
      streamRetrievalFlow,
      userMessage,
    ),
  };
}

async function normalizeChatResponseAsync(response, streamRetrievalFlow, streamTraceId, userMessage) {
  const base = normalizeChatResponse(response, streamRetrievalFlow, userMessage);
  if (!response) return base;
  const retrievalFlow = await enrichRetrievalFlow(response, streamRetrievalFlow, streamTraceId, userMessage);
  return { ...base, retrievalFlow };
}

export async function matchWithAi({ message, conversationId }) {
  const response = await sendChatMessage({ message, conversationId });
  return normalizeChatResponseAsync(response, null, null, message);
}

export async function matchWithAiStream({ message, conversationId, onDelta, onMetadata, signal }) {
  let streamedText = '';
  const meta = await streamChatMessage({
    message,
    conversationId,
    signal,
    onDelta: (chunk, eventMeta) => {
      streamedText += chunk;
      if (onDelta) {
        onDelta(chunk, streamedText, eventMeta);
      }
    },
    onMetadata: (payload, streamRetrievalFlow, streamTraceId, userMessage) => {
      if (onMetadata) {
        onMetadata(
          normalizeChatResponse(payload, streamRetrievalFlow, userMessage || message),
          streamRetrievalFlow,
          streamTraceId,
          userMessage || message,
        );
      }
    },
  });

  const normalized = await normalizeChatResponseAsync(
    meta.response,
    meta.retrieval_flow,
    meta.trace_id,
    meta.user_message || message,
  );
  const finalAssistantMessage =
    meta.assistant_message || normalized.assistant_message || streamedText;
  return {
    ...normalized,
    conversation_id: meta.conversation_id || normalized.conversation_id,
    message_id: meta.message_id || normalized.message_id,
    assistant_message: finalAssistantMessage,
    retrievalFlow: normalized.retrievalFlow || [],
    trace_id: meta.trace_id || normalized.analysis_insights?.trace_id || null,
  };
}

export { recordUserAction };
