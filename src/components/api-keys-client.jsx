'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Plus, Trash2, ClipboardCheck, ClipboardCopy, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export const ApiKeysClient = () => {
    const [apiKeys, setApiKeys] = useState([]);
    const [waitlists, setWaitlists] = useState([]);
    const [keyToDelete, setKeyToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKey, setNewKey] = useState(null);
    const [selectedWaitlistId, setSelectedWaitlistId] = useState('');
    const [isLinkingWaitlist, setIsLinkingWaitlist] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchApiKeys();
        fetchWaitlists();
    }, []);

    const fetchApiKeys = async () => {
        try {
            const res = await fetch('/api/v1/api-keys');
            const json = await res.json();
            if (res.ok) setApiKeys(json.data);
        } catch (err) {
            console.error('Failed to fetch API keys', err);
        }
    };

    const fetchWaitlists = async () => {
        try {
            const res = await fetch('/api/v1/waitlists');
            const json = await res.json();
            if (res.ok) setWaitlists(json.data || []);
        } catch (err) {
            console.error('Failed to fetch waitlists', err);
        }
    };

    const handleCreateAndLinkKey = async () => {
        if (newKeyName.trim().length < 3 || !selectedWaitlistId) return;

        try {
            setIsCreating(true);

            const res = await fetch('/api/v1/api-keys/create-and-link', {
                method: 'POST',
                body: JSON.stringify({
                    name: newKeyName.trim(),
                    waitlistId: selectedWaitlistId
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const json = await res.json();

            if (res.ok) {
                setApiKeys((prev) => [...prev, json.data.apiKey]);
                setNewKey(json.data.apiKey);
                setNewKeyName('');
                setSelectedWaitlistId('');
                toast.success('API key created and linked successfully');
            } else {
                toast.error(json.error?.message || 'Failed to create and link key');
            }
        } catch (err) {
            console.error('Error creating and linking key:', err);
            toast.error('Failed to create and link key');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteClick = (key) => {
        setKeyToDelete(key);
    };

    const handleConfirmDelete = async () => {
        if (!keyToDelete) return;

        try {
            setIsDeleting(true);
            const res = await fetch(`/api/v1/api-keys/${keyToDelete.id}`, { method: 'DELETE' });

            if (res.status === 204) {
                setApiKeys((prev) => prev.filter((k) => k.id !== keyToDelete.id));
                setKeyToDelete(null);
                toast.success('API key deleted successfully');
            } else {
                const json = await res.json();
                toast.error(json.error?.message || 'Failed to delete');
            }
        } catch (error) {
            console.error('Failed to delete API key:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
            toast.success('Copied to clipboard');
        } catch (err) {
            console.error('Copy failed:', err);
            toast.error('Copy failed');
        }
    };

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

    return (
        <div className="space-y-4">
            <AlertDialog open={!!keyToDelete} onOpenChange={(open) => !open && setKeyToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the API key <span className="font-medium">{keyToDelete?.name}</span>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Sheet>
                <div className="flex justify-end gap-2">
                    <SheetTrigger asChild>
                        <Button variant="outline">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Integration Guide
                        </Button>
                    </SheetTrigger>
                    <Dialog open={createDialogOpen} onOpenChange={(open) => {
                        setCreateDialogOpen(open);
                        if (!open) {
                            setNewKey(null);
                            setNewKeyName('');
                            setSelectedWaitlistId('');
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create API Key
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create API Key</DialogTitle>
                                <DialogDescription>
                                    {!newKey
                                        ? "Enter a name for your API key and select which waitlist it should be linked to."
                                        : "Your API key has been created and linked successfully. Copy it now as you won't be able to see it again."
                                    }
                                </DialogDescription>
                            </DialogHeader>

                            {newKey ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium">API Key:</div>
                                        <div className="flex items-center justify-between px-3 py-2 font-mono text-sm rounded bg-muted">
                                            <span className='truncate'>{newKey.apiKey}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => copyToClipboard(newKey.apiKey)}
                                                className="ml-2"
                                            >
                                                {copied ? <ClipboardCheck className="w-4 h-4 text-green-600" /> : <ClipboardCopy className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Copy this key now. You won't be able to see it again.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-sm font-medium">Linked to:</div>
                                        <div className="px-3 py-2 text-sm rounded bg-muted">
                                            {newKey.waitlist?.name}
                                        </div>
                                    </div>

                                    <DialogClose asChild>
                                        <Button className="w-full">Done</Button>
                                    </DialogClose>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">API Key Name</label>
                                            <Input
                                                placeholder="Enter name"
                                                value={newKeyName}
                                                onChange={(e) => setNewKeyName(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Link to Waitlist</label>
                                            <Select value={selectedWaitlistId} onValueChange={setSelectedWaitlistId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a waitlist" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {waitlists
                                                        .filter(waitlist => !apiKeys.some(key => key.waitlist?.id === waitlist.id))
                                                        .map((waitlist) => (
                                                            <SelectItem key={waitlist.id} value={waitlist.id}>
                                                                {waitlist.name}
                                                            </SelectItem>
                                                        ))
                                                    }
                                                </SelectContent>
                                            </Select>
                                            {waitlists.filter(waitlist => !apiKeys.some(key => key.waitlist?.id === waitlist.id)).length === 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    All waitlists are already linked to API keys.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={handleCreateAndLinkKey}
                                            disabled={isCreating || newKeyName.length < 3 || !selectedWaitlistId || apiKeys.length >= 3 || waitlists.filter(waitlist => !apiKeys.some(key => key.waitlist?.id === waitlist.id)).length === 0}
                                        >
                                            {isCreating ? 'Creating...' : 'Create & Link API Key'}
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>

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
                                    onClick={() => copyToClipboard(codeExample)}
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
                                    onClick={() => copyToClipboard(responseExample)}
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

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Linked Waitlist</TableHead>
                        <TableHead className="w-16">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {apiKeys.length > 0 ? (
                        apiKeys.map((key) => (
                            <TableRow key={key.id}>
                                <TableCell className="font-medium">{key.name}</TableCell>
                                <TableCell>
                                    <code className="px-2 py-1 text-sm rounded bg-muted">
                                        {key.key?.replace(/.(?=.{4})/g, '•') || '••••••••••••••••'}
                                    </code>
                                </TableCell>
                                <TableCell>
                                    {key.waitlist?.name ? (
                                        <span className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full">
                                            {key.waitlist.name}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">Not linked</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-600 hover:bg-red-50"
                                        onClick={() => handleDeleteClick(key)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                                No API keys found. Create one to start using the API.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div >
    );
};
