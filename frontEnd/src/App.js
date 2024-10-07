// frontEnd/src/App.js
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Main from './components/Main';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<ProtectedRoute><Main /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
