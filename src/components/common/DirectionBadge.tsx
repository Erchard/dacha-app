import React from 'react';

// Color map for the 15 MI directions
const DIRECTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Емоційна підтримка': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  'Екологія': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
  'Культура': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'Громадська активність': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'Освіта, просвіта': { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  'Толока': { bg: 'bg-lime-50', text: 'text-lime-800', border: 'border-lime-200' },
  'Благоустрій Дачі': { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  'Психологічна допомога': { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  'Майстер-клас': { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
  'Клуб': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  'Для людей старшого віку': { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
  'Для дітей': { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
  'Для молоді': { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
  'Творчі зустрічі': { bg: 'bg-fuchsia-50', text: 'text-fuchsia-800', border: 'border-fuchsia-200' },
  'Концерт': { bg: 'bg-pink-50', text: 'text-pink-800', border: 'border-pink-200' },
};

interface DirectionBadgeProps {
  direction: string;
  size?: 'sm' | 'md';
  onClick?: () => void;
  selected?: boolean;
}

export const DirectionBadge: React.FC<DirectionBadgeProps> = ({
  direction,
  size = 'sm',
  onClick,
  selected = false,
}) => {
  const scheme = DIRECTION_COLORS[direction] || {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  };

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center rounded-full font-medium transition-all border ${sizeClasses} ${
          selected
            ? 'bg-[#36674D] text-white border-[#36674D] shadow-sm'
            : `${scheme.bg} ${scheme.text} ${scheme.border} hover:opacity-80`
        }`}
      >
        {direction}
      </button>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${sizeClasses} ${scheme.bg} ${scheme.text} ${scheme.border}`}
    >
      {direction}
    </span>
  );
};
