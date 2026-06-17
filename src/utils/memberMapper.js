/** Map backend Member / Recommendation to UI card shape. */

import { resolveMediaUrl } from './mediaUrl';

function initialsFrom(name, id = '') {
  const source = (name || id || 'V').trim();
  if (!source) return 'V';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function avatarFor(name, id = '') {
  const label = initialsFrom(name, id);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="#3d5f8f"/><text x="64" y="68" text-anchor="middle" fill="#ffffff" font-size="44" font-family="system-ui,sans-serif" font-weight="600">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Fallback to initials avatar when uploaded image fails to load. */
export function onAvatarError(event, name, id = '') {
  event.currentTarget.onerror = null;
  event.currentTarget.src = avatarFor(name, id);
}

export function mapMemberFromCatalog(member) {
  const available =
    /available|linh hoạt|sẵn sàng|flexible|weekend|cuối tuần/i.test(member.availability || '');
  const uploadedAvatar = resolveMediaUrl(member.avatar_url);
  return {
    id: member.id,
    name: member.name,
    title: member.profession || member.category,
    category: member.category,
    rating: member.rating,
    reviews: Math.max(1, Math.round(member.trust_score / 10)),
    trust: member.trust_score,
    verified: member.verified,
    availableNow: available,
    responseTime: member.response_time || member.availability || '~1 giờ',
    availability: member.availability,
    area: member.residential_zone || member.zone,
    avatar: uploadedAvatar || avatarFor(member.name, member.id),
    avatarUrl: member.avatar_url || null,
    shortBio: member.short_bio,
    skills: member.skills || [],
    raw: member,
  };
}

export function mapRecommendation(rec) {
  const base = mapMemberFromCatalog({
    id: rec.id,
    name: rec.name,
    category: rec.category,
    profession: rec.category,
    skills: [],
    verified: rec.verified,
    trust_score: rec.trust_score,
    rating: rec.rating,
    availability: rec.availability,
    response_time: rec.availability,
    residential_zone: rec.residential_zone,
    zone: rec.residential_zone,
    short_bio: rec.short_bio,
    tags: [],
    embedding_text: '',
  });
  return {
    ...base,
    matchScore: rec.match_score,
    reason: Array.isArray(rec.reason) ? rec.reason.join(' ') : String(rec.reason || ''),
    actions: rec.actions || [],
    rawRecommendation: rec,
  };
}

export function memberToProfile(member) {
  const mapped = member.raw ? member : mapMemberFromCatalog(member);
  return {
    id: mapped.id,
    name: mapped.name,
    title: mapped.title,
    trust: mapped.trust,
    rating: mapped.rating,
    reviews: mapped.reviews,
    area: mapped.area,
    avatar: mapped.avatar,
    about: mapped.shortBio || 'Thành viên cộng đồng Vinhomes.',
    skills: mapped.skills?.length ? mapped.skills : [mapped.title],
    services: [{ name: mapped.title, price: 'Liên hệ' }],
    contributions: ['Thành viên cộng đồng V-Connect'],
    recommendations: [],
    verified: mapped.verified,
  };
}
