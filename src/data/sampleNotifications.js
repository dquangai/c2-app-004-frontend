/** Fallback notifications when API is unavailable or demo seed has not run yet. */
export const SAMPLE_BOOKED_ME = [
  {
    id: 'sample-booking-1',
    type: 'booking',
    sample: true,
    name: 'Nguyễn Văn Demo',
    time: '10 phút trước',
    text: 'requested booking: "14/06/2026 19:00 — IELTS speaking practice"',
    avatar: 'https://i.pravatar.cc/150?img=12',
  },
  {
    id: 'sample-booking-2',
    type: 'booking',
    sample: true,
    name: 'Trần Minh Anh',
    time: '45 phút trước',
    text: 'requested booking: "13/06/2026 20:30 — Night fever consultation"',
    avatar: 'https://i.pravatar.cc/150?img=25',
  },
  {
    id: 'sample-booking-3',
    type: 'booking',
    sample: true,
    name: 'Lê Hoàng Nam',
    time: '2 giờ trước',
    text: 'requested booking: "17/06/2026 15:00 — Grade 6 entrance prep"',
    avatar: 'https://i.pravatar.cc/150?img=8',
  },
];

export const SAMPLE_I_BOOKED = [
  {
    id: 'sample-status-1',
    type: 'status',
    sample: true,
    name: 'Linh Nguyễn',
    time: '1 giờ trước',
    text: 'accepted your booking: "11/06/2026 10:00 — English tutor for 8yo"',
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
  {
    id: 'sample-status-2',
    type: 'pending',
    sample: true,
    name: 'Mai Thu Thủy',
    time: '3 giờ trước',
    text: 'awaiting response: "12/06/2026 18:00 — Fever consult for toddler"',
    avatar: 'https://i.pravatar.cc/150?img=11',
  },
  {
    id: 'sample-status-3',
    type: 'status',
    sample: true,
    name: 'Tuan Bui',
    time: 'Hôm qua',
    text: 'declined your booking: "15/06/2026 09:00 — Grade 5 Math review"',
    avatar: 'https://i.pravatar.cc/150?img=18',
  },
];

export function getSampleNotificationSets(role) {
  const isProvider = role === 'member' || role === 'admin';
  return {
    booked: isProvider ? [] : SAMPLE_I_BOOKED,
    bookedMe: isProvider ? SAMPLE_BOOKED_ME : [],
  };
}
