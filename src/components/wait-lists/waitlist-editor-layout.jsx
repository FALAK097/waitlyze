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
import { Save, ShareIcon, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { CopyIcon } from "../shared/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { EmbedModal } from "./embed-modal";
import { SettingsTab } from "./settings-tab";
import { SignUpForm } from "./sign-up-form";
import Link from "next/link";

export const WaitlistEditorLayout = ({
  initialWaitList,
  saveWaitList,
  isSaving,
  setIsSaving,
  testEmail,
  setTestEmail,
  isTestEmailLoading,
  setIsTestEmailLoading,
  formSettings,
  updateSetting,
  applyPreset,
}) => {
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
        updateSetting("logoUrl", "");
        updateSetting("logoKey", "");
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

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        <div className="flex items-center justify-end mb-6">
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

              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Link href={`/wait-lists/${initialWaitList.id}/emails`} target="_blank">
                    <Button size="icon">
                      <Mail className="w-4 h-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Email Templates
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
            className="flex items-center justify-center flex-1"
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
      </div>
    </div>
  );
};
