import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Register from './pages/Register.jsx'
import ListItems from './pages/ListItems.jsx'
import './css/global.css'
import axios from 'axios'

import {
  BrowserRouter,
  Routes,
  Route} from "react-router-dom";

axios.defaults.baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/LT" element={<ListItems/>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)