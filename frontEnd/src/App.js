// frontEnd/src/App.js
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Main from './components/Main';
import Register from './components/Register';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<ProtectedRoute><Main /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
