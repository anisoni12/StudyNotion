import './App.css';
import { Route, Routes } from 'react-router-dom';
import About from "./pages/About";
import Home from "./pages/Home";
import Navbar from "./components/common/Navbar"
import ContactPage from "./pages/Contact"
import LoginPage from "./pages/Login"
import SignupPage from "./pages/Signup"


function App() {

  return (
   <div className='min-w-screen min-h-screen bg-richblack-900 flex flex-col font-inter'>
    <Navbar />
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/about' element={<About />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
   </div>
  );
}

export default App;
