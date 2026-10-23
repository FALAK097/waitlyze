"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/utils";

export const SHARE_CHANNELS = [
  { id: "x", label: "X" },
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "Linkedin" },
  { id: "whatsapp", label: "Whatsapp" },
  { id: "email", label: "Email" },
];

export function channelLabel(channel) {
  return SHARE_CHANNELS.find((item) => item.id === channel)?.label ?? channel;
}

export function buildShareHref(channel, { message, link, subject }) {
  if (channel === "x") return `https://x.com/intent/post?text=${encodeURIComponent(message)}`;
  if (channel === "linkedin")
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
  if (channel === "whatsapp") return `https://wa.me/?text=${encodeURIComponent(message)}`;
  if (channel === "email")
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  return null;
}

function XIcon({ className }) {
  return (
    <svg viewBox="-60 -60 1320 1347" className={className} aria-hidden="true">
      <rect x="-60" y="-60" width="1320" height="1347" rx="300" fill="#000" />
      <path
        fill="#fff"
        d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z"
      />
    </svg>
  );
}

function InstagramIcon({ className }) {
  const uid = useId().replaceAll(":", "");
  const yellow = `ig-y-${uid}`;
  const yellowFade = `ig-yf-${uid}`;
  const purple = `ig-p-${uid}`;
  const pink = `ig-k-${uid}`;
  return (
    <svg viewBox="0 0 264.583 264.583" className={className} aria-hidden="true">
      <defs>
        <radialGradient
          id={yellow}
          cx="158.429"
          cy="578.088"
          r="52.352"
          fx="158.429"
          fy="578.088"
          gradientTransform="matrix(0 -4.03418 4.28018 0 -2332.227 942.236)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#fc0" />
          <stop offset=".124" stopColor="#fc0" />
          <stop offset=".567" stopColor="#fe4a05" />
          <stop offset=".694" stopColor="#ff0f3f" />
          <stop offset="1" stopColor="#fe0657" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id={yellowFade}
          cx="172.615"
          cy="600.692"
          r="65"
          fx="172.615"
          fy="600.692"
          gradientTransform="matrix(.67441 -1.16203 1.51283 .87801 -814.366 -47.835)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#fc0" />
          <stop offset="1" stopColor="#fc0" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id={purple}
          cx="144.012"
          cy="51.337"
          r="67.081"
          fx="144.012"
          fy="51.337"
          gradientTransform="matrix(-2.3989 .67549 -.23008 -.81732 464.996 -26.404)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#780cff" />
          <stop offset="1" stopColor="#820bff" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id={pink}
          cx="199.788"
          cy="628.438"
          r="52.352"
          fx="199.788"
          fy="628.438"
          gradientTransform="matrix(-3.10797 .87652 -.6315 -2.23914 1345.65 1374.198)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ff005f" />
          <stop offset="1" stopColor="#fc01d8" />
        </radialGradient>
      </defs>
      <path
        fill={`url(#${pink})`}
        d="M204.15 18.143c-55.23 0-71.383.057-74.523.317-11.334.943-18.387 2.728-26.07 6.554-5.922 2.942-10.592 6.351-15.201 11.13-8.394 8.716-13.481 19.439-15.323 32.184-.895 6.188-1.156 7.45-1.209 39.056-.02 10.536 0 24.4 0 42.999 0 55.2.062 71.341.326 74.476.916 11.032 2.645 17.973 6.308 25.565 7 14.533 20.37 25.443 36.12 29.514 5.453 1.404 11.476 2.178 19.208 2.544 3.277.142 36.669.244 70.081.244 33.413 0 66.826-.04 70.02-.203 8.954-.422 14.153-1.12 19.901-2.606 15.852-4.09 28.977-14.838 36.12-29.575 3.591-7.409 5.412-14.614 6.236-25.07.18-2.28.255-38.626.255-74.924 0-36.304-.082-72.583-.26-74.863-.835-10.625-2.656-17.77-6.364-25.32-3.042-6.182-6.42-10.799-11.324-15.519-8.752-8.361-19.455-13.45-32.21-15.29-6.18-.894-7.41-1.158-39.033-1.213z"
        transform="translate(-71.816 -18.143)"
      />
      <path
        fill={`url(#${yellow})`}
        d="M204.15 18.143c-55.23 0-71.383.057-74.523.317-11.334.943-18.387 2.728-26.07 6.554-5.922 2.942-10.592 6.351-15.201 11.13-8.394 8.716-13.481 19.439-15.323 32.184-.895 6.188-1.156 7.45-1.209 39.056-.02 10.536 0 24.4 0 42.999 0 55.2.062 71.341.326 74.476.916 11.032 2.645 17.973 6.308 25.565 7 14.533 20.37 25.443 36.12 29.514 5.453 1.404 11.476 2.178 19.208 2.544 3.277.142 36.669.244 70.081.244 33.413 0 66.826-.04 70.02-.203 8.954-.422 14.153-1.12 19.901-2.606 15.852-4.09 28.977-14.838 36.12-29.575 3.591-7.409 5.412-14.614 6.236-25.07.18-2.28.255-38.626.255-74.924 0-36.304-.082-72.583-.26-74.863-.835-10.625-2.656-17.77-6.364-25.32-3.042-6.182-6.42-10.799-11.324-15.519-8.752-8.361-19.455-13.45-32.21-15.29-6.18-.894-7.41-1.158-39.033-1.213z"
        transform="translate(-71.816 -18.143)"
      />
      <path
        fill={`url(#${yellowFade})`}
        d="M204.15 18.143c-55.23 0-71.383.057-74.523.317-11.334.943-18.387 2.728-26.07 6.554-5.922 2.942-10.592 6.351-15.201 11.13-8.394 8.716-13.481 19.439-15.323 32.184-.895 6.188-1.156 7.45-1.209 39.056-.02 10.536 0 24.4 0 42.999 0 55.2.062 71.341.326 74.476.916 11.032 2.645 17.973 6.308 25.565 7 14.533 20.37 25.443 36.12 29.514 5.453 1.404 11.476 2.178 19.208 2.544 3.277.142 36.669.244 70.081.244 33.413 0 66.826-.04 70.02-.203 8.954-.422 14.153-1.12 19.901-2.606 15.852-4.09 28.977-14.838 36.12-29.575 3.591-7.409 5.412-14.614 6.236-25.07.18-2.28.255-38.626.255-74.924 0-36.304-.082-72.583-.26-74.863-.835-10.625-2.656-17.77-6.364-25.32-3.042-6.182-6.42-10.799-11.324-15.519-8.752-8.361-19.455-13.45-32.21-15.29-6.18-.894-7.41-1.158-39.033-1.213z"
        transform="translate(-71.816 -18.143)"
      />
      <path
        fill={`url(#${purple})`}
        d="M204.15 18.143c-55.23 0-71.383.057-74.523.317-11.334.943-18.387 2.728-26.07 6.554-5.922 2.942-10.592 6.351-15.201 11.13-8.394 8.716-13.481 19.439-15.323 32.184-.895 6.188-1.156 7.45-1.209 39.056-.02 10.536 0 24.4 0 42.999 0 55.2.062 71.341.326 74.476.916 11.032 2.645 17.973 6.308 25.565 7 14.533 20.37 25.443 36.12 29.514 5.453 1.404 11.476 2.178 19.208 2.544 3.277.142 36.669.244 70.081.244 33.413 0 66.826-.04 70.02-.203 8.954-.422 14.153-1.12 19.901-2.606 15.852-4.09 28.977-14.838 36.12-29.575 3.591-7.409 5.412-14.614 6.236-25.07.18-2.28.255-38.626.255-74.924 0-36.304-.082-72.583-.26-74.863-.835-10.625-2.656-17.77-6.364-25.32-3.042-6.182-6.42-10.799-11.324-15.519-8.752-8.361-19.455-13.45-32.21-15.29-6.18-.894-7.41-1.158-39.033-1.213z"
        transform="translate(-71.816 -18.143)"
      />
      <path
        fill="#fff"
        d="M132.345 33.973c-26.716 0-30.07.117-40.563.594-10.472.48-17.62 2.136-23.876 4.567-6.47 2.51-11.958 5.87-17.426 11.335-5.472 5.464-8.834 10.948-11.354 17.412-2.44 6.252-4.1 13.397-4.57 23.858-.47 10.486-.593 13.838-.593 40.535 0 26.697.119 30.037.594 40.522.482 10.465 2.14 17.609 4.57 23.859 2.515 6.465 5.876 11.95 11.346 17.414 5.466 5.468 10.955 8.834 17.42 11.345 6.26 2.431 13.41 4.088 23.881 4.567 10.493.477 13.844.594 40.559.594 26.719 0 30.061-.117 40.555-.594 10.472-.48 17.63-2.136 23.888-4.567 6.468-2.51 11.948-5.877 17.414-11.345 5.472-5.464 8.834-10.949 11.354-17.412 2.419-6.252 4.079-13.398 4.57-23.858.472-10.486.595-13.828.595-40.525s-.123-30.047-.594-40.533c-.492-10.465-2.152-17.608-4.57-23.858-2.521-6.466-5.883-11.95-11.355-17.414-5.472-5.468-10.944-8.827-17.42-11.335-6.271-2.431-13.424-4.088-23.897-4.567-10.493-.477-13.834-.594-40.558-.594zm-8.825 17.715c2.62-.004 5.542 0 8.825 0 26.266 0 29.38.094 39.752.565 9.591.438 14.797 2.04 18.264 3.385 4.591 1.782 7.864 3.912 11.305 7.352 3.443 3.44 5.575 6.717 7.362 11.305 1.346 3.46 2.951 8.663 3.388 18.247.47 10.363.573 13.475.573 39.71 0 26.233-.102 29.346-.573 39.709-.44 9.584-2.042 14.786-3.388 18.247-1.783 4.587-3.919 7.854-7.362 11.292-3.443 3.441-6.712 5.57-11.305 7.352-3.463 1.352-8.673 2.95-18.264 3.388-10.37.47-13.486.573-39.752.573-26.268 0-29.38-.102-39.751-.573-9.592-.443-14.797-2.044-18.267-3.39-4.59-1.781-7.87-3.911-11.313-7.352-3.443-3.44-5.574-6.709-7.362-11.298-1.346-3.461-2.95-8.663-3.387-18.247-.472-10.363-.566-13.476-.566-39.726s.094-29.347.566-39.71c.438-9.584 2.04-14.786 3.387-18.25 1.783-4.588 3.919-7.865 7.362-11.305 3.443-3.441 6.722-5.57 11.313-7.357 3.468-1.351 8.675-2.949 18.267-3.389 9.075-.41 12.592-.532 30.926-.553zm61.337 16.322c-6.518 0-11.805 5.277-11.805 11.792 0 6.512 5.287 11.796 11.805 11.796 6.517 0 11.804-5.284 11.804-11.796 0-6.513-5.287-11.796-11.805-11.796zm-52.512 13.782c-27.9 0-50.519 22.603-50.519 50.482 0 27.879 22.62 50.471 50.52 50.471s50.51-22.592 50.51-50.471c0-27.879-22.613-50.482-50.513-50.482zm0 17.715c18.11 0 32.792 14.67 32.792 32.767 0 18.096-14.683 32.767-32.792 32.767-18.11 0-32.791-14.671-32.791-32.767 0-18.098 14.68-32.767 32.791-32.767z"
      />
    </svg>
  );
}

function WhatsAppIcon({ className }) {
  return (
    <svg viewBox="0 0 360 362" className={className} aria-hidden="true">
      <path
        fill="#25D366"
        fillRule="evenodd"
        d="M307.546 52.566C273.709 18.684 228.706.017 180.756 0 81.951 0 1.538 80.404 1.504 179.235c-.017 31.594 8.242 62.432 23.928 89.609L0 361.736l95.024-24.925c26.179 14.285 55.659 21.805 85.655 21.814h.077c98.788 0 179.21-80.413 179.244-179.244.017-47.898-18.608-92.926-52.454-126.807v-.008Zm-126.79 275.788h-.06c-26.73-.008-52.952-7.194-75.831-20.765l-5.44-3.231-56.391 14.791 15.05-54.981-3.542-5.638c-14.912-23.721-22.793-51.139-22.776-79.286.035-82.14 66.867-148.973 149.051-148.973 39.793.017 77.198 15.53 105.328 43.695 28.131 28.157 43.61 65.596 43.593 105.398-.035 82.149-66.867 148.982-148.982 148.982v.008Zm81.719-111.577c-4.478-2.243-26.497-13.073-30.606-14.568-4.108-1.496-7.09-2.243-10.073 2.243-2.982 4.487-11.568 14.577-14.181 17.559-2.613 2.991-5.226 3.361-9.704 1.117-4.477-2.243-18.908-6.97-36.02-22.226-13.313-11.878-22.304-26.54-24.916-31.027-2.613-4.486-.275-6.91 1.959-9.136 2.011-2.011 4.478-5.234 6.721-7.847 2.244-2.613 2.983-4.486 4.478-7.469 1.496-2.991.748-5.603-.369-7.847-1.118-2.243-10.073-24.289-13.812-33.253-3.636-8.732-7.331-7.546-10.073-7.692-2.613-.13-5.595-.155-8.586-.155-2.991 0-7.839 1.118-11.947 5.604-4.108 4.486-15.677 15.324-15.677 37.361s16.047 43.344 18.29 46.335c2.243 2.991 31.585 48.225 76.51 67.632 10.684 4.615 19.029 7.374 25.535 9.437 10.727 3.412 20.49 2.931 28.208 1.779 8.604-1.289 26.498-10.838 30.228-21.298 3.73-10.46 3.73-19.433 2.613-21.298-1.117-1.865-4.108-2.991-8.586-5.234l.008-.017Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LinkedInIcon({ className }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden="true">
      <rect width="256" height="256" rx="56" fill="#0A66C2" />
      <text
        x="128"
        y="198"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="150"
        fill="#fff"
      >
        in
      </text>
    </svg>
  );
}

function EmailIcon({ className }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden="true">
      <rect width="256" height="256" rx="56" fill="#26262b" />
      <rect
        x="56"
        y="86"
        width="144"
        height="84"
        rx="12"
        fill="none"
        stroke="#fff"
        strokeWidth="14"
      />
      <path
        d="M64 98l64 42 64-42"
        fill="none"
        stroke="#fff"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS = {
  x: XIcon,
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
  whatsapp: WhatsAppIcon,
  email: EmailIcon,
};

export function ShareChannelIcon({ channel, className = "size-4" }) {
  const Icon = ICONS[channel];
  if (!Icon) return null;
  return <Icon className={className} />;
}

export function ShareButtons({
  channels,
  message,
  link,
  subject,
  onShare,
  className,
  iconClassName = "size-10",
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      onShare?.("instagram");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {channels.map((channel) => {
        const Icon = ICONS[channel];
        if (!Icon) return null;
        if (channel === "instagram")
          return (
            <button
              type="button"
              key={channel}
              aria-label={copied ? "Link copied" : "Copy link for Instagram"}
              title={copied ? "Copied" : "Copy link for Instagram"}
              onClick={copyLink}
              className="cursor-pointer border-0 bg-transparent p-0 transition-opacity hover:opacity-85"
            >
              <Icon className={iconClassName} />
            </button>
          );
        const href = buildShareHref(channel, { message, link, subject });
        if (!href) return null;
        return (
          <a
            key={channel}
            href={href}
            target={channel === "email" ? undefined : "_blank"}
            rel={channel === "email" ? undefined : "noreferrer"}
            aria-label={`Share on ${channelLabel(channel)}`}
            title={`Share on ${channelLabel(channel)}`}
            onClick={() => onShare?.(channel)}
            className="transition-opacity hover:opacity-85"
          >
            <Icon className={iconClassName} />
          </a>
        );
      })}
    </div>
  );
}
