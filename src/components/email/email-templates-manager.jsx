"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { EmailForm } from "@/components/email/email-form";
import { Send } from "lucide-react";
import { upsertEmailTemplate, sendTestEmail } from "@/app/actions/emails";
import { useQueryState } from "nuqs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

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
  form.watch();

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

  const renderMarkdown = (content) => {
    const processedContent = replaceVarsPreview(content);
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {processedContent}
      </ReactMarkdown>
    );
  };

  return (
    <div className="space-y-8">
      <Tabs value={current} onValueChange={setCurrent} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-64 grid-cols-2">
            <TabsTrigger value="signup">Sign Ups</TabsTrigger>
            <TabsTrigger value="offboarding">Offboarding</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button type="button" onClick={handleSave} variant="default">
              Save Template
            </Button>

            <div className="flex items-end gap-2">
              <Input
                id="testEmail"
                type="email"
                placeholder="you@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-44"
              />
              <Button
                disabled={!testEmail || sending}
                onClick={handleSendTest}
                type="button"
                variant="outline"
              >
                {sending ? "Sending..." : "Test"}
                <Send className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 mt-6 lg:grid-cols-2">
          <FormProvider {...form}>
            <TabsContent value="signup" className="mt-0">
              <EmailForm type="signup" form={form} />
            </TabsContent>
            <TabsContent value="offboarding" className="mt-0">
              <EmailForm type="offboarding" form={form} />
            </TabsContent>
          </FormProvider>

          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="bg-white rounded-md">
                <div className="p-6 prose-sm prose max-w-none">
                  <div className="text-lg font-semibold">{renderMarkdown(tpl.header)}</div>
                  <div className="text-muted-foreground">
                    {renderMarkdown(tpl.subHeader)}
                  </div>
                  <div className="my-4">
                    {renderMarkdown(tpl.mainBody)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {renderMarkdown(tpl.subBody)}
                  </div>

                  <footer className="mt-8 text-sm text-center text-muted-foreground">
                    <Separator className="mb-4" />
                    <p>
                      Need help? Reply to this email • {new Date().getFullYear()} Waitlyze
                    </p>
                  </footer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
}
