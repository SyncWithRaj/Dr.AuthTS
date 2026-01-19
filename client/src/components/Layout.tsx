import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;