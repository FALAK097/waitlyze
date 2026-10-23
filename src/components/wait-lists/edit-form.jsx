"use client";

import { CodeIcon, FloppyDiskIcon, Mail01Icon, Share01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { pauseLegacyWaitlist, publishLegacyWaitlist } from "@/app/actions/publication";
import { removeImage } from "@/app/actions/waitLists";
import { Button } from "@/components/ui/button";
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

import { CopyIcon } from "../shared/icons";
import { CodeBlock } from "../ui/code-block";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { SettingsTab } from "./settings-tab";
import { SignUpForm } from "./sign-up-form";

import styles from "./legacy-editor.module.css";

const EmbedModal = ({ waitList, origin }) => {
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Embed instructions">
                  <HugeiconsIcon icon={CodeIcon} className="h-4 w-4" />
                </Button>
              }
            />
          }
        />
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
              Step 2. Paste the following code anywhere on your page where you want to display the
              form
            </p>
            <CodeBlock
              language="html"
              code={`<!-- Waitlyze Widget UI -->\n<div class="waitlyze-widget" data-key-id="${waitList.id}" data-height="380px"></div>`}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Done</Button>} />
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
  const [shareOnInstagram, setShareOnInstagram] = useState(
    initialWaitList.shareOnInstagram || false,
  );
  const [shareOnFacebook, setShareOnFacebook] = useState(initialWaitList.shareOnFacebook || false);
  const [shareOnLinkedin, setShareOnLinkedin] = useState(initialWaitList.shareOnLinkedin || false);
  const [shareOnEmail, setShareOnEmail] = useState(initialWaitList.shareOnEmail || false);
  const [shareOnReddit, setShareOnReddit] = useState(initialWaitList.shareOnReddit || false);
  const [ogTitle, setOgTitle] = useState(initialWaitList.ogTitle || "");
  const [ogDescription, setOgDescription] = useState(initialWaitList.ogDescription || "");
  const [ogImage, setOgImage] = useState(initialWaitList.ogImage || "");
  const [name, setName] = useState(initialWaitList.name || "Untitled waitlist");
  const [description, setDescription] = useState(initialWaitList.description || "");
  const [publicSlug, setPublicSlug] = useState(initialWaitList.publicSlug || "");
  const [status, setStatus] = useState(initialWaitList.status || "DRAFT");
  const [isPublishing, setIsPublishing] = useState(false);
  // Last successfully saved page address. Share links always use this, never
  // the unsaved field value.
  const [savedSlug, setSavedSlug] = useState(initialWaitList.publicSlug || "");
  const [logoConfirmOpen, setLogoConfirmOpen] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const [buttonColor, setButtonColor] = useQueryState("buttonColor", {
    defaultValue: initialWaitList.buttonColor || "#FF6B4A",
  });
  const [buttonBorder, setButtonBorder] = useQueryState("buttonBorder", {
    defaultValue: initialWaitList.buttonBorder || "#FF9D7A",
  });
  const [buttonTextColor, setButtonTextColor] = useQueryState("buttonTextColor", {
    defaultValue: initialWaitList.buttonTextColor || "#FFFFFF",
  });
  const [mainBgColor, setMainBgColor] = useQueryState("mainBgColor", {
    defaultValue: initialWaitList.mainBgColor || "#FFFFFF",
  });
  const [enableMainBgColor, setEnableMainBgColor] = useQueryState("enableMainBgColor", {
    defaultValue: initialWaitList.enableMainBgColor || false,
    parse: (v) => v === "true",
    serialize: (v) => String(v),
  });
  const [bgColor, setBgColor] = useQueryState("bgColor", {
    defaultValue: initialWaitList.bgColor || "#FFFFFF",
  });
  const [enableBgColor, setEnableBgColor] = useQueryState("enableBgColor", {
    defaultValue: initialWaitList.enableBgColor || false,
    parse: (v) => v === "true",
    serialize: (v) => String(v),
  });
  const [borderWidth, setBorderWidth] = useQueryState("borderWidth", {
    defaultValue: initialWaitList.borderWidth || "0px",
  });
  const [borderRadius, setBorderRadius] = useQueryState("borderRadius", {
    defaultValue: initialWaitList.borderRadius || "large",
  });
  const [fontWeight, setFontWeight] = useQueryState("fontWeight", {
    defaultValue: initialWaitList.fontWeight || "normal",
  });
  const [logoSize, setLogoSize] = useQueryState("logoSize", {
    defaultValue: initialWaitList.logoSize || "1X",
  });
  const [buttonText, setButtonText] = useQueryState("buttonText", {
    defaultValue: initialWaitList.buttonText || "Join waitlist",
  });
  const [successMessage, setSuccessMessage] = useQueryState("successMessage", {
    defaultValue: initialWaitList.successMessage || "Success! You're on the waitlist",
  });
  const [sendEmailsToSubscribers, setSendEmailsToSubscribers] = useQueryState(
    "sendEmailsToSubscribers",
    {
      defaultValue: initialWaitList.sendEmailsToSubscribers !== false,
      parse: (v) => v === "true",
      serialize: (v) => String(v),
    },
  );
  const [showLogo, setShowLogo] = useQueryState("showLogo", {
    defaultValue: initialWaitList.showLogo !== false,
    parse: (v) => v === "true",
    serialize: (v) => String(v),
  });
  const [showSocialProof, setShowSocialProof] = useQueryState("showSocialProof", {
    defaultValue: initialWaitList.showSocialProof !== false,
    parse: (v) => v === "true",
    serialize: (v) => String(v),
  });
  const [showBadge, setShowBadge] = useQueryState("showBadge", {
    defaultValue: initialWaitList.showBadge !== false,
    parse: (v) => v === "true",
    serialize: (v) => String(v),
  });
  const [showBranding, setShowBranding] = useQueryState("showBranding", {
    defaultValue: initialWaitList.showBranding !== false,
    parse: (v) => v === "true",
    serialize: (v) => String(v),
  });
  const [showReferrals, setShowReferrals] = useQueryState("showReferrals", {
    defaultValue: initialWaitList.showReferrals !== false,
    parse: (v) => v === "true",
    serialize: (v) => String(v),
  });
  const [badgeText, setBadgeText] = useQueryState("badgeText", {
    defaultValue: initialWaitList.badgeText || "Sign Up and get 50% off on launch",
  });
  const [badgeColor, setBadgeColor] = useQueryState("badgeColor", {
    defaultValue: initialWaitList.badgeColor || "#FF9D7A",
  });
  const [badgeTextColor, setBadgeTextColor] = useQueryState("badgeTextColor", {
    defaultValue: initialWaitList.badgeTextColor || "#FFFFFF",
  });
  const [inputColor, setInputColor] = useQueryState("inputColor", {
    defaultValue: initialWaitList.inputColor || "#FFFFFF",
  });
  const [inputBorder, setInputBorder] = useQueryState("inputBorder", {
    defaultValue: initialWaitList.inputBorder || "#E5E7EB",
  });
  const [inputTextColor, setInputTextColor] = useQueryState("inputTextColor", {
    defaultValue: initialWaitList.inputTextColor || "#000000",
  });
  const [placeholderText, setPlaceholderText] = useQueryState("placeholderText", {
    defaultValue: initialWaitList.placeholderText || "Enter your email",
  });

  const formSettings = {
    name,
    description,
    publicSlug,
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
        name: setName,
        description: setDescription,
        publicSlug: setPublicSlug,
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

  const saveNow = async () => {
    setIsSaving(true);
    try {
      const response = await saveWaitList(initialWaitList.id, { ...formSettings });
      if (!response.success) {
        toast.error(response.message || "Could not save your page. Try again.");
        return false;
      }
      const typedSlug = formSettings.publicSlug.trim();
      if (typedSlug) setSavedSlug(typedSlug);
      toast.success(response.message);
      return true;
    } catch {
      toast.error("Could not save your page. Try again.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    await saveNow();
  };

  const copyShareUrlToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/w/${savedSlug}`);
      toast.success("Page link copied.");
    } catch {
      toast.error("Copy is unavailable. Select the link and copy it manually.");
    }
  };

  const handleDeleteLogo = async () => {
    const logoKey = formSettings.logoKey;
    if (!logoKey) {
      toast.error("This logo cannot be removed. Upload a replacement instead.");
      return;
    }

    try {
      const response = await removeImage(logoKey, initialWaitList.id);
      if (response.success) {
        toast.success("Logo deleted successfully.");
        updateSetting("logoUrl", "");
        updateSetting("logoKey", "");
      } else {
        toast.error(response.message || "Could not remove the logo. Try again.");
      }
    } catch (error) {
      console.error("Error deleting logo:", error);
      toast.error("Could not remove the logo. Try again.");
    }
  };

  const handlePublishToggle = async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    try {
      // Publish the saved page, never unsaved field values.
      if (!(await saveNow())) return;
      const action = status === "PUBLISHED" ? pauseLegacyWaitlist : publishLegacyWaitlist;
      const response = await action(initialWaitList.id);
      if (response.ok) {
        setStatus(response.paused ? "PAUSED" : "PUBLISHED");
        toast.success(response.paused ? "Signups paused." : "Your page is live.");
      } else toast.error(response.message || "Could not update publication. Try again.");
    } catch {
      toast.error("Could not update publication. Try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  const onImageUploadSuccess = (files) => {
    updateSetting("logoUrl", files[0].url);
    updateSetting("logoKey", files[0].key);
  };

  return (
    <div className={styles.editor}>
      <div>
        <header className={styles.header}>
          <div>
            <h2>Builder</h2>
            <p>
              {name || "Untitled waitlist"} ·{" "}
              {status === "PUBLISHED" ? "Live" : status === "PAUSED" ? "Paused" : "Private draft"}
            </p>
          </div>
          <div className={styles.toolbar}>
            <TooltipProvider delay={100}>
              <div className={styles.toolbarActions}>
                {!initialWaitList.templateSnapshot && (
                  <Button disabled={isPublishing || isSaving} onClick={handlePublishToggle}>
                    {isPublishing ? "Working…" : status === "PUBLISHED" ? "Pause" : "Publish"}
                  </Button>
                )}
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button disabled={isSaving} onClick={handleSave}>
                        <HugeiconsIcon
                          icon={FloppyDiskIcon}
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                        {isSaving ? "Saving…" : "Save changes"}
                      </Button>
                    }
                  />
                  <TooltipContent side="bottom">Save changes</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Link
                        prefetch={false}
                        className={styles.secondaryLink}
                        href={`/waitlists/${initialWaitList.id}/emails`}
                      >
                        <HugeiconsIcon icon={Mail01Icon} className="h-4 w-4" aria-hidden="true" />
                        <span>Email templates</span>
                      </Link>
                    }
                  />
                  <TooltipContent side="bottom">Email templates</TooltipContent>
                </Tooltip>

                <EmbedModal waitList={initialWaitList} origin={origin} />

                <Dialog>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <DialogTrigger
                          render={
                            <Button variant="ghost" size="icon" aria-label="Share waitlist">
                              <HugeiconsIcon icon={Share01Icon} className="h-4 w-4" />
                            </Button>
                          }
                        />
                      }
                    />
                    <TooltipContent side="bottom">Share link</TooltipContent>
                  </Tooltip>

                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Share link</DialogTitle>
                      <DialogDescription>
                        Copy the link below to share your waitlist page.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2">
                      <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">
                          Link
                        </Label>
                        <Input
                          id="link"
                          value={origin && savedSlug ? `${origin}/w/${savedSlug}` : ""}
                          readOnly
                        />
                      </div>
                      <Button
                        onClick={copyShareUrlToClipboard}
                        type="submit"
                        size="sm"
                        className="px-3"
                        variant="ghost"
                      >
                        <span className="sr-only">Copy</span>
                        <CopyIcon />
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </TooltipProvider>
          </div>
        </header>

        <ConfirmDialog
          open={logoConfirmOpen}
          onOpenChange={setLogoConfirmOpen}
          title="Remove this logo?"
          description="The uploaded image will be deleted. You can upload a new one afterwards."
          confirmLabel="Remove logo"
          pendingLabel="Removing…"
          onConfirm={handleDeleteLogo}
        />
        <div className={styles.grid}>
          <section className={styles.previewColumn} aria-labelledby="legacy-preview-heading">
            <div className={styles.previewHeading}>
              <h3 id="legacy-preview-heading">Preview</h3>
              <p>No subscriber is created here.</p>
            </div>
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
                  mainBgColor: formSettings.enableMainBgColor ? formSettings.mainBgColor : null,
                  bgColor: formSettings.enableBgColor ? formSettings.bgColor : null,
                }}
                onDeleteLogo={() => {
                  if (formSettings.logoKey) {
                    setLogoConfirmOpen(true);
                  } else {
                    toast.error("This logo cannot be removed. Upload a replacement instead.");
                  }
                }}
                onSubmit={(event) => {
                  event.preventDefault();
                  toast("Preview only. No subscriber was created.");
                }}
                onImageUploadSuccess={onImageUploadSuccess}
              />
            </div>
          </section>
          <SettingsTab
            formSettings={formSettings}
            updateSetting={updateSetting}
            applyPreset={applyPreset}
          />
        </div>
      </div>
    </div>
  );
};
