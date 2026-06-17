export const directoryVi = {
  directory: {
    page: {
      title: 'Vinh Danh Hàng Xóm',
      subtitle: 'Top 10 hàng xóm xuất sắc theo từng nhóm nghề — làm mới hàng tháng',
      loading: 'Đang tải bảng xếp hạng…',
      empty: 'Chưa có dữ liệu xếp hạng cho tháng này.',
      error: 'Không tải được danh sách hàng xóm.',
    },
    period: {
      banner: 'Bảng xếp hạng',
      monthLabel: 'Tháng {month}/{year}',
      resetAt: 'Làm mới ngày {date}',
      daysLeft: 'còn {count} ngày',
    },
    search: {
      placeholder: 'Tìm trong bảng vinh danh tháng này…',
    },
    actions: {
      profile: 'Hồ sơ',
      connect: 'Kết nối',
      points: 'điểm',
      verified: 'Đã xác thực',
      help: 'Cách tính bảng xếp hạng',
      close: 'Đóng',
    },
    rankingHelp: {
      title: 'Cách tính bảng xếp hạng',
      intro:
        'Mỗi tháng, hệ thống AI tự động chọn Top 10 hàng xóm xuất sắc nhất trong từng nhóm nghề để vinh danh. Thứ hạng được tính từ điểm tổng hợp trong tháng hiện tại và làm mới lúc 00:00 ngày 1.',
      criteria: [
        { label: 'Hoạt động trong tháng', desc: 'Số lần kết nối, phản hồi và hỗ trợ hàng xóm trong tháng — yếu tố quan trọng nhất.' },
        { label: 'Đánh giá sao', desc: 'Trung bình điểm đánh giá từ các lần kết nối thành công.' },
        { label: 'Điểm Trust', desc: 'Mức độ tin cậy tích lũy từ cộng đồng Vinhomes.' },
        { label: 'Hồ sơ đã xác thực', desc: 'Danh tính và thông tin nghề nghiệp đã được xác minh — được cộng thêm điểm.' },
        { label: 'Sẵn sàng hỗ trợ', desc: 'Đang online hoặc phản hồi nhanh — được cộng thêm điểm nhỏ.' },
      ],
      notes: [
        'Chỉ Top 10 hàng xóm mỗi nhóm nghề được vinh danh trên bảng.',
        'Bảng xếp hạng làm mới lúc 00:00 ngày 1 hàng tháng — ai tích cực trong tháng mới đều có cơ hội lên top.',
        'Tìm kiếm chỉ lọc trong danh sách vinh danh của tháng hiện tại, không hiển thị toàn bộ cư dân.',
      ],
    },
    needs: {
      child: { label: 'Tôi có con nhỏ', rankGroupLabel: 'Gia sư & Y tế trẻ em' },
      errands: { label: 'Tôi cần tìm trợ giúp việc vặt', rankGroupLabel: 'Dịch vụ gia đình & trợ giúp' },
      fitness: { label: 'Tìm người chạy bộ cùng', rankGroupLabel: 'Thể thao & Sức khỏe' },
      resale: { label: 'Tôi muốn thanh lý đồ cũ', rankGroupLabel: 'Thanh lý & Mua bán' },
      repair: { label: 'Tìm thợ điện nước', rankGroupLabel: 'Kỹ thuật & Sửa chữa' },
      other: { label: 'Khác', rankGroupLabel: 'Các nghề khác' },
    },
  },
};

export const directoryEn = {
  directory: {
    page: {
      title: 'Neighbor Hall of Fame',
      subtitle: 'Top 10 outstanding neighbors by profession — refreshed monthly',
      loading: 'Loading rankings…',
      empty: 'No ranking data for this month yet.',
      error: 'Could not load neighbor directory.',
    },
    period: {
      banner: 'Rankings',
      monthLabel: '{month}/{year}',
      resetAt: 'Resets on {date}',
      daysLeft: '{count} days left',
    },
    search: {
      placeholder: 'Search this month’s honorees…',
    },
    actions: {
      profile: 'Profile',
      connect: 'Connect',
      points: 'pts',
      verified: 'Verified',
      help: 'How rankings work',
      close: 'Close',
    },
    rankingHelp: {
      title: 'How rankings work',
      intro:
        'Each month, AI selects the Top 10 outstanding neighbors in each profession group. Rankings use combined scores for the current month and reset at 00:00 on the 1st.',
      criteria: [
        { label: 'Monthly activity', desc: 'Connections, responses, and neighbor support this month — the most important factor.' },
        { label: 'Star ratings', desc: 'Average rating from successful connections.' },
        { label: 'Trust score', desc: 'Community trust accumulated in Vinhomes.' },
        { label: 'Verified profile', desc: 'Verified identity and profession — bonus points.' },
        { label: 'Ready to help', desc: 'Online or fast response — small bonus.' },
      ],
      notes: [
        'Only Top 10 neighbors per profession group are featured.',
        'Rankings reset at 00:00 on the 1st of each month — everyone has a fresh chance.',
        'Search filters only this month’s honorees, not the full resident list.',
      ],
    },
    needs: {
      child: { label: 'I have young children', rankGroupLabel: 'Tutors & Child health' },
      errands: { label: 'I need help with errands', rankGroupLabel: 'Home & family services' },
      fitness: { label: 'Find a running buddy', rankGroupLabel: 'Sports & wellness' },
      resale: { label: 'Sell second-hand items', rankGroupLabel: 'Resale & marketplace' },
      repair: { label: 'Find a plumber/electrician', rankGroupLabel: 'Repairs & technical' },
      other: { label: 'Other', rankGroupLabel: 'Other professions' },
    },
  },
};
