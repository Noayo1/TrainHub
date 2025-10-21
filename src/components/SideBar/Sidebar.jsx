// Sidebar.jsx
// Responsibility: Display left navigation menu only

export default function Sidebar() {
  return (
    <aside className="feed-sidebar-left">
      <div className="sidebar-menu">
        <button className="menu-item active">
          <span className="menu-icon">🏠</span>
          Home
        </button>
        <button className="menu-item">
          <span className="menu-icon">👥</span>
          Friends
        </button>
        <button className="menu-item">
          <span className="menu-icon">👤</span>
          Groups
        </button>
        <button className="menu-item">
          <span className="menu-icon">⚙️</span>
          Settings
        </button>
      </div>
    </aside>
  );
}