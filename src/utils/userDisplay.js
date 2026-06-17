/** Display name for authenticated user (full_name or email local-part). */
export function getDisplayName(user) {
  if (!user) return '';
  const name = user.full_name?.trim();
  if (name) return name;
  if (user.email) return user.email.split('@')[0];
  return 'User';
}
