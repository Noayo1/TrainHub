export default function Sidebar({ currentView, onViewChange }) {
  return (
    <aside className="feed-sidebar-left">
      <div className="sidebar-menu">
        <button
          className={`menu-item ${currentView === "home" ? "active" : ""}`}
          onClick={() => onViewChange("home")}
        >
          <span className="menu-icon">🏠</span>
          Home
        </button>
        <button
          className={`menu-item ${currentView === "friends" ? "active" : ""}`}
          onClick={() => onViewChange("friends")}
        >
          <span className="menu-icon">👥</span>
          Friends
        </button>
        <button
          className={`menu-item ${currentView === "groups" ? "active" : ""}`}
          onClick={() => onViewChange("groups")}
        >
          <span className="menu-icon">👤</span>
          Groups
        </button>
      </div>
    </aside>
  );
}
