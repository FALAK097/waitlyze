"use client";

import { useQueryState } from "nuqs";
import { removeImage } from "@/app/actions/waitLists";
import { Button } from "@/components/product/button";
import { notifySettingsResult } from "@/components/product/settings-feedback";
import styles from "./legacy-editor.module.css";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CodeIcon, Save, ShareIcon, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CopyIcon } from "../shared/icons";
import { CodeBlock } from "../ui/code-block";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { SettingsTab } from "./settings-tab";
import { SignUpForm } from "./sign-up-form";
import Link from "next/link";

const EmbedModal = ({ waitList, origin }) => {
  return (
    <Dialog>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Embed instructions">
              <CodeIcon className="w-4 h-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Embed form</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Instructions</DialogTitle>
          <DialogDescription>
            Follow these steps to embed the form on your website.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <p className="col-span-3 my-2 mb-4">
              {`Step 1. Copy and paste the below code in the <head> section`}
            </p>
            <CodeBlock
              language="html"
              code={`<!-- Waitlyze Widget JS -->\n<script src="${origin}/js/embed.js" defer></script>`}
            />
          </div>
          <div>
            <p className="col-span-3 my-2 mb-4">
              Step 2. Paste the following code anywhere on your page where you
              want to display the form
            </p>
            <CodeBlock
              language="html"
              code={`<!-- Waitlyze Widget UI -->\n<div class="waitlyze-widget" data-key-id="${waitList.id}" data-height="380px"></div>`}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const WaitlistGenerator = ({ initialWaitList, saveWaitList }) => {
  const [origin, setOrigin] = useState("");
  const [testEmail, setTestEmail] = useState("");
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

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

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
    parse: (v) => v === 'true',
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

  const presets = {
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
  };

  const applyPreset = (preset) => {
    const settings = presets[preset];
    Object.entries(settings).forEach(([key, value]) => {
      updateSetting(key, value);
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await saveWaitList(initialWaitList.id, { ...formSettings });
      if (response.success) toast.success(response.message);
      else notifySettingsResult({ error: response.message || "Could not save your page. Try again." });
    } catch { notifySettingsResult({ error: "Could not save your page. Try again." }); }
    finally { setIsSaving(false); }
  };

  const copyShareUrlToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/forms/${initialWaitList.id}`);
      toast.success("Page link copied.");
    } catch { notifySettingsResult({ error: "Copy is unavailable. Select the link and copy it manually." }); }
  };

  const handleDeleteLogo = async () => {
    const logoKey = formSettings.logoKey;
    if (!logoKey) {
      notifySettingsResult({ error: "This logo cannot be removed. Upload a replacement instead." });
      return;
    }

    if (!window.confirm("Remove this logo? The uploaded image will be deleted.")) return;
    try {
      const response = await removeImage(logoKey, initialWaitList.id);
      if (response.success) {
        toast.success("Logo deleted successfully.");
        updateSetting("logoUrl", "");
        updateSetting("logoKey", "");
      } else {
        notifySettingsResult({ error: response.message || "Could not remove the logo. Try again." });
      }
    } catch (error) {
      console.error("Error deleting logo:", error);
      notifySettingsResult({ error: "Could not remove the logo. Try again." });
    }
  };

  const onImageUploadSuccess = (files) => {
    updateSetting("logoUrl", files[0].url);
    updateSetting("logoKey", files[0].key);
  };

  return (
    <div className={styles.editor}>
      <div>
        <header className={styles.header}><div><h2>Form editor</h2><p>Customize the form, then save your changes.</p></div><div className={styles.toolbar}>
          <TooltipProvider>
            <div className={styles.toolbarActions}>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button disabled={isSaving} onClick={handleSave}><Save className="w-4 h-4" aria-hidden="true" />{isSaving ? "Saving…" : "Save changes"}</Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Save changes
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Link className={styles.secondaryLink} href={`/wait-lists/${initialWaitList.id}/emails`}><Mail className="w-4 h-4" aria-hidden="true" /><span>Email templates</span></Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Email templates
                </TooltipContent>
              </Tooltip>

              <EmbedModal waitList={initialWaitList} origin={origin} />

              <Dialog>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Share waitlist">
                        <ShareIcon className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Share link
                  </TooltipContent>
                </Tooltip>

                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Share link</DialogTitle>
                    <DialogDescription>
                      Copy the link below to share your waitlist form.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                      <Label htmlFor="link" className="sr-only">
                        Link
                      </Label>
                      <Input
                        id="link"
                        value={origin ? `${origin}/forms/${initialWaitList.id}` : ""}
                        readOnly
                      />
                    </div>
                    <Button
                      onClick={copyShareUrlToClipboard}
                      type="submit"
                      size="sm"
                      className="px-3"
                    >
                      <span className="sr-only">Copy</span>
                      <CopyIcon />
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TooltipProvider>
        </div></header>

        <div className={styles.grid}>
          <SettingsTab formSettings={formSettings} updateSetting={updateSetting} applyPreset={applyPreset} />
          <section className={styles.previewColumn} aria-labelledby="legacy-preview-heading"><div className={styles.previewHeading}><h3 id="legacy-preview-heading">Preview</h3><p>No subscriber is created here.</p></div>
          <div
            style={{
              backgroundColor: formSettings.enableMainBgColor
                ? formSettings.mainBgColor
                : "transparent",
            }}
            className={styles.preview}
          >
            <SignUpForm
              email={testEmail}
              isLoading={false}
              setEmail={setTestEmail}
              waitList={{
                ...formSettings,
                mainBgColor: formSettings.enableMainBgColor
                  ? formSettings.mainBgColor
                  : null,
                bgColor: formSettings.enableBgColor
                  ? formSettings.bgColor
                  : null,
              }}
              onDeleteLogo={handleDeleteLogo}
              onSubmit={(event) => {
                event.preventDefault();
                toast("Preview only. No subscriber was created.");
              }}
              onImageUploadSuccess={onImageUploadSuccess}
            />
          </div></section>
        </div>
      </div>
    </div>
  );
};
