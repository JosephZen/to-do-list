import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

function Header({ taskCount = 0 }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    // 1. Ask for confirmation first
    const result = await Swal.fire({
      title: 'Log out?',
      text: "Are you sure you want to end your session?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33', // Red for "Logout"
      cancelButtonColor: '#3085d6', // Blue for "Cancel"
      confirmButtonText: 'Yes, log out'
    });

    // 2. If user clicked "Yes"
    if (result.isConfirmed) {
      try {
        // Call the backend to destroy the session cookie
        await axios.post('/logout');

        // Show a quick success toast
        await Swal.fire({
          icon: 'success',
          title: 'Logged out successfully',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500
        });

        // Redirect to Login Page
        navigate('/');

      } catch (error) {
        console.error("Logout Error:", error);
        // Even if the server errors, force a redirect to login
        navigate('/');
      }
    }
  };

  return (
    <header className="w-full bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        
        {/* Left Side: Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-inner">
            <span className="text-white text-2xl font-bold">✓</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-800 tracking-tight leading-none">
              To Do List
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">
              Productivity Tool
            </p>
          </div>
        </div>

        {/* Center: Task Counter (Hidden on tiny screens) */}
        <div className="hidden sm:flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="text-sm font-bold text-amber-700">
            {taskCount} {taskCount === 1 ? 'Task' : 'Tasks'} Remaining
          </span>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-3">
          
          {/* ✅ New Logout Button */}
          <button 
            onClick={handleLogout}
            className="text-sm font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>

      </div>
    </header>
  );
}

export default Header;