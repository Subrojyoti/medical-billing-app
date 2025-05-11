'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Button from './ui/Button';
import { useRouter, usePathname } from 'next/navigation';

interface HeaderProps {
  title: string;
  onLogout: () => void;
}

export default function Header({ title, onLogout }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Determine which navigation items to show based on current path
  const showDashboardOnly = pathname === '/dashboard';
  const navigationItems = showDashboardOnly ? (
    <Button onClick={onLogout} variant="secondary">
      Logout
    </Button>
  ) : (
    <>
      <Button onClick={() => router.push('/dashboard')} variant="ghost">
        Dashboard
      </Button>
      <Button onClick={onLogout} variant="secondary">
        Logout
      </Button>
    </>
  );

  // Mobile menu items based on current path
  const mobileMenuItems = showDashboardOnly ? (
    <button
      onClick={() => {
        onLogout();
        setIsMenuOpen(false);
      }}
      className="px-4 py-2 text-left hover:bg-gray-100 text-red-600 font-medium"
    >
      Logout
    </button>
  ) : (
    <>
      <button
        onClick={() => {
          router.push('/dashboard');
          setIsMenuOpen(false);
        }}
        className="px-4 py-2 text-left hover:bg-gray-100 text-gray-700"
      >
        Dashboard
      </button>
      <button
        onClick={() => {
          onLogout();
          setIsMenuOpen(false);
        }}
        className="px-4 py-2 text-left hover:bg-gray-100 text-red-600 font-medium"
      >
        Logout
      </button>
    </>
  );

  return (
    <header className="relative">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
        <div className="flex items-center gap-4">
          <Image
            src="/ABSOLUTE_PROSTHETICS_AND_ORTHOTICS_logo.png"
            alt="Absolute Prosthetics & Orthotics Logo"
            width={80}
            height={80}
            className="object-contain w-auto h-auto"
            priority
          />
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">
          {navigationItems}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg rounded-lg py-2 z-50 border border-gray-200">
          <div className="flex flex-col">
            {mobileMenuItems}
          </div>
        </div>
      )}
    </header>
  );
} 