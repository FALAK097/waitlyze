'use client';

import { useMemo, useState, useEffect } from 'react';
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
import { Plus, Trash2, ClipboardCheck, ClipboardCopy } from 'lucide-react';
import { ApiKeysIntegrationGuide } from '@/components/api-keys-integration-guide';
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
    const [copied, setCopied] = useState(false);
    const unlinkedWaitlists = useMemo(() =>
      waitlists.filter(waitlist => !apiKeys.some(key => key.waitlist?.id === waitlist.id)),
    [waitlists, apiKeys]);

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

            <div className="flex justify-end gap-2">
                    <ApiKeysIntegrationGuide
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
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
                                            <label htmlFor="api-key-name" className="text-sm font-medium">API Key Name</label>
                                            <Input
                                                id="api-key-name"
                                                placeholder="Enter name"
                                                value={newKeyName}
                                                onChange={(e) => setNewKeyName(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="link-to-waitlist" className="text-sm font-medium">Link to Waitlist</label>
                                            <Select value={selectedWaitlistId} onValueChange={setSelectedWaitlistId}>
                                                <SelectTrigger id="link-to-waitlist">
                                                    <SelectValue placeholder="Select a waitlist" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {unlinkedWaitlists
                                                        .map((waitlist) => (
                                                            <SelectItem key={waitlist.id} value={waitlist.id}>
                                                                {waitlist.name}
                                                            </SelectItem>
                                                        ))
                                                    }
                                                </SelectContent>
                                            </Select>
                                            {unlinkedWaitlists.length === 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    All waitlists are already linked to API keys.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={handleCreateAndLinkKey}
                                            disabled={isCreating || newKeyName.length < 3 || !selectedWaitlistId || apiKeys.length >= 3 || unlinkedWaitlists.length === 0}
                                        >
                                            {isCreating ? 'Creating...' : 'Create & Link API Key'}
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>

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
