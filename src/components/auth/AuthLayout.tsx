import React from 'react';
import { LoginHero } from './LoginHero';
import { LoginForm } from './LoginForm';

interface AuthLayoutProps {
  children?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="relative flex min-h-screen w-full overflow-hidden">
      <LoginHero />
      <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-6 sm:p-12 bg-background-light dark:bg-background-dark">
        {children || <LoginForm />}
      </div>
    </div>
  );
};

