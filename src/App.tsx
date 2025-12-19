import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Editor } from './Editor';
import { LandingPage } from './LandingPage';

function App() {
    return (
        <Router basename='/zigmage'>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/editor" element={<Editor />} />
            </Routes>
        </Router>
    );
}

export default App;
