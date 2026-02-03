import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

function Register() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      Swal.fire('Error', 'Passwords do not match', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      // Sends: name, username, password, confirm
      const response = await axios.post('/register', {
        name, username, password, confirm
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Account created. Please login.',
        }).then(() => {
          navigate('/'); // Redirect to Login
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: error.response?.data?.message || "Server Error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
        <form className="space-y-4">
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border rounded-lg" />
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 border rounded-lg" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-lg" />
          <input type="password" placeholder="Confirm Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full p-3 border rounded-lg" />
          
          <button onClick={handleRegister} disabled={isLoading} className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700">
            {isLoading ? "Creating..." : "Register"}
          </button>
          
          <div className="text-center mt-4">
            <span onClick={() => navigate('/')} className="text-blue-500 cursor-pointer hover:underline">
              Back to Login
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;