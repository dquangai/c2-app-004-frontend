/** Các khu Vinhomes trên bản đồ Hà Nội (tọa độ tham chiếu) */
export const VINHOMES_MAP_CENTER = [21.0058, 105.7365];
export const VINHOMES_MAP_DEFAULT_ZOOM = 15;
export const VINHOMES_MAP_OVERVIEW_ZOOM = 11;

export const ZONE_TYPES = {
  metropolis: 'Đại đô thị',
  sector: 'Phân khu',
  amenity: 'Tiện ích',
};

export const VINHOMES_ZONES = [
  {
    id: 'smart-city',
    name: 'Vinhomes Smart City',
    type: 'metropolis',
    lat: 21.0058,
    lng: 105.7365,
    description: 'Đại đô thị thông minh phía Tây Hà Nội.',
  },
  {
    id: 'ocean-park-1',
    name: 'Vinhomes Ocean Park 1',
    type: 'metropolis',
    lat: 21.0274,
    lng: 105.9396,
    description: 'Đại đô thị biển hồ phía Đông Hà Nội.',
  },
  {
    id: 'ocean-park-2',
    name: 'Vinhomes Ocean Park 2',
    type: 'metropolis',
    lat: 21.0248,
    lng: 105.9362,
    description: 'Phân khu Ocean Park 2 ven hồ nước mặn.',
  },
  {
    id: 'ocean-park-3',
    name: 'Vinhomes Ocean Park 3',
    type: 'metropolis',
    lat: 21.0298,
    lng: 105.9425,
    description: 'Phân khu Ocean Park 3 tại Gia Lâm.',
  },
  {
    id: 'skylake',
    name: 'Vinhomes Skylake',
    type: 'sector',
    lat: 21.0118,
    lng: 105.7298,
    description: 'Phân khu Skylake kề Smart City.',
  },
  {
    id: 'sapphire-1',
    name: 'The Sapphire 1',
    type: 'sector',
    lat: 21.0034,
    lng: 105.7338,
    description: 'Phân khu Sapphire 1 — Smart City.',
  },
  {
    id: 'sapphire-2',
    name: 'The Sapphire 2',
    type: 'sector',
    lat: 21.0045,
    lng: 105.7352,
    description: 'Phân khu Sapphire 2 — Smart City.',
  },
  {
    id: 'sakura',
    name: 'The Sakura',
    type: 'sector',
    lat: 21.0072,
    lng: 105.7316,
    description: 'Phân khu The Sakura — Smart City.',
  },
  {
    id: 'miami',
    name: 'The Miami',
    type: 'sector',
    lat: 21.0026,
    lng: 105.7374,
    description: 'Phân khu The Miami ven hồ — Smart City.',
  },
  {
    id: 'central-park',
    name: 'Công viên Trung tâm',
    type: 'amenity',
    lat: 21.0076,
    lng: 105.7378,
    description: 'Không gian xanh trung tâm Smart City.',
  },
  {
    id: 'vincom-mega',
    name: 'Vincom Mega Mall Smart City',
    type: 'amenity',
    lat: 21.0089,
    lng: 105.7395,
    description: 'Trung tâm thương mại Vincom Smart City.',
  },
  {
    id: 'vinschool',
    name: 'Vinschool Smart City',
    type: 'amenity',
    lat: 21.0062,
    lng: 105.7402,
    description: 'Hệ thống giáo dục Vinschool.',
  },
  {
    id: 'vinmec',
    name: 'Vinmec Smart City',
    type: 'amenity',
    lat: 21.0041,
    lng: 105.7415,
    description: 'Bệnh viện quốc tế Vinmec.',
  },
];
