import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import LoginForm from "./components/Login";
import RegisterForm from "./components/Register";
import ChatComponent from "./components/Chat";
import CreateIndex from "./components/CreateIndex";
import OcrUpload from "./components/OcrUpload";
import Settings from "./components/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { ThemeProvider } from "./contexts/ThemeContext";

const CatchAllRoute = () => {
    const isAuthenticated = localStorage.getItem("access_token") && localStorage.getItem("refresh_token");
    return <Navigate to={isAuthenticated ? "/chat" : "/login"} replace/>;
};

function App() {
    return (
        <ThemeProvider>
            <Router>
                <Routes>
                <Route path="/login" element={<PublicRoute><LoginForm/></PublicRoute>}/>
                <Route path="/register" element={<PublicRoute><RegisterForm/></PublicRoute>}/>
                <Route
                    path="/chat"
                    element={
                        <ProtectedRoute>
                            <ChatComponent/>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/chat/:chatId"
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
                <Route path="*" element={<CatchAllRoute />}/>
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App
