"use client";

import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { WaitlistEditorLayout } from "./waitlist-editor-layout";

export const WaitlistGenerator = ({ initialWaitList, saveWaitList }) => {
  const [testEmail, setTestEmail] = useState("");
  const [isTestEmailLoading, setIsTestEmailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initialWaitList.logoUrl || "/images/logo.png");
  const [logoKey, setLogoKey] = useState(initialWaitList.logoKey || "");
  const [shareOnTwitter, setShareOnTwitter] = useState(initialWaitList.shareOnTwitter || false);
  const [shareOnWhatsapp, setShareOnWhatsapp] = useState(initialWaitList.shareOnWhatsapp || false);
  const [shareOnInstagram, setShareOnInstagram] = useState(initialWaitList.shareOnInstagram || false);
  const [shareOnFacebook, setShareOnFacebook] = useState(initialWaitList.shareOnFacebook || false);
  const [shareOnLinkedin, setShareOnLinkedin] = useState(initialWaitList.shareOnLinkedin || false);
  const [shareOnEmail, setShareOnEmail] = useState(initialWaitList.shareOnEmail || false);
  const [shareOnReddit, setShareOnReddit] = useState(initialWaitList.shareOnReddit || false);
  const [ogTitle, setOgTitle] = useState(initialWaitList.ogTitle || "");
  const [ogDescription, setOgDescription] = useState(initialWaitList.ogDescription || "");
  const [ogImage, setOgImage] = useState(initialWaitList.ogImage || "");

  const [buttonColor, setButtonColor] = useQueryState('buttonColor', {
    defaultValue: initialWaitList.buttonColor || "#FF6B4A"
  });
  const [buttonBorder, setButtonBorder] = useQueryState('buttonBorder', {
    defaultValue: initialWaitList.buttonBorder || "#FF9D7A"
  });
  const [buttonTextColor, setButtonTextColor] = useQueryState('buttonTextColor', {
    defaultValue: initialWaitList.buttonTextColor || "#FFFFFF"
  });
  const [mainBgColor, setMainBgColor] = useQueryState('mainBgColor', {
    defaultValue: initialWaitList.mainBgColor || "#FFFFFF"
  });
  const [enableMainBgColor, setEnableMainBgColor] = useQueryState('enableMainBgColor', {
    defaultValue: initialWaitList.enableMainBgColor || false,
    parse: (v) => v === 'true',
    serialize: (v) => String(v)
  });
  const [bgColor, setBgColor] = useQueryState('bgColor', {
    defaultValue: initialWaitList.bgColor || "#FFFFFF"
  });
  const [enableBgColor, setEnableBgColor] = useQueryState('enableBgColor', {
    defaultValue: initialWaitList.enableBgColor || false,
    parse: (v) => v === 'true',
    serialize: (v) => String(v)
  });
  const [borderWidth, setBorderWidth] = useQueryState('borderWidth', {
    defaultValue: initialWaitList.borderWidth || "0px"
  });
  const [borderRadius, setBorderRadius] = useQueryState('borderRadius', {
    defaultValue: initialWaitList.borderRadius || "large"
  });
  const [fontWeight, setFontWeight] = useQueryState('fontWeight', {
    defaultValue: initialWaitList.fontWeight || "normal"
  });
  const [logoSize, setLogoSize] = useQueryState('logoSize', {
    defaultValue: initialWaitList.logoSize || "1X"
  });
  const [buttonText, setButtonText] = useQueryState('buttonText', {
    defaultValue: initialWaitList.buttonText || "Join waitlist"
  });
  const [successMessage, setSuccessMessage] = useQueryState('successMessage', {
    defaultValue: initialWaitList.successMessage || "Success! You're on the waitlist"
  });
  const [sendEmailsToSubscribers, setSendEmailsToSubscribers] = useQueryState('sendEmailsToSubscribers', {
    defaultValue: initialWaitList.sendEmailsToSubscribers !== false,
    parse: (v) => v === 'false',
    serialize: (v) => String(v)
  });
  const [showLogo, setShowLogo] = useQueryState('showLogo', {
    defaultValue: initialWaitList.showLogo !== false,
    parse: (v) => v === 'true',
    serialize: (v) => String(v)
  });
  const [showSocialProof, setShowSocialProof] = useQueryState('showSocialProof', {
    defaultValue: initialWaitList.showSocialProof !== false,
    parse: (v) => v === 'true',
    serialize: (v) => String(v)
  });
  const [showBadge, setShowBadge] = useQueryState('showBadge', {
    defaultValue: initialWaitList.showBadge !== false,
    parse: (v) => v === 'true',
    serialize: (v) => String(v)
  });
  const [showBranding, setShowBranding] = useQueryState('showBranding', {
    defaultValue: initialWaitList.showBranding !== false,
    parse: (v) => v === 'true',
    serialize: (v) => String(v)
  });
  const [showReferrals, setShowReferrals] = useQueryState('showReferrals', {
    defaultValue: initialWaitList.showReferrals !== false,
    parse: (v) => v === 'true',
    serialize: (v) => String(v)
  });
  const [badgeText, setBadgeText] = useQueryState('badgeText', {
    defaultValue: initialWaitList.badgeText || "Sign Up and get 50% off on launch"
  });
  const [badgeColor, setBadgeColor] = useQueryState('badgeColor', {
    defaultValue: initialWaitList.badgeColor || "#FF9D7A"
  });
  const [badgeTextColor, setBadgeTextColor] = useQueryState('badgeTextColor', {
    defaultValue: initialWaitList.badgeTextColor || "#FFFFFF"
  });
  const [inputColor, setInputColor] = useQueryState('inputColor', {
    defaultValue: initialWaitList.inputColor || "#FFFFFF"
  });
  const [inputBorder, setInputBorder] = useQueryState('inputBorder', {
    defaultValue: initialWaitList.inputBorder || "#E5E7EB"
  });
  const [inputTextColor, setInputTextColor] = useQueryState('inputTextColor', {
    defaultValue: initialWaitList.inputTextColor || "#000000"
  });
  const [placeholderText, setPlaceholderText] = useQueryState('placeholderText', {
    defaultValue: initialWaitList.placeholderText || "Enter your email"
  });

  const formSettings = {
    // URL-synced settings
    buttonColor,
    buttonBorder,
    buttonTextColor,
    mainBgColor,
    enableMainBgColor,
    bgColor,
    enableBgColor,
    borderWidth,
    borderRadius,
    fontWeight,
    logoSize,
    buttonText,
    successMessage,
    sendEmailsToSubscribers,
    showLogo,
    showSocialProof,
    showBadge,
    showBranding,
    showReferrals,
    badgeText,
    badgeColor,
    badgeTextColor,
    inputColor,
    inputBorder,
    inputTextColor,
    placeholderText,

    // Non-URL-synced settings
    logoUrl,
    logoKey,
    shareOnTwitter,
    shareOnWhatsapp,
    shareOnInstagram,
    shareOnFacebook,
    shareOnLinkedin,
    shareOnEmail,
    shareOnReddit,
    ogTitle,
    ogDescription,
    ogImage,
  };

  const updateSetting = async (key, value) => {
    const setters = {
      buttonColor: setButtonColor,
      buttonBorder: setButtonBorder,
      buttonTextColor: setButtonTextColor,
      mainBgColor: setMainBgColor,
      enableMainBgColor: setEnableMainBgColor,
      bgColor: setBgColor,
      enableBgColor: setEnableBgColor,
      borderWidth: setBorderWidth,
      borderRadius: setBorderRadius,
      fontWeight: setFontWeight,
      logoSize: setLogoSize,
      buttonText: setButtonText,
      successMessage: setSuccessMessage,
      sendEmailsToSubscribers: setSendEmailsToSubscribers,
      showLogo: setShowLogo,
      showSocialProof: setShowSocialProof,
      showBadge: setShowBadge,
      showBranding: setShowBranding,
      showReferrals: setShowReferrals,
      badgeText: setBadgeText,
      badgeColor: setBadgeColor,
      badgeTextColor: setBadgeTextColor,
      inputColor: setInputColor,
      inputBorder: setInputBorder,
      inputTextColor: setInputTextColor,
      placeholderText: setPlaceholderText,
    };

    if (setters[key]) {
      await setters[key](value);
    } else {
      const localSetters = {
        logoUrl: setLogoUrl,
        logoKey: setLogoKey,
        shareOnTwitter: setShareOnTwitter,
        shareOnWhatsapp: setShareOnWhatsapp,
        shareOnInstagram: setShareOnInstagram,
        shareOnFacebook: setShareOnFacebook,
        shareOnLinkedin: setShareOnLinkedin,
        shareOnEmail: setShareOnEmail,
        shareOnReddit: setShareOnReddit,
        ogTitle: setOgTitle,
        ogDescription: setOgDescription,
        ogImage: setOgImage,
      };
      localSetters[key]?.(value);
    }
  };

  const presets = useMemo(() => ({
    modern: {
      mainBgColor: "#F9F9F9",
      enableMainBgColor: true,
      buttonColor: "#8B5CF6",
      buttonBorder: "#7C3AED",
      buttonTextColor: "#FFFFFF",
      bgColor: "#FFFFFF",
      enableBgColor: true,
      borderWidth: "0px",
      borderRadius: "medium",
      inputColor: "#F3F4F6",
      inputBorder: "#E5E7EB",
      inputTextColor: "#000000",
      badgeColor: "#8B5CF6",
      badgeTextColor: "#FFFFFF",
    },
    hot: {
      mainBgColor: "#FFDFDF",
      enableMainBgColor: true,
      buttonColor: "#FF4136",
      buttonBorder: "#E7040F",
      buttonTextColor: "#FFFFFF",
      bgColor: "#FFDFDF",
      enableBgColor: true,
      borderWidth: "2px",
      borderRadius: "large",
      inputColor: "#FFFFFF",
      inputBorder: "#FF4136",
      inputTextColor: "#FF4136",
      badgeColor: "#FF4136",
      badgeTextColor: "#FFFFFF",
    },
    minimal: {
      mainBgColor: "#FFFFFF",
      enableMainBgColor: true,
      buttonColor: "#000000",
      buttonBorder: "#000000",
      buttonTextColor: "#FFFFFF",
      bgColor: "#FFFFFF",
      enableBgColor: true,
      borderWidth: "1px",
      borderRadius: "small",
      inputColor: "#FFFFFF",
      inputBorder: "#000000",
      inputTextColor: "#000000",
      badgeColor: "#000000",
      badgeTextColor: "#FFFFFF",
    },
    funk: {
      mainBgColor: "#FFB6C1",
      enableMainBgColor: true,
      buttonColor: "#000000",
      buttonBorder: "#000000",
      buttonTextColor: "#FFB6C1",
      bgColor: "#FFB6C1",
      enableBgColor: true,
      borderWidth: "4px",
      borderRadius: "none",
      inputColor: "#FFFFFF",
      inputBorder: "#000000",
      inputTextColor: "#000000",
      badgeColor: "#FF69B4",
      badgeTextColor: "#000000",
    },
  }), []);

  const applyPreset = (preset) => {
    const settings = presets[preset];
    Object.entries(settings).forEach(([key, value]) => {
      updateSetting(key, value);
    });
  };

  return (
    <WaitlistEditorLayout
      initialWaitList={initialWaitList}
      saveWaitList={saveWaitList}
      isSaving={isSaving}
      setIsSaving={setIsSaving}
      testEmail={testEmail}
      setTestEmail={setTestEmail}
      isTestEmailLoading={isTestEmailLoading}
      setIsTestEmailLoading={setIsTestEmailLoading}
      formSettings={formSettings}
      updateSetting={updateSetting}
      applyPreset={applyPreset}
    />
  );
};
