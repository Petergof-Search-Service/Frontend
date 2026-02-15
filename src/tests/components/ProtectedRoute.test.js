import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';

const ProtectedContent = () => <div>Защищённый контент</div>;

const renderProtected = (hasTokens = false) => {
  if (hasTokens) {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('refresh_token', 'refresh');
  } else {
    localStorage.clear();
  }
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <ProtectedContent />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Страница входа</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('показывает дочерний контент при наличии токенов', () => {
    renderProtected(true);
    expect(screen.getByText('Защищённый контент')).toBeInTheDocument();
  });

  it('редиректит на /login при отсутствии токенов', () => {
    renderProtected(false);
    expect(screen.getByText('Страница входа')).toBeInTheDocument();
    expect(screen.queryByText('Защищённый контент')).not.toBeInTheDocument();
  });
});
