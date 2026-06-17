/** English catalog overlays keyed by entity id (API returns Vietnamese by default). */

const ZONE_EN = {
  'Toàn khu': 'All areas',
};

const GROUP_EN = {
  grp_001: {
    name: 'Vinhomes Parents Group',
    description:
      'Parents sharing tips on childcare, tutors, health, and family support across Vinhomes.',
    join_note:
      'Include your zone and child age when joining. Admins respond within 24 hours.',
    topics: ['parenting', 'childcare', 'tutors', 'child health', 'family'],
  },
  grp_002: {
    name: 'Tech & Startup Residents',
    description:
      'Residents discuss software, startups, product, and hiring in the community.',
    join_note:
      'Briefly introduce your role or goal to help admins approve faster.',
    topics: ['programming', 'startup', 'career mentor', 'product'],
  },
  grp_003: {
    name: 'Home Services Exchange',
    description:
      'Trusted home repair and service recommendations from real resident experiences.',
    join_note: 'Vinhomes residents only. No off-site service ads.',
    topics: ['home repair', 'cleaning', 'plumbing', 'electrician', 'urgent help'],
  },
  grp_004: {
    name: 'Weekend Sports Club',
    description: 'Small group workouts, yoga, running, and weekend fitness challenges.',
    join_note: 'Mention your sport (running, yoga, pickleball) when registering.',
    topics: ['fitness', 'yoga', 'wellness', 'running', 'pickleball'],
  },
  grp_005: {
    name: 'New Neighbor Connect',
    description:
      'Friendly meetups for new residents and anyone expanding their circle in the community.',
    join_note: 'Offline-friendly — join weekend coffee meetups in the group.',
    topics: ['networking', 'community events', 'coffee', 'meet neighbors'],
  },
};

const POST_EN = {
  post_001: {
    title: 'Weekend English playdate — Ocean Park 1 registration open',
    summary:
      'Saturday 9 AM at the playground — ages 6–10 practice English through games. Register by Friday.',
    author: 'Vinhomes Parents Group',
  },
  post_002: {
    title: 'Tonight: Online pediatric Q&A for Smart City parents',
    summary:
      '8 PM tonight — resident pediatrician answers questions on fever, cough, and vaccines. Link in the group.',
    author: 'Smart City Community Board',
  },
  post_003: {
    title: 'Sunday lakeside yoga — anyone joining?',
    summary:
      '7 AM Sunday at OP2 lake. Beginner-friendly — bring a mat. Comment to join a group.',
    author: 'Weekend Sports Club',
  },
  post_004: {
    title: 'New neighbor coffee meetup — Central Park Saturday',
    summary:
      '3 PM Saturday at S1 lobby café. Casual intro — no pressure networking. Share your name and zone!',
    author: 'New Neighbor Connect',
  },
  post_005: {
    title: 'Grand Park resident pickleball — weekend team signup',
    summary:
      'Sunday 8 AM at Grand Park courts. Doubles and singles open — all skill levels welcome.',
    author: 'Weekend Sports Club',
  },
  post_006: {
    title: 'Gentle Parenting Workshop — Sunday at Ocean Park',
    summary:
      '2 PM Sunday — sleep, nutrition, and connecting with parents of similar ages. Free for residents.',
    author: 'Vinhomes Parents Group',
  },
  post_007: {
    title: 'Backend Python career clinic — Thursday evening Grand Park',
    summary:
      '7:30 PM Thursday — resident engineers share Python learning paths, CV tips, and interviews. Sign up in Tech group.',
    author: 'Tech & Startup Residents',
  },
  post_008: {
    title: 'What’s on at Vinhomes this week? Community event roundup',
    summary:
      'Yoga OP2, pickleball Grand Park, coffee Central Park, parenting workshop OP1 — see each post and join the related group.',
    author: 'Community Stories Board',
  },
  post_009: {
    title: 'Early morning running group Ocean Park 2 — recruiting members',
    summary:
      'Meet 5:45 AM Tue & Thu at OP2 main gate. Easy 5 km around the lake — great for beginners.',
    author: 'Weekend Sports Club',
  },
  post_010: {
    title: 'Grand Park weekend events — this month’s schedule',
    summary:
      'Sunday pickleball, Thursday Python clinic, end-of-month startup social — follow Tech & Sports clubs for updates.',
    author: 'Grand Park Community Board',
  },
};

const EVENT_EN = {
  evt_001: {
    name: 'English playdate for kids — Saturday',
    time: 'Saturday 9:00 AM',
    description: 'English practice through games for ages 6–10 at the community playground.',
  },
  evt_002: {
    name: 'Pediatric Q&A — tonight',
    time: 'Tonight 8:00 PM',
    description: 'Short Q&A with a resident pediatrician on common child health situations.',
  },
  evt_003: {
    name: 'Backend & Python career clinic',
    time: 'Thursday 7:30 PM',
    description: 'Learning paths and interview tips for residents moving into backend/AI.',
  },
  evt_004: {
    name: 'Lakeside yoga — Sunday morning',
    time: 'Sunday 7:00 AM',
    description: 'Outdoor yoga for beginners — a gentle Sunday morning session.',
  },
  evt_005: {
    name: 'New neighbor coffee meetup',
    time: 'Saturday 3:00 PM',
    description: 'Friendly meetup for new residents and anyone expanding their circle.',
  },
  evt_006: {
    name: 'Resident pickleball tournament — weekend',
    time: 'Sunday 8:00 AM',
    description: 'Friendly pickleball open to all skill levels — register solo or as a team.',
  },
  evt_007: {
    name: 'Gentle parenting workshop',
    time: 'Sunday 2:00 PM',
    description: 'Sharing tips on sleep, routines, and connecting with parents nearby.',
  },
};

export function localizeZone(zone, locale) {
  if (!zone || locale !== 'en') return zone;
  return ZONE_EN[zone] || zone;
}

export function localizeGroup(group, locale) {
  if (!group || locale !== 'en') return group;
  const pack = GROUP_EN[group.id];
  if (!pack) {
    return {
      ...group,
      residential_zone: localizeZone(group.residential_zone, locale),
    };
  }
  return {
    ...group,
    name: pack.name,
    description: pack.description,
    join_note: pack.join_note ?? group.join_note,
    topics: pack.topics ?? group.topics,
    residential_zone: localizeZone(group.residential_zone, locale),
  };
}

export function localizePost(post, locale) {
  if (!post || locale !== 'en') return post;
  const pack = POST_EN[post.id];
  if (!pack) {
    return {
      ...post,
      residential_zone: localizeZone(post.residential_zone, locale),
    };
  }
  return {
    ...post,
    title: pack.title,
    summary: pack.summary,
    author: pack.author ?? post.author,
    residential_zone: localizeZone(post.residential_zone, locale),
  };
}

export function localizeEvent(event, locale) {
  if (!event || locale !== 'en') return event;
  const pack = EVENT_EN[event.id];
  if (!pack) {
    return {
      ...event,
      residential_zone: localizeZone(event.residential_zone, locale),
    };
  }
  return {
    ...event,
    name: pack.name,
    time: pack.time ?? event.time,
    description: pack.description ?? event.description,
    residential_zone: localizeZone(event.residential_zone, locale),
  };
}
