import './ProfileList.css';
import ProfileCard from '../ProfileCard';

const MOCK_PROFILES = [
  {
    id: 1,
    name: "Lê Thị B",
    title: "Gia sư tiếng Anh lớp 8 | Cư dân đã xác minh",
    avatar: "https://i.pravatar.cc/150?img=5",
    trustScore: 92,
    distance: "1.2km",
    rating: "4.8",
    reviews: "89",
    responseTime: "45 phút",
    availability: "T2-T6 6PM",
    tags: ["12-18 6PM", "T7 10AM"]
  },
  {
    id: 2,
    name: "Trần Hoàng C",
    title: "Thợ điện (Khu vực S2)",
    avatar: "https://i.pravatar.cc/150?img=8",
    trustScore: null,
    distance: "300m",
    rating: "5",
    reviews: "210",
    responseTime: "5 phút",
    availability: "Khẩn cấp 24/7",
    tags: ["Khẩn cấp 24/7", "Giờ hành chính 8AM-8PM"],
    isUrgent: true
  },
  {
    id: 3,
    name: "Nguyễn Văn A",
    title: "Huấn luyện viên bơi lội | Chuyên gia bơi lội",
    avatar: "https://i.pravatar.cc/150?img=12",
    trustScore: 95,
    distance: "800m",
    rating: "4.9",
    reviews: "156",
    responseTime: "15 phút",
    availability: "T7-CN 8AM-5PM",
    tags: ["Thứ 7 9AM", "Chủ nhật 2PM"]
  }
];

const ProfileList = ({ onSelectProfile }) => {
  return (
    <div className="profile-list">
      <div className="profile-list__header">
        <h3 className="profile-list__title">Ứng viên phù hợp</h3>
        <a href="#" className="profile-list__view-all">
          Xem tất cả <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </a>
      </div>
      {MOCK_PROFILES.map(profile => (
        <ProfileCard key={profile.id} profile={profile} onSelectProfile={onSelectProfile} />
      ))}
    </div>
  );
};
export default ProfileList;
