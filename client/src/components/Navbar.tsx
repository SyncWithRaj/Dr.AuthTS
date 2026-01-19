import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, ChevronDown, Bell, Activity } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);



  return (
    <nav className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-8 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* LEFT: Logo & Navigation */}
      <div className="flex items-center space-x-12">
        <Link
          to="/"
          className="text-3xl font-black tracking-tighter text-white flex items-center gap-2 group"
        >
          <div className="w-10 h-10 bg-indigo-500 rounded-lg rotate-3 group-hover:rotate-12 transition-transform duration-300 flex items-center justify-center">
            <Activity className="text-white" size={18} />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Dr.Auth
          </span>
        </Link>
      </div>

      {/* RIGHT: Indicators & Profile */}
      <div className="flex items-center space-x-5">

        {/* Notifications Icon (Visual Polish) */}
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition">
          <Bell size={18} />
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-gray-800 transition-colors group border border-transparent hover:border-gray-700"
          >
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
              <div className="px-5 py-3 border-b border-gray-800 mb-1">
                <p className="text-sm text-white font-bold truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-tighter mt-0.5">{user?.role}</p>
              </div>

              <Link to="/profile" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-indigo-500/10 transition group">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition">
                  <User size={16} />
                </div>
                My Profile
              </Link>

              <div className="px-2 mt-1">
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <LogOut size={16} />
                  </div>
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;