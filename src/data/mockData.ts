import { Professional } from '../types/professional';

export const professionals: Professional[] = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    profession: 'Huấn luyện viên bơi',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    verified: true,
    trustScore: 95,
    distance: '500m',
    rating: 4.9,
    reviews: 124,
    responseTime: '15 phút',
    availability: 'Thứ 7 - 9AM',
    badge: 'Verified Resident',
  },
  {
    id: '2',
    name: 'Lê Thị B',
    profession: 'Gia sư tiếng Anh lớp 8',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    verified: true,
    trustScore: 92,
    distance: '1.2km',
    rating: 4.8,
    reviews: 87,
    responseTime: '45 phút',
    availability: 'T2-T6',
  },
  {
    id: '3',
    name: 'Trần Hoàng C',
    profession: 'Thợ điện',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    verified: true,
    trustScore: 90,
    distance: '300m',
    rating: 5.0,
    reviews: 156,
    responseTime: '5 phút',
    availability: 'Khẩn cấp 24/7',
  },
];

export const categories = [
  'Giáo dục',
  'Y tế',
  'Dịch vụ nhà',
  'Công nghệ',
  'Thể thao',
  'Pháp lý',
  'Thú cưng',
];

export const recentSearches = [
  'Tìm huấn luyện viên bơi',
  'Gia sư tiếng Anh lớp 8',
  'Thợ điện gần S2',
  'Người trông thú cưng cuối tuần',
  'Sửa laptop IT support',
];

export const matchReasons = [
  'Cùng khu vực cư dân',
  'Chứng chỉ bơi đã xác minh',
  '124 đánh giá tích cực từ cộng đồng',
  'Phản hồi nhanh trung bình 15 phút',
  'Có lịch trống vào cuối tuần này',
];

export const reputationMetrics = [
  { label: 'Xác minh danh tính', percentage: 100 },
  { label: 'Danh tiếng cộng đồng', percentage: 98 },
  { label: 'Xác minh chuyên môn', percentage: 100 },
  { label: 'Độ tin cậy phản hồi', percentage: 92 },
  { label: 'Tỷ lệ hoàn thành đặt lịch', percentage: 98 },
  { label: 'Chất lượng đánh giá', percentage: 94 },
];
