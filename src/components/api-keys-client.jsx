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
    const [isLoading, setIsLoading] = useState(true);
    const [isWaitlistsLoading, setIsWaitlistsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [keyToDelete, setKeyToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKey, setNewKey] = useState(null);
    const [selectedWaitlistId, setSelectedWaitlistId] = useState('');
    const [expiresInDays, setExpiresInDays] = useState('90');
    const [formError, setFormError] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchApiKeys();
        fetchWaitlists();
    }, []);

    const fetchApiKeys = async () => {
        try {
            const res = await fetch('/api/v1/api-keys');
            const json = await res.json();
            if (!res.ok) throw new Error(json.error?.message || 'Could not load API keys. Try again.');
            setApiKeys(json.data);
        } catch (err) {
            setLoadError(err.message || 'Could not load API keys. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWaitlists = async () => {
        try {
            const res = await fetch('/api/v1/waitlists');
            const json = await res.json();
            if (!res.ok) throw new Error(json.error?.message || 'Could not load waitlists. Try again.');
            setWaitlists(json.data || []);
        } catch (err) {
            setLoadError(err.message || 'Could not load waitlists. Try again.');
        } finally {
            setIsWaitlistsLoading(false);
        }
    };

    const handleCreateAndLinkKey = async () => {
        const name = newKeyName.trim();
        if (name.length < 3 || name.length > 64) {
            setFormError('Enter a key name between 3 and 64 characters.');
            return;
        }
        if (!selectedWaitlistId) {
            setFormError('Select a waitlist before creating a key.');
            return;
        }
        setFormError('');

        try {
            setIsCreating(true);

            const res = await fetch('/api/v1/api-keys/create-and-link', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    waitlistId: selectedWaitlistId,
                    expiresInDays: expiresInDays === 'never' ? null : Number(expiresInDays),
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const json = await res.json();

            if (res.ok) {
                setApiKeys((prev) => [...prev, json.data.apiKey]);
                setNewKey(json.data.apiKey);
                setNewKeyName('');
                setSelectedWaitlistId('');
                toast.success('API key created');
            } else {
                setFormError(json.error?.message || 'Unable to create key. Try again.');
            }
        } catch (err) {
            console.error('Error creating and linking key:', err);
            setFormError('Unable to create key. Check your connection and try again.');
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
                toast.success('API key revoked');
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
                        <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apps using <span className="font-medium">{keyToDelete?.name}</span> will lose access immediately. You can create a replacement key at any time.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? 'Revoking…' : 'Revoke key'}
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
                            setExpiresInDays('90');
                            setFormError('');
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
                                        ? "Choose a waitlist and expiry. The key only grants signup-write access to that waitlist."
                                        : "Copy this key now. Its secret cannot be viewed again after closing this dialog."
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
                                                aria-label="Copy API key"
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
                                            <label className="text-sm font-medium" htmlFor="api-key-name">API key name</label>
                                            <Input
                                                id="api-key-name"
                                                aria-invalid={Boolean(formError && (newKeyName.trim().length < 3 || newKeyName.trim().length > 64))}
                                                maxLength={64}
                                                placeholder="Enter name"
                                                value={newKeyName}
                                                onChange={(e) => { setNewKeyName(e.target.value); setFormError(''); }}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium" htmlFor="api-key-waitlist">Waitlist</label>
                                            <Select value={selectedWaitlistId} onValueChange={(value) => { setSelectedWaitlistId(value); setFormError(''); }}>
                                                <SelectTrigger id="api-key-waitlist" disabled={isWaitlistsLoading}>
                                                    <SelectValue placeholder={isWaitlistsLoading ? "Loading waitlists…" : "Select a waitlist"} />
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
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium" htmlFor="api-key-expiry">Expires</label>
                                            <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                                                <SelectTrigger id="api-key-expiry" aria-label="API key expiry">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="30">In 30 days</SelectItem>
                                                    <SelectItem value="90">In 90 days</SelectItem>
                                                    <SelectItem value="365">In 1 year</SelectItem>
                                                    <SelectItem value="never">Never</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">Scope is limited to creating signups for the selected waitlist.</p>
                                        </div>
                                    </div>
                                    {formError ? <p role="alert" className="text-sm text-destructive">{formError}</p> : null}
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            onClick={handleCreateAndLinkKey}
                                            disabled={isCreating}
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
                            This key creates signups for its linked waitlist. Its secret is shown once and can be revoked at any time.
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

            {loadError ? <p role="alert" className="text-sm text-destructive">{loadError}</p> : null}
            <div className="product-table-wrap">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                                <TableHead>Linked Waitlist</TableHead>
                                <TableHead>Access</TableHead>
                                <TableHead>Last used</TableHead>
                                <TableHead className="w-16">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Loading API keys…</TableCell></TableRow>
                    ) : apiKeys.length > 0 ? (
                        apiKeys.map((key) => (
                            <TableRow key={key.id}>
                                <TableCell className="font-medium">{key.name}</TableCell>
                                <TableCell>
                                    {key.waitlist?.name ? (
                                        <span className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full">
                                            {key.waitlist.name}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">Legacy · account-wide</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    <span>{key.keyId ? 'Signup write' : 'Legacy owner access'}</span>
                                    <span className="block">{key.expiresAt ? `Expires ${new Date(key.expiresAt).toLocaleDateString()}` : 'No expiry'}</span>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-600 hover:bg-red-50"
                                        aria-label={`Revoke ${key.name}`}
                                        onClick={() => handleDeleteClick(key)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                No API keys found. Create one to start using the API.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            </div>
        </div >
    );
};
