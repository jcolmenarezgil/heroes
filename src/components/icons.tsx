import React from "react";

type IconProps = {
  className?: string;
};

const Icon = ({
  className = "h-6 w-6",
  children,
  ariaLabel,
}: {
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    aria-hidden={ariaLabel ? undefined : "true"}
    aria-label={ariaLabel}
    role={ariaLabel ? "img" : undefined}
  >
    {children}
  </svg>
);

export const GlobeIcon = ({ className }: IconProps) => (
  <Icon className={className} ariaLabel="Language">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.959 11.959 0 013.387 6.073"
    />
  </Icon>
);

export const UserIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </Icon>
);

export const ArrowLeftIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
    />
  </Icon>
);

export const PencilSquareIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
    />
  </Icon>
);

export const MagnifyingGlassIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    />
  </Icon>
);

export const SearchEmptyIcon = ({ className }: IconProps) => (
  <Icon className={className} ariaLabel="No results">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.5 6.5l8 8M14.5 6.5l-8 8"
    />
  </Icon>
);

export const PlusIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </Icon>
);

export const CameraIcon = ({ className }: IconProps) => (
  <Icon className={className} ariaLabel="Upload photo">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 8.5h4l1.5-2.5h7l1.5 2.5h4a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1v-9a1 1 0 011-1z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.5 14a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z"
    />
  </Icon>
);

export const ShareIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314M3 12.375V6.375m0 12.75v-6"
    />
  </Icon>
);

export const ArrowDownTrayIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </Icon>
);

export const CheckCircleIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </Icon>
);

export const ExclamationTriangleIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </Icon>
);

export const XMarkIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </Icon>
);

export const ChevronDownIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
    />
  </Icon>
);

export const CloudIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 15a4.5 4.5 0 004.5-4.5H18a3 3 0 013 3v.008c0 .885-.402 1.661-1.008 2.127M2.25 15A4.5 4.5 0 016.75 10.5H18a3 3 0 013 3v.008c0 .885-.402 1.661-1.008 2.127M2.25 15A4.5 4.5 0 016.75 10.5H18a3 3 0 013 3v.008c0 .885-.402 1.661-1.008 2.127"
    />
  </Icon>
);
