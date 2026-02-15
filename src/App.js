import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import LoginForm from "./components/Login";
import RegisterForm from "./components/Register";
import ChatComponent from "./components/Chat";
import CreateIndex from "./components/CreateIndex";
import OcrUpload from "./components/OcrUpload";
import Settings from "./components/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
    const isAuthenticated = localStorage.getItem("access_token") && localStorage.getItem("refresh_token");

    return (
        <ThemeProvider>
            <Router>
                <Routes>
                <Route path="/login" element={isAuthenticated ? <Navigate to="/chat" replace /> : <LoginForm/>}/>
                <Route path="/register" element={isAuthenticated ? <Navigate to="/chat" replace /> : <RegisterForm/>}/>
                <Route 
                    path="/chat" 
                    element={
                        <ProtectedRoute>
                            <ChatComponent/>
                        </ProtectedRoute>
                    }
                />
                <Route 
                    path="/create_index" 
                    element={
                        <ProtectedRoute>
                            <CreateIndex/>
                        </ProtectedRoute>
                    }
                />
                <Route 
                    path="/file" 
                    element={
                        <ProtectedRoute>
                            <OcrUpload/>
                        </ProtectedRoute>
                    }
                />
                <Route 
                    path="/settings" 
                    element={
                        <ProtectedRoute>
                            <Settings/>
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to={isAuthenticated ? "/chat" : "/login"} replace/>}/>
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App
