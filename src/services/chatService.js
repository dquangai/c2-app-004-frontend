import apiClient from './apiClient';
import { API_BASE_URL } from '../config/api';

export async function sendChatMessage({ message, conversationId }) {
  const { data } = await apiClient.post('/api/ai/chat', {
    message,
    user_id: 'legacy-ignored',
    conversation_id: conversationId || null,
  });
  return data;
}

/**
 * Stream assistant text via SSE, then receive structured metadata.
 */
export async function streamChatMessage({
  message,
  conversationId,
  onDelta,
  onMetadata,
  signal,
}) {
  const token = localStorage.getItem('token');
  const base = API_BASE_URL || '';
  const response = await fetch(`${base}/api/ai/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message,
      user_id: 'legacy-ignored',
      conversation_id: conversationId || null,
    }),
    signal,
  });

  if (!response.ok) {
    let detail = 'Không thể kết nối trợ lý AI';
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === 'string' ? detail : 'Không thể kết nối trợ lý AI');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Trình duyệt không hỗ trợ streaming');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let streamMeta = { conversation_id: conversationId || null, message_id: null, assistant_message: null };
  let finalPayload = null;
  let streamRetrievalFlow = null;
  let streamTraceId = null;
  let streamUserMessage = null;

  const dispatchEvent = (block) => {
    const normalized = block.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    if (!normalized || normalized.startsWith(':')) return;

    const lines = normalized.split('\n');
    let eventName = 'message';
    let dataLine = '';
    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLine += line.slice(5).trim();
      }
    }
    if (!dataLine) return;
    let parsed;
    try {
      parsed = JSON.parse(dataLine);
    } catch {
      return;
    }
    if (parsed.conversation_id) {
      streamMeta.conversation_id = parsed.conversation_id;
    }
    if (parsed.message_id) {
      streamMeta.message_id = parsed.message_id;
    }
    if (parsed.trace_id) {
      streamTraceId = parsed.trace_id;
    }
    if (parsed.user_message) {
      streamUserMessage = parsed.user_message;
    }
    if (eventName === 'assistant_delta' && parsed.text && onDelta) {
      onDelta(parsed.text, parsed);
    }
    if (eventName === 'error') {
      const rawDetail = parsed.detail || parsed.message || 'Không thể kết nối trợ lý AI';
      const friendly =
        parsed.detail && parsed.message === 'chat_stream_failed'
          ? `Trợ lý AI gặp lỗi xử lý (${String(parsed.detail).slice(0, 120)}). Thử cuộc trò chuyện mới hoặc khởi động lại backend.`
          : rawDetail === 'chat_stream_failed'
            ? 'Trợ lý AI gặp lỗi xử lý. Hãy bắt đầu cuộc trò chuyện mới hoặc khởi động lại backend.'
            : rawDetail;
      throw new Error(friendly);
    }
    if (eventName === 'retrieval_flow') {
      if (parsed.trace_id) {
        streamTraceId = parsed.trace_id;
      }
      if (parsed.user_message) {
        streamUserMessage = parsed.user_message;
      }
      if (parsed.steps?.length) {
        streamRetrievalFlow = parsed.steps;
      }
      if (onMetadata && streamRetrievalFlow?.length) {
        onMetadata(null, streamRetrievalFlow, streamTraceId, streamUserMessage);
      }
      return;
    }
    if (eventName === 'metadata') {
      if (parsed.assistant_message) {
        streamMeta.assistant_message = parsed.assistant_message;
      }
      if (parsed.trace_id) {
        streamTraceId = parsed.trace_id;
      }
      if (parsed.user_message) {
        streamUserMessage = parsed.user_message;
      }
      const topRetrievalFlow = parsed.retrieval_flow?.length ? parsed.retrieval_flow : null;
      if (topRetrievalFlow) {
        streamRetrievalFlow = topRetrievalFlow;
      }
      if (parsed.response) {
        const nestedRetrievalFlow = parsed.response.retrieval_flow?.length
          ? parsed.response.retrieval_flow
          : streamRetrievalFlow;
        finalPayload = {
          ...parsed.response,
          retrieval_flow: nestedRetrievalFlow || [],
        };
        if (!streamRetrievalFlow?.length && nestedRetrievalFlow?.length) {
          streamRetrievalFlow = nestedRetrievalFlow;
        }
        if (onMetadata) {
          onMetadata(finalPayload, streamRetrievalFlow, streamTraceId, streamUserMessage);
        }
      } else if (topRetrievalFlow && onMetadata) {
        onMetadata(null, streamRetrievalFlow, streamTraceId, streamUserMessage);
      }
    }
  };

  const flushBuffer = () => {
    const normalized = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const parts = normalized.split('\n\n');
    buffer = parts.pop() || '';
    for (const part of parts) {
      dispatchEvent(part);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    flushBuffer();
  }

  if (buffer.trim()) {
    dispatchEvent(buffer);
  }

  return {
    conversation_id: streamMeta.conversation_id,
    message_id: streamMeta.message_id,
    assistant_message: streamMeta.assistant_message || finalPayload?.assistant_message || null,
    response: finalPayload,
    retrieval_flow: streamRetrievalFlow || finalPayload?.retrieval_flow || [],
    trace_id: streamTraceId || finalPayload?.analysis_insights?.trace_id || null,
    user_message: streamUserMessage,
  };
}

/** Fetch authoritative retrieval steps — same auth path as other chat API calls. */
export async function fetchRetrievalFlow(traceId) {
  if (!traceId) return [];
  const { data } = await apiClient.get(
    `/api/ai/traces/${encodeURIComponent(traceId)}/retrieval-flow`,
  );
  return data?.steps || [];
}

export async function recordUserAction({ actionType, targetId, conversationId, metadata = {} }) {
  const { data } = await apiClient.post('/api/ai/actions', {
    user_id: 'legacy-ignored',
    action_type: actionType,
    target_id: targetId,
    conversation_id: conversationId || null,
    metadata,
  });
  return data;
}

export async function getUserMemory() {
  const { data } = await apiClient.get('/api/ai/memory/me');
  return data;
}

export async function deleteConversation(conversationId) {
  const { data } = await apiClient.delete(`/api/ai/conversations/${conversationId}`);
  return data;
}

export async function clearAllConversations({ trimQueryMemory = true } = {}) {
  const { data } = await apiClient.delete('/api/ai/conversations', {
    params: { trim_query_memory: trimQueryMemory },
  });
  return data;
}
