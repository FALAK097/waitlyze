"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { Delete2Icon, SquarePenIcon, CopyIcon } from "../shared/icons";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export const WaitListCard = ({ id, name, url, logoUrl, description, deleteWaitList }) => {
  const { push, refresh } = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleRedirect = () => {
    push(url);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const response = await deleteWaitList(id);
    if (response.success) {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      toast.success(response.message);
      setTimeout(() => {
        refresh();
      }, 1000);
    } else {
      setIsDeleting(false);
      toast.error("There was an error deleting the wait list");
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success("ID copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy ID");
    }
  };

  return (
    <>
      <Card className="group relative w-full transition-all hover:shadow-lg">
        <Button
          onClick={handleCopyId}
          className="absolute top-3 right-3 z-10 rounded-sm p-1 transition-colors duration-200 hover:bg-muted"
          title="Copy ID"
          variant="ghost"
        >
          <CopyIcon />
        </Button>
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            <div className="relative size-16 overflow-hidden rounded-lg bg-muted">
              {logoUrl && !imageError ? (
                <Image
                  src={logoUrl}
                  alt={`${name} logo`}
                  fill
                  sizes="64px"
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <span className="text-2xl font-bold">
                    {name?.charAt(0)?.toUpperCase() || "W"}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 truncate">{name}</div>
          </CardTitle>
          <CardDescription className="line-clamp-2 min-h-10">
            {description ?? "No description provided"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-px w-full bg-linear-to-r from-transparent via-muted to-transparent" />
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-2">
          <Button onClick={handleRedirect} variant="secondary" className="w-full gap-2">
            <SquarePenIcon className="size-4" />
            Edit
          </Button>
          <Button
            disabled={isDeleting}
            onClick={() => setIsDeleteDialogOpen(true)}
            variant="destructive"
            className="w-full gap-2"
          >
            <Delete2Icon className="size-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-xl sm:max-w-[425px]">
          <DialogHeader className="space-y-2">
            <DialogTitle>Delete WaitList</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <b>{name}</b>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
