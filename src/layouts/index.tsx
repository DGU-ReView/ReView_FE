import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="w-full h-screen flex flex-col justify-center">
      <Outlet />
    </div>
  );
}
