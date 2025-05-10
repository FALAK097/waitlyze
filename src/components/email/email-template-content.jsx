"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { EmailForm } from "./email-form";

export const EmailTemplateContent = ({ waitList, updateEmailTemplate }) => {
  const [isTestEmailLoading, setIsTestEmailLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("signup");

  const selectedTemplateRef = useRef(selectedTemplate);

  useEffect(() => {
    selectedTemplateRef.current = selectedTemplate;
  }, [selectedTemplate]);

  const form = useForm({
    defaultValues: {
      signup: waitList.emailTemplates?.signup || {
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
        subject: "You're off the {{waitlist}} Waitlist!",
        previewText: "Congratulations! Time for the next step.",
        header: "Next Steps",
        subHeader: "{{waitlist}} is now open!",
        mainBody:
          "We're excited to announce that {{waitlist}} is now open for everyone. We've got some exciting news to share with you.",
        subBody: "We'll see you on the other side!",
      },
    },
  });

  const replaceTemplateVariables = (text) => {
    const replacements = {
      "{{waitlist}}": waitList.name,
      "{{verification_link}}": "https://example.com/verify",
      "{{position}}": "42",
      "{{referral_link}}": "https://example.com/ref/123",
      "{{referral_count}}": "5",
      "{{rewards}}": "Early Access",
      "{{expiry_time}}": "24 hours",
      "{{reason}}": "No longer interested",
      "{{feedback_link}}": "https://example.com/feedback",
    };

    return text.replace(
      /\{\{[^}]+\}\}/g,
      (match) => replacements[match] || match
    );
  };

  const getCurrentTemplatePreview = () => {
    const templateData = form.getValues(selectedTemplate);
    return {
      subject: replaceTemplateVariables(templateData.subject),
      previewText: replaceTemplateVariables(templateData.previewText),
      header: replaceTemplateVariables(templateData.header),
      subHeader: replaceTemplateVariables(templateData.subHeader),
      mainBody: replaceTemplateVariables(templateData.mainBody),
      subBody: replaceTemplateVariables(templateData.subBody),
    };
  };

  const [preview, setPreview] = useState(getCurrentTemplatePreview());

  const updatePreview = () => {
    setPreview(getCurrentTemplatePreview());
  };

  useEffect(() => {
    updatePreview();
  }, [selectedTemplate]);

  useEffect(() => {
    const subscription = form.watch(() => {
      updatePreview();
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSaveTemplate = async () => {
    try {
      await updateEmailTemplate({
        type: selectedTemplate,
        ...form.getValues(selectedTemplate),
      });
      toast.success("Email template saved successfully");
    } catch (error) {
      toast.error("Failed to save email template");
    }
  };

  const handleSendTestEmail = async () => {
    setIsTestEmailLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Test email sent successfully");
    } catch (error) {
      toast.error("Failed to send test email");
    } finally {
      setIsTestEmailLoading(false);
    }
  };

  const variables = [
    {
      key: "position",
      value: "22",
    },
    {
      key: "total_signups",
      value: "2",
    },
    {
      key: "referral_count",
      value: "5",
    },
    {
      key: "expiry_time",
      value: "24 hours",
    },
    {
      key: "referral_link",
      value:
        "https://hypeitup.me/forms/cm4e8vmhr0000ye5h1jnnx8ju?r=wzH3ZcFx7dBUXahiHQGFb",
    },
    {
      key: "waitlist",
      value: "Sick",
    },
    {
      key: "waitlist_url",
      value: "http://hypeitup.me/forms/cm4e8vmhr0000ye5h1jnnx8ju",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div className="pr-4 border-r">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Edit Templates</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="w-4 h-4 text-muted-foreground mt-[2px]" />
              </TooltipTrigger>
              <TooltipContent className="p-4 w-80 bg-background">
                <div className="space-y-2">
                  <h3 className="font-medium text-primary">
                    Variables you can use in Email Templates:
                  </h3>
                  <div className="space-y-2 text-sm">
                    {variables.map((variable) => (
                      <div key={variable.key} className="break-all">
                        <span className="text-primary">{`{{${variable.key}}}`}</span>
                        <span className="text-muted-foreground">
                          : {variable.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSaveTemplate)}>
            <Tabs
              defaultValue="signup"
              value={selectedTemplate}
              onValueChange={(value) => {
                setSelectedTemplate(value);
              }}
              className="mt-4"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="referral">Referral</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="offboarding">Offboarding</TabsTrigger>
              </TabsList>

              <div className="mt-4">
                <TabsContent value="signup">
                  <EmailForm type="signup" form={form} />
                </TabsContent>
                <TabsContent value="referral">
                  <EmailForm type="referral" form={form} />
                </TabsContent>
                <TabsContent value="verification">
                  <EmailForm type="verification" form={form} />
                </TabsContent>
                <TabsContent value="offboarding">
                  <EmailForm type="offboarding" form={form} />
                </TabsContent>
              </div>
            </Tabs>

            <div className="mt-4">
              <Button type="submit">Save All Templates</Button>
            </div>
          </form>
        </FormProvider>
      </div>

      <div className="pl-4">
        <div className="max-w-2xl p-4 mx-auto rounded-md bg-muted">
          <div className="flex justify-center mb-8">
            <div className="text-2xl font-bold text-primary">HypeItUp</div>
          </div>
          <div className="text-base">{preview.subject}</div>
          <div className="prose-sm prose">
            <h2>{preview.header}</h2>
            <h3 className="text-muted-foreground">{preview.subHeader}</h3>
            <div className="whitespace-pre-wrap">{preview.mainBody}</div>
            <p className="mt-4 text-sm text-muted-foreground">
              {preview.subBody}
            </p>
          </div>

          <footer className="mt-8 text-sm text-center text-muted-foreground">
            <Separator className="mb-4" />
            <p>
              Need help? Contact us at{" "}
              <a
                className="underline text-primary"
                href="mailto:info@hypeitup.me"
              >
                info@hypeitup.me
              </a>
            </p>
            <p className="mt-2">Mumbai, India</p>
            <Button variant="link" className="mt-4">
              Unsubscribe
            </Button>
          </footer>
        </div>

        <div className="flex items-end gap-2 mt-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="testEmail">Send test email to</Label>
            <Input
              id="testEmail"
              type="email"
              placeholder="info@hypeitup.me"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSendTestEmail}
            disabled={isTestEmailLoading || !testEmail}
          >
            {isTestEmailLoading ? (
              "Sending..."
            ) : (
              <>
                Send Test <Send className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
