'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import toast from 'react-hot-toast';

export const ApiKeysClient = () => {
    const [apiKeys, setApiKeys] = useState([]);
    const [keyToDelete, setKeyToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKey, setNewKey] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchApiKeys();
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

    const handleCreateKey = async () => {
        if (newKeyName.trim().length < 3) return;

        try {
            setIsCreating(true);
            const res = await fetch('/api/v1/api-keys', {
                method: 'POST',
                body: JSON.stringify({ name: newKeyName }),
                headers: { 'Content-Type': 'application/json' },
            });
            const json = await res.json();

            if (res.ok) {
                setNewKey(json.data);
                setApiKeys((prev) => [...prev, json.data]);
                setNewKeyName('');
                toast.success('API key created successfully');
            } else {
                toast.error(json.error?.message || 'Failed to create key');
            }
        } catch (err) {
            console.error('Error creating key:', err);
            toast.error('Failed to create key');
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

            <Dialog open={createDialogOpen} onOpenChange={(open) => {
                setCreateDialogOpen(open);
                if (!open) {
                    setNewKey(null);
                    setNewKeyName('');
                }
            }}>
                <DialogTrigger asChild>
                    <div className="flex justify-end">
                        <Button>
                            <Plus className="mr-2 w-4 h-4" />
                            Create API Key
                        </Button>
                    </div>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create API Key</DialogTitle>
                        <DialogDescription>
                            Enter a name for your API key. You will only see this key once.
                        </DialogDescription>
                    </DialogHeader>

                    {newKey ? (
                        <div className="space-y-2">
                            <div className="text-sm font-medium">API Key:</div>
                            <div className="flex justify-between items-center px-3 py-2 font-mono text-sm rounded bg-muted">
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
                            <p className="text-xs text-muted-foreground">Copy this key now. You won’t be able to see it again.</p>
                            <DialogClose asChild>
                                <Button className="mt-4 w-full">Done</Button>
                            </DialogClose>
                        </div>
                    ) : (
                        <>
                            <Input
                                placeholder="Enter name"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                            />
                            <DialogFooter>
                                <Button
                                    onClick={handleCreateKey}
                                    disabled={isCreating || newKeyName.length < 3}
                                >
                                    {isCreating ? 'Creating...' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Key</TableHead>
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
                            <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                                No API keys found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div >
    );
};
