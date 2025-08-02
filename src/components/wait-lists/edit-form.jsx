"use client";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeIcon, Save, ShareIcon } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { EmailTemplateContent } from "../email/email-template-content";
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

const EmbedModal = ({ waitList }) => {
  return (
    <Dialog>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button size="icon">
              <CodeIcon className="w-4 h-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Embed Wait List</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Instructions</DialogTitle>
          <DialogDescription>
            Follow the bellow instructions to embed the form on your website.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <p className="col-span-3 my-2 mb-4">
              {`Step 1. Copy and paste the below code in the <head> section`}
            </p>
            <CodeBlock
              language="html"
              code={`<!-- Waitlyze Widget JS -->\n<script src="${window.location.origin}/js/embed.js" defer></script>`}
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
            <Button onClick={() => { }}>Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const WaitlistGenerator = ({ initialWaitList, saveWaitList }) => {
  const [testEmail, setTestEmail] = useState("");
  const [isTestEmailLoading, setIsTestEmailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formSettings, setFormSettings] = useState(() => {
    return {
      buttonColor: initialWaitList.buttonColor || "#8B5CF6",
      buttonBorder: initialWaitList.buttonBorder || "#7C3AED",
      buttonTextColor: initialWaitList.buttonTextColor || "#FFFFFF",
      mainBgColor: initialWaitList.mainBgColor || "#FFFFFF",
      enableMainBgColor: initialWaitList.enableMainBgColor || false,
      bgColor: initialWaitList.bgColor || "#FFFFFF",
      enableBgColor: initialWaitList.enableBgColor || false,
      borderWidth: initialWaitList.borderWidth || "0px",
      borderRadius: initialWaitList.borderRadius || "large",
      fontWeight: initialWaitList.fontWeight || "normal",
      logoSize: initialWaitList.logoSize || "1X",
      buttonText: initialWaitList.buttonText || "Join waitlist",
      successMessage:
        initialWaitList.successMessage || "Success! You're on the waitlist",
      showLogo: initialWaitList.showLogo || true,
      showSocialProof: initialWaitList.showSocialProof || true,
      showBadge: initialWaitList.showBadge || true,
      showBranding: initialWaitList.showBranding || true,
      showReferrals: initialWaitList.showReferrals || true,
      badgeText:
        initialWaitList.badgeText || "Sign Up and get 50% off on launch",
      badgeColor: initialWaitList.badgeColor || "#8B5CF6",
      badgeTextColor: initialWaitList.badgeTextColor || "#FFFFFF",
      inputColor: initialWaitList.inputColor || "#FFFFFF",
      inputBorder: initialWaitList.inputBorder || "#E5E7EB",
      inputTextColor: initialWaitList.inputTextColor || "#000000",
      placeholderText: initialWaitList.placeholderText || "Enter your email",
      logoUrl: initialWaitList.logoUrl || "/images/logo.png",
      logoKey: initialWaitList.logoKey || "",
      shareOnTwitter: initialWaitList.shareOnTwitter || false,
      shareOnWhatsapp: initialWaitList.shareOnWhatsapp || false,
      shareOnInstagram: initialWaitList.shareOnInstagram || false,
      shareOnFacebook: initialWaitList.shareOnFacebook || false,
      shareOnLinkedin: initialWaitList.shareOnLinkedin || false,
      shareOnEmail: initialWaitList.shareOnEmail || false,
      shareOnReddit: initialWaitList.shareOnReddit || false,
      ogTitle: initialWaitList.ogTitle || "",
      ogDescription: initialWaitList.ogDescription || "",
      ogImage: initialWaitList.ogImage || "",
      emailTemplates: initialWaitList.emailTemplates || {
        signup: {
          subject: "Welcome to {{waitlist}}!",
          previewText: "Join our exclusive waitlist",
          header: "Welcome Aboard!",
          subHeader: "We're excited to have you",
          mainBody:
            "Thanks for joining {{waitlist}}.\nPlease verify your email to secure your spot.",
          subBody: "You're currently #{{position}} in line",
        },
        referral: {
          subject: "Share {{waitlist}} with friends",
          previewText: "Invite friends and move up the list",
          header: "Share & Earn",
          subHeader: "Invite your friends",
          mainBody: "Share your unique referral link to move up the waitlist.",
          subBody: "You've invited {{referral_count}} friends so far",
        },
        verification: {
          subject: "Verify your email for {{waitlist}}",
          previewText: "Quick verification needed",
          header: "One Last Step",
          subHeader: "Verify your email",
          mainBody: "Click the link below to verify your email address",
          subBody: "This link expires in {{expiry_time}}",
        },
        offboarding: {
          subject: "Sorry to see you go - {{waitlist}}",
          previewText: "Unsubscribe confirmation",
          header: "Farewell",
          subHeader: "You've been unsubscribed",
          mainBody: "You've been successfully removed from our waitlist",
          subBody: "We'd love to hear your feedback",
        },
      },
    };
  });

  const updateSetting = (key, value) => {
    setFormSettings((prev) => ({ ...prev, [key]: value }));
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
    setFormSettings((prev) => ({ ...prev, ...presets[preset] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const settingsToSave = {
      ...formSettings,
    };
    const response = await saveWaitList(initialWaitList.id, settingsToSave);
    setIsSaving(false);
    if (response.success) {
      toast.success(response.message);
    }
  };

  const copyShareUrlToClipboard = () => {
    const url = `${window.location.origin}/forms/${initialWaitList.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Copied to clipboard");
  };

  const handleDeleteLogo = async () => {
    const logoKey = formSettings.logoKey;
    if (!logoKey) {
      toast.error("No logo key found to delete.");
      return;
    }

    try {
      const response = await removeImage(logoKey, initialWaitList.id);
      console.log("response", response);
      if (response.success) {
        toast.success("Logo deleted successfully.");
        setFormSettings((prev) => ({ ...prev, logoUrl: "", logoKey: "" }));
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error deleting logo:", error);
      toast.error("An error occurred while deleting the logo.");
    }
  };

  const onImageUploadSuccess = (files) => {
    updateSetting("logoUrl", files[0].url);
    updateSetting("logoKey", files[0].key);
  };

  const updateEmailTemplate = async (emailSettings) => {
    try {
      const updatedSettings = {
        ...formSettings,
        emailTemplates: {
          ...formSettings.emailTemplates,
          [emailSettings.type]: {
            subject: emailSettings.subject,
            previewText: emailSettings.previewText,
            header: emailSettings.header,
            subHeader: emailSettings.subHeader,
            mainBody: emailSettings.mainBody,
            subBody: emailSettings.subBody,
          },
        },
      };
      setFormSettings(updatedSettings);
      await handleSave(updatedSettings);
    } catch (error) {
      console.error("Error updating email template:", error);
      toast.error("Failed to update email template");
    }
  };

  return (
    <div className="overflow-auto flex-1">
      <div className="p-8">
        <Tabs defaultValue="builder">
          <TabsList className="grid grid-cols-3 mb-8 w-full bg-transparent">
            <TabsTrigger
              value="builder"
              className="data-[state=active]:bg-transparent hover:underline hover:underline-offset-4 hover:text-inherit hover:decoration-primary"
            >
              Waitlist Builder
            </TabsTrigger>
            <TabsTrigger
              value="email"
              className="data-[state=active]:bg-transparent hover:underline hover:underline-offset-4 hover:text-inherit hover:decoration-primary"
            >
              Email
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-transparent hover:underline hover:underline-offset-4 hover:text-inherit hover:decoration-primary"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder">
            <div className="flex justify-end items-center mb-6">
              <TooltipProvider>
                <div className="flex space-x-2">
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      {isSaving ? (
                        <Button size="icon" disabled>
                          <Save className="w-4 h-4 animate-spin" />
                        </Button>
                      ) : (
                        <Button size="icon" onClick={handleSave}>
                          <Save className="w-4 h-4" />
                        </Button>
                      )}
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Save Wait List
                    </TooltipContent>
                  </Tooltip>

                  <EmbedModal waitList={initialWaitList} />

                  <Dialog>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button size="icon">
                            <ShareIcon className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Share Wait List
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
                            defaultValue={`${window.location.origin}/forms/${initialWaitList.id}`}
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
                      <DialogFooter className="sm:justify-start">
                        <DialogClose asChild>
                          <Button type="button" variant="secondary">
                            Close
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </TooltipProvider>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:gap-0">
              <div
                style={{
                  backgroundColor: formSettings.enableMainBgColor
                    ? formSettings.mainBgColor
                    : "transparent",
                }}
                className="flex flex-1 justify-center items-center"
              >
                <SignUpForm
                  email={testEmail}
                  isLoading={isTestEmailLoading}
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
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setIsTestEmailLoading(true);
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                    toast.success(formSettings.successMessage, {
                      position: "top-center",
                    });
                    setIsTestEmailLoading(false);
                  }}
                  onImageUploadSuccess={onImageUploadSuccess}
                />
              </div>

              <SettingsTab
                formSettings={formSettings}
                updateSetting={updateSetting}
                applyPreset={applyPreset}
              />
            </div>
          </TabsContent>

          <TabsContent value="email">
            <EmailTemplateContent
              waitList={{
                ...initialWaitList,
                emailTemplates: formSettings.emailTemplates || {},
              }}
              updateEmailTemplate={updateEmailTemplate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
