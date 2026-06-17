import { fetchMembers, fetchMemberById, fetchHonorLeaderboard as fetchHonorLeaderboardApi } from './catalogService';
import { mapMemberFromCatalog } from '../utils/memberMapper';
import { DIRECTORY_NEEDS } from '../config/directoryNeedCategories';
import {
  sessionCacheClearPrefix,
  sessionCacheFetch,
  sessionCacheGet,
  sessionCacheHas,
} from '../utils/sessionCache';

const RESIDENT_PREFIX = 'catalog:residents:';
const HONOR_PREFIX = 'catalog:honor:v2:';

function honorCacheKey(options = {}) {
  return `${HONOR_PREFIX}${options.period || 'current'}`;
}

export function invalidateHonorLeaderboardCache() {
  sessionCacheClearPrefix(HONOR_PREFIX);
}

export async function fetchHonorLeaderboard(options = {}, { force = false } = {}) {
  const key = honorCacheKey(options);
  return sessionCacheFetch(
    key,
    async () => {
      const data = await fetchHonorLeaderboardApi(options);
      const topRankedByNeed = {};
      for (const group of data.groups || []) {
        topRankedByNeed[group.group_id] = (group.entries || [])
          .map((entry) => ({
            ...mapMemberFromCatalog(entry.member),
            honorRank: entry.rank,
            honorScore: entry.score,
            honorBreakdown: entry.score_breakdown,
          }))
          .sort((a, b) => a.honorRank - b.honorRank);
      }
      return {
        period: {
          key: data.period_key,
          monthLabel: data.month_label,
          resetLabel: data.reset_label,
          daysUntilReset: data.days_until_reset,
        },
        topRankedByNeed,
        computedAt: data.computed_at,
        topLimit: data.top_limit,
      };
    },
    { force }
  );
}

function pageCacheKey(options = {}) {
  const limit = options.limit ?? 24;
  const offset = options.offset ?? 0;
  const verifiedOnly = options.verifiedOnly ? '1' : '0';
  return `${RESIDENT_PREFIX}${limit}:${offset}:${verifiedOnly}`;
}

export function peekResidentsPage(options = {}) {
  return sessionCacheGet(pageCacheKey(options));
}

export function hasResidentsPageCache(options = {}) {
  return sessionCacheHas(pageCacheKey(options));
}

export function invalidateResidentsCache() {
  sessionCacheClearPrefix(RESIDENT_PREFIX);
}

export async function listResidents(options = {}) {
  const page = await listResidentsPage(options);
  return page.items;
}

export async function listResidentsPage(options = {}, { force = false } = {}) {
  const key = pageCacheKey(options);
  return sessionCacheFetch(
    key,
    async () => {
      const page = await fetchMembers(options);
      return {
        ...page,
        items: page.items.map(mapMemberFromCatalog),
      };
    },
    { force }
  );
}

export async function getHonorTopOneResidents(limit = 4) {
  const leaderboard = await fetchHonorLeaderboard();
  const topOnes = [];
  const seen = new Set();

  for (const need of DIRECTORY_NEEDS) {
    if (need.href) continue;
    const members = leaderboard.topRankedByNeed[need.id] || [];
    const top1 = members.find((member) => member.honorRank === 1) ?? members[0];
    if (!top1 || seen.has(top1.id)) continue;
    seen.add(top1.id);
    topOnes.push({ ...top1, honorNeedId: need.id });
    if (topOnes.length >= limit) break;
  }

  return {
    members: topOnes,
    period: leaderboard.period,
  };
}

export async function getFeaturedResidents(limit = 4) {
  const page = await listResidentsPage({ limit: 50, verifiedOnly: true });
  return [...page.items]
    .sort((a, b) => b.trust - a.trust || b.rating - a.rating)
    .slice(0, limit);
}

export async function getResidentById(id) {
  const member = await fetchMemberById(id);
  return member ? mapMemberFromCatalog(member) : null;
}
