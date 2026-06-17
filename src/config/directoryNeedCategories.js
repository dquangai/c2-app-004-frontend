import {
  Stethoscope,
  Briefcase,
  GraduationCap,
  Package,
  Wrench,
  MoreHorizontal,
} from 'lucide-react';

export const TOP_RANK_LIMIT = 10;

/** Nội dung giải thích bảng xếp hạng — dùng cho nút trợ giúp (?) */
export const RANKING_HELP = {
  title: 'Cách tính bảng xếp hạng',
  intro:
    'Mỗi tháng, hệ thống AI tự động chọn Top 10 hàng xóm xuất sắc nhất trong từng nhóm nghề để vinh danh. Thứ hạng được tính từ điểm tổng hợp trong tháng hiện tại và làm mới lúc 00:00 ngày 1.',
  criteria: [
    {
      label: 'Hoạt động trong tháng',
      desc: 'Số lần kết nối, phản hồi và hỗ trợ hàng xóm trong tháng — yếu tố quan trọng nhất.',
    },
    {
      label: 'Đánh giá sao',
      desc: 'Trung bình điểm đánh giá từ các lần kết nối thành công.',
    },
    {
      label: 'Điểm Trust',
      desc: 'Mức độ tin cậy tích lũy từ cộng đồng Vinhomes.',
    },
    {
      label: 'Hồ sơ đã xác thực',
      desc: 'Danh tính và thông tin nghề nghiệp đã được xác minh — được cộng thêm điểm.',
    },
    {
      label: 'Sẵn sàng hỗ trợ',
      desc: 'Đang online hoặc phản hồi nhanh — được cộng thêm điểm nhỏ.',
    },
  ],
  notes: [
    `Chỉ Top ${TOP_RANK_LIMIT} hàng xóm mỗi nhóm nghề được vinh danh trên bảng.`,
    'Bảng xếp hạng làm mới lúc 00:00 ngày 1 hàng tháng — ai tích cực trong tháng mới đều có cơ hội lên top.',
    'Tìm kiếm chỉ lọc trong danh sách vinh danh của tháng hiện tại, không hiển thị toàn bộ cư dân.',
  ],
};

/** Chu kỳ bảng xếp hạng — reset 00:00 ngày 1 hàng tháng */
export function getRankingPeriod(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const nextReset = new Date(year, month + 1, 1);
  const monthLabel = `Tháng ${month + 1}/${year}`;
  const resetDay = nextReset.getDate().toString().padStart(2, '0');
  const resetMonth = (nextReset.getMonth() + 1).toString().padStart(2, '0');
  const resetLabel = `${resetDay}/${resetMonth}/${nextReset.getFullYear()}`;
  const daysUntilReset = Math.max(
    0,
    Math.ceil((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    key: `${year}-${String(month + 1).padStart(2, '0')}`,
    monthLabel,
    resetLabel,
    daysUntilReset,
  };
}

function monthlyActivityPoints(member, periodKey) {
  const seed = `${periodKey}:${member.id}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash % 50) + 10;
}

export function memberRankScore(member, periodKey = getRankingPeriod().key) {
  const monthly = monthlyActivityPoints(member, periodKey);
  let score = monthly * 2 + (member.trust || 0) + (member.rating || 0) * 3;
  if (member.verified) score += 10;
  if (member.availableNow) score += 3;
  return score;
}

/** Nhu cầu Hàng xóm — chip + anchor section Top 10 theo nhóm nghề trên /directory */
export const DIRECTORY_NEEDS = [
  {
    id: 'child',
    label: 'Tôi có con nhỏ',
    rankGroupLabel: 'Gia sư & Y tế trẻ em',
    icon: Stethoscope,
    keywords: [
      'nhi khoa',
      'bác sĩ nhi',
      'gia sư',
      'giáo viên',
      'piano',
      'mỹ thuật',
      'dinh dưỡng',
      'dược sĩ',
      'bác sĩ gia đình',
      'trẻ em',
      'con nhỏ',
    ],
  },
  {
    id: 'errands',
    label: 'Tôi cần tìm trợ giúp việc vặt',
    rankGroupLabel: 'Dịch vụ gia đình & trợ giúp',
    icon: Briefcase,
    keywords: [
      'điều phối dịch vụ',
      'đầu bếp',
      'chăm sóc người cao tuổi',
      'chăm sóc thú cưng',
      'nội thất',
      'dọn dẹp',
      'dọn nhà',
      'thú cưng',
      'giúp việc',
    ],
  },
  {
    id: 'fitness',
    label: 'Tìm người chạy bộ cùng',
    rankGroupLabel: 'Thể thao & Sức khỏe',
    icon: GraduationCap,
    keywords: [
      'thể hình',
      'huấn luyện viên',
      'huấn luyện',
      'bơi lội',
      'bơi',
      'fitness',
      'chạy bộ',
      'wellbeing',
      'yoga',
      'gym',
    ],
  },
  {
    id: 'resale',
    label: 'Tôi muốn thanh lý đồ cũ',
    icon: Package,
    href: '/social',
    keywords: [],
  },
  {
    id: 'repair',
    label: 'Tìm thợ điện nước',
    rankGroupLabel: 'Kỹ thuật & Sửa chữa',
    icon: Wrench,
    keywords: [
      'điện nước',
      'điện lạnh',
      'kỹ thuật viên',
      'it tại nhà',
      'thợ sửa',
      'sửa chữa',
      'máy lạnh',
      'kỹ thuật điện',
    ],
  },
  {
    id: 'other',
    label: 'Khác',
    rankGroupLabel: 'Các nghề khác',
    icon: MoreHorizontal,
    keywords: [],
  },
];

export function rankMembers(members, limit = TOP_RANK_LIMIT, periodKey = getRankingPeriod().key) {
  return [...members]
    .sort(
      (a, b) =>
        memberRankScore(b, periodKey) - memberRankScore(a, periodKey) ||
        (b.trust || 0) - (a.trust || 0) ||
        (b.rating || 0) - (a.rating || 0)
    )
    .slice(0, limit);
}

export function memberMatchesNeed(member, need) {
  if (!need.keywords?.length) return false;
  const haystack = [
    member.category,
    member.title,
    member.shortBio,
    ...(member.skills || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return need.keywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

export function categorizeMembersByNeed(members, needs = DIRECTORY_NEEDS) {
  const assigned = new Set();
  const buckets = {};

  for (const need of needs) {
    if (need.id === 'other') continue;
    buckets[need.id] = members.filter((member) => {
      if (assigned.has(member.id)) return false;
      if (!memberMatchesNeed(member, need)) return false;
      assigned.add(member.id);
      return true;
    });
  }

  buckets.other = members.filter((member) => !assigned.has(member.id));
  return buckets;
}

export function getTopRankedByNeed(
  members,
  needs = DIRECTORY_NEEDS,
  limit = TOP_RANK_LIMIT,
  periodKey = getRankingPeriod().key
) {
  const buckets = categorizeMembersByNeed(members, needs);
  const ranked = {};
  for (const need of needs) {
    ranked[need.id] = rankMembers(buckets[need.id] || [], limit, periodKey);
  }
  return ranked;
}

export function needSectionId(needId) {
  return `directory-need-${needId}`;
}
