'use client';

import { useRouter } from 'next/navigation';

interface NavigationProps {
  to: string;
  label: string;
  className?: string;
}

export function Navigation({ to, label, className = '' }: NavigationProps) {
  const router = useRouter();

  const handleNavigate = () => {
    router.push(to);
  };

  return (
    <button
      onClick={handleNavigate}
      className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${className}`}
    >
      {label}
    </button>
  );
}

