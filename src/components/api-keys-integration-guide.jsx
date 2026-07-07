'use client';

import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { ClipboardCheck, ClipboardCopy, BookOpen } from 'lucide-react';

const codeExample = `await fetch("https://waitlyze.falakgala.dev/api/waitlist", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    apiKey: "your_api_key_here",
    waitlistId: "your_waitlist_id_here", // copy from the created waitlist
    email: "user@example.com",
  }),
});`;

const responseExample = `{
  "success": true,
  "message": "Successfully joined the waitlist!",
  "data": {
    "rank": 9,
  }
}`;

export const ApiKeysIntegrationGuide = ({ copied, onCopy }) => {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Integration Guide
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[600px] sm:w-[700px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Waitlist API Integration Guide</SheetTitle>
                    <SheetDescription>
                        You can use the following example to integrate waitlist functionality into your application using our API.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    <div>
                        <h3 className="mb-3 text-lg font-semibold">Example</h3>
                        <div className="relative">
                            <pre className="p-3 overflow-x-auto text-xs rounded-lg bg-slate-900 text-slate-100">
                                <code>{codeExample}</code>
                            </pre>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute w-8 h-8 p-0 top-2 right-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                                onClick={() => onCopy(codeExample)}
                            >
                                {copied ? <ClipboardCheck className="w-3 h-3" /> : <ClipboardCopy className="w-3 h-3" />}
                            </Button>
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-3 text-lg font-semibold">Response Example</h3>
                        <div className="relative">
                            <pre className="p-3 overflow-x-auto text-xs rounded-lg bg-slate-900 text-slate-100">
                                <code>{responseExample}</code>
                            </pre>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute w-8 h-8 p-0 top-2 right-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                                onClick={() => onCopy(responseExample)}
                            >
                                {copied ? <ClipboardCheck className="w-3 h-3" /> : <ClipboardCopy className="w-3 h-3" />}
                            </Button>
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-3 text-lg font-semibold">Error Responses</h3>
                        <div className="space-y-2 text-sm">
                            <div className="p-2 border border-red-200 rounded bg-red-50">
                                <span className="font-medium">400:</span> Missing required parameters
                            </div>
                            <div className="p-2 border border-red-200 rounded bg-red-50">
                                <span className="font-medium">401:</span> Invalid API key or waitlist ID
                            </div>
                            <div className="p-2 border border-yellow-200 rounded bg-yellow-50">
                                <span className="font-medium">409:</span> Email already registered
                            </div>
                            <div className="p-2 border border-red-200 rounded bg-red-50">
                                <span className="font-medium">500:</span> Internal server error
                            </div>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
