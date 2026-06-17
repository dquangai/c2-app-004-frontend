export default function AdminPageHeader({ title, description, actions }) {
  return (
    <header className="admin-page-header">
      <div>
        <h1 className="admin-page-header__title">{title}</h1>
        {description && <p className="admin-page-header__desc">{description}</p>}
      </div>
      {actions && <div className="admin-page-header__actions">{actions}</div>}
    </header>
  );
}
