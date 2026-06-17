/** Map generic API errors to clearer admin UI messages. */
export function formatAdminApiError(message, context = '') {
  const text = String(message || '').trim();
  if (text === 'Not Found' || text.includes('404')) {
    if (context === 'profile-updates') {
      return 'API /api/admin/profile-updates chưa có — khởi động lại backend (uvicorn --reload) sau khi cập nhật code.';
    }
    if (context === 'applications') {
      return 'API /api/admin/applications không tìm thấy — kiểm tra backend đang chạy đúng port (8010) và VITE_API_PROXY_TARGET.';
    }
    return 'API không tìm thấy (404). Kiểm tra backend đang chạy và frontend có proxy /api (npm run dev hoặc preview qua Vite).';
  }
  if (text === 'Invalid admin credentials.' || text.includes('Invalid admin')) {
    return 'Admin API key không đúng. Vào Admin → Cài đặt và nhập key khớp ADMIN_API_KEY trong .env.';
  }
  return text || 'Không thể gọi API admin.';
}
