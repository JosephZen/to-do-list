import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const API = "https://to-do-list-wr45.onrender.com";
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // We don't need the full URL because main.jsx handles it
      const response = await axios.post('/login', { username, password });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Welcome Back!',
          text: `Hello, ${response.data.user.name}`,
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
           navigate('/Home'); 
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.response?.data?.message || "Server Error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        <form className="space-y-4">
          <input 
            type="text" 
            id="username"           // ✅ Added ID
            name="username"         // ✅ Added Name
            autoComplete="username" // ✅ Added AutoComplete
            placeholder="Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />
          <input 
            type="password" 
            id="password"                   // ✅ Added ID
            name="password"                 // ✅ Added Name
            autoComplete="current-password" // ✅ Added AutoComplete
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />
          <button 
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
          <div className="text-center mt-4">
            <span onClick={() => navigate('Register')} className="text-blue-500 cursor-pointer hover:underline">
              Create an account
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;