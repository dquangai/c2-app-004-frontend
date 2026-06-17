export const EMPTY_MEMBER = {
  id: '',
  name: '',
  category: '',
  profession: '',
  skills: '',
  verified: false,
  rating: 4.0,
  review_count: 0,
  availability: '',
  response_time: '',
  residential_zone: '',
  zone: '',
  short_bio: '',
  tags: '',
  embedding_text: '',
};

export function splitList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function memberToForm(member) {
  return {
    ...member,
    skills: (member.skills || []).join(', '),
    tags: (member.tags || []).join(', '),
    review_count: member.review_count ?? 0,
  };
}

export function formToTrustScoreInput(form) {
  return {
    verified: Boolean(form.verified),
    rating: Number(form.rating) || 0,
    review_count: Number(form.review_count) || 0,
    skills: splitList(form.skills),
    short_bio: form.short_bio.trim(),
    embedding_text: form.embedding_text.trim(),
    response_time: form.response_time.trim(),
    availability: form.availability.trim(),
    tags: splitList(form.tags),
    name: form.name.trim(),
    category: form.category.trim(),
    profession: form.profession.trim(),
    residential_zone: form.residential_zone.trim(),
    zone: form.zone.trim(),
  };
}

export function formToMember(form) {
  return {
    id: form.id.trim(),
    name: form.name.trim(),
    category: form.category.trim(),
    profession: form.profession.trim(),
    skills: splitList(form.skills),
    verified: Boolean(form.verified),
    rating: Number(form.rating),
    availability: form.availability.trim(),
    response_time: form.response_time.trim(),
    residential_zone: form.residential_zone.trim(),
    zone: form.zone.trim(),
    short_bio: form.short_bio.trim(),
    tags: splitList(form.tags),
    embedding_text: form.embedding_text.trim(),
    review_count: Number(form.review_count) || 0,
  };
}
