const RETRIEVAL_STEP_LABELS = {
  query: '1. Query ngữ cảnh',
  embed: '2. Embedding semantic',
  search: '3. Vector search',
  rank: '4. Ranking & chấm điểm',
  result: '5. Kết quả gợi ý',
};

const FALLBACK_SEARCH_DETAIL = 'Vector search catalog';
const REAL_SEARCH_PATTERN = /ứng viên|fresh|cache|semantic cache|exact cache|≥\d+/i;

export function mapFlowSteps(steps) {
  return (steps || []).map((step) => ({
    id: step.id,
    label: step.label,
    status: step.status,
    detail: step.detail,
  }));
}

export function isFallbackRetrievalFlow(steps) {
  if (!steps?.length) return true;
  const search = steps.find((step) => step.id === 'search');
  if (!search?.detail) return true;
  if (search.detail === FALLBACK_SEARCH_DETAIL) return true;
  return !REAL_SEARCH_PATTERN.test(search.detail);
}

function formatEntityValue(value) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value);
}

function countRecommendations(response) {
  if (!response) return 0;
  const flat = response.recommendations?.length || 0;
  if (flat > 0) return flat;
  return (response.need_groups || []).reduce(
    (sum, group) => sum + (group.recommendations?.length || 0),
    0,
  );
}

function buildQueryDetail(response, userMessage) {
  const message = userMessage || response?.user_message || response?.message;
  const summary = response?.user_request_summary || response?.userRequestSummary;
  const entities = response?.entities || {};
  const entityBits = ['location', 'skill', 'service', 'subject', 'time']
    .filter((key) => entities[key])
    .map((key) => `${key}=${formatEntityValue(entities[key])}`);

  const parts = [];
  if (message) parts.push(`"${message}"`);
  if (summary && !String(summary).toLowerCase().startsWith('người dùng cần')) {
    parts.push(summary);
  }
  if (entityBits.length) parts.push(entityBits.join(', '));
  return parts.join(' · ') || 'Từ tin nhắn + slot';
}

/** Last resort when stream metadata and trace API are unavailable. */
export function buildFallbackRetrievalFlow(response, userMessage) {
  if (!response) return [];
  const recommendationCount = countRecommendations(response);
  const relatedCount =
    (response.related_groups?.length || 0) +
    (response.related_events?.length || 0) +
    (response.related_posts?.length || 0);
  if (recommendationCount === 0 && relatedCount === 0) return [];

  return [
    {
      id: 'query',
      label: RETRIEVAL_STEP_LABELS.query,
      status: 'done',
      detail: buildQueryDetail(response, userMessage),
    },
    { id: 'embed', label: RETRIEVAL_STEP_LABELS.embed, status: 'done', detail: 'OpenAI embedding' },
    { id: 'search', label: RETRIEVAL_STEP_LABELS.search, status: 'done', detail: FALLBACK_SEARCH_DETAIL },
    { id: 'rank', label: RETRIEVAL_STEP_LABELS.rank, status: 'done', detail: 'semantic + skill + trust + proximity' },
    {
      id: 'result',
      label: RETRIEVAL_STEP_LABELS.result,
      status: 'done',
      detail: recommendationCount
        ? `${recommendationCount} gợi ý cư dân`
        : `${relatedCount} kết quả liên quan`,
    },
  ];
}

export function resolveRetrievalFlow(response, streamSteps, userMessage) {
  const fromStream = mapFlowSteps(streamSteps);
  if (fromStream.length > 0 && !isFallbackRetrievalFlow(fromStream)) return fromStream;

  const fromResponse = mapFlowSteps(response?.retrieval_flow);
  if (fromResponse.length > 0 && !isFallbackRetrievalFlow(fromResponse)) return fromResponse;

  return buildFallbackRetrievalFlow(response, userMessage);
}

export function pickBestRetrievalFlow(candidates) {
  const valid = candidates.filter((steps) => steps?.length && !isFallbackRetrievalFlow(steps));
  if (valid.length) return valid[0];
  return candidates.find((steps) => steps?.length) || [];
}

/** Ensure step 1 shows the user's message when backend only sent entity slots. */
export function patchQueryWithUserMessage(steps, userMessage) {
  if (!userMessage?.trim() || !steps?.length) return steps;
  const trimmed = userMessage.trim();
  return steps.map((step) => {
    if (step.id !== 'query') return step;
    if (step.detail?.includes(`"${trimmed}"`)) return step;
    if (step.detail) {
      return { ...step, detail: `"${trimmed}" · ${step.detail}` };
    }
    return { ...step, detail: `"${trimmed}"` };
  });
}
