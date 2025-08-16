"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { EmailForm } from "@/components/email/email-form";
import { Send } from "lucide-react";
import { upsertEmailTemplate, sendTestEmail } from "@/app/actions/emails";
import { useQueryState } from "nuqs";

export function EmailTemplatesManager({ waitListId, waitListName, initialTemplates }) {
  const [current, setCurrent] = useQueryState("emailTab", {
    defaultValue: "signup",
    parse: (v) => (v === "offboarding" ? "offboarding" : "signup"),
    serialize: (v) => v,
  });
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const form = useForm({
    defaultValues: {
      signup: initialTemplates.signup,
      offboarding: initialTemplates.offboarding,
    },
  });

  // Keep preview reactive
  const watchAll = form.watch();

  const tpl = form.getValues(current);

  const replaceVarsPreview = (text) =>
    (text || "").replace(/\{\{waitlist\}\}/g, waitListName || "Project");

  const handleSave = async () => {
    const values = form.getValues(current);
    const res = await upsertEmailTemplate({
      waitListId,
      templateType: current,
      data: values,
    });
    if (res.success) {
      toast.success("Template saved");
    } else {
      toast.error(res.message || "Failed to save");
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) return;
    setSending(true);
    const res = await sendTestEmail({
      waitListId,
      templateType: current,
      to: testEmail,
    });
    setSending(false);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message || "Failed to send email");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div className="pr-4 border-r">
        <FormProvider {...form}>
          <Tabs value={current} onValueChange={setCurrent}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signup">Sign Ups</TabsTrigger>
              <TabsTrigger value="offboarding">Offboarding</TabsTrigger>
            </TabsList>

            <TabsContent value="signup">
              <EmailForm type="signup" form={form} />
            </TabsContent>
            <TabsContent value="offboarding">
              <EmailForm type="offboarding" form={form} />
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-4">
            <Button type="button" onClick={handleSave}>
              Save Template
            </Button>
          </div>
        </FormProvider>
      </div>

      <div className="pl-4">
        <div className="max-w-2xl p-4 mx-auto rounded-md bg-muted">
          <div className="flex justify-center mb-8">
            <div className="text-2xl font-bold text-primary">Waitlyze</div>
          </div>
          <div className="text-base">{replaceVarsPreview(tpl.subject)}</div>
          <div className="prose-sm prose">
            <h2>{replaceVarsPreview(tpl.header)}</h2>
            <h3 className="text-muted-foreground">
              {replaceVarsPreview(tpl.subHeader)}
            </h3>
            <div className="whitespace-pre-wrap">
              {replaceVarsPreview(tpl.mainBody)}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {replaceVarsPreview(tpl.subBody)}
            </p>
          </div>
          <footer className="mt-8 text-sm text-center text-muted-foreground">
            <Separator className="mb-4" />
            <p>
              Need help? Reply to this email • {new Date().getFullYear()} Waitlyze
            </p>
          </footer>
        </div>

        <div className="flex items-end gap-2 mt-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="testEmail">Send test email to</Label>
            <Input
              id="testEmail"
              type="email"
              placeholder="you@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          <Button
            disabled={!testEmail || sending}
            onClick={handleSendTest}
            type="button"
          >
            {sending ? "Sending..." : "Send Test"}
            <Send className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
