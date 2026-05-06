"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  SortDirection,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  EyeIcon,
  EyeOffIcon,
  PencilIcon,
  RocketIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

type PostListItem = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  updatedAt: string;
  publishedAt: string | null;
};

type PostStatus = "draft" | "hidden" | "published";
type StatusFilter = "all" | PostStatus;

type TablePost = PostListItem & {
  status: PostStatus;
};

type BloggerPostsTableProps = {
  posts: PostListItem[];
  publishAction: (formData: FormData) => Promise<void>;
  unpublishAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

function VisibilityActionButton({
  postId,
  postStatus,
  postTitle,
  publishAction,
  unpublishAction,
}: {
  postId: string;
  postStatus: PostStatus;
  postTitle: string;
  publishAction: (formData: FormData) => Promise<void>;
  unpublishAction: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const toggleLabel =
    postStatus === "published" ? "Hide" : postStatus === "hidden" ? "Unhide" : "Publish";
  const toggleVariant =
    postStatus === "draft" ? "default" : postStatus === "published" ? "secondary" : "outline";
  const toggleAction = postStatus === "published" ? unpublishAction : publishAction;
  const ToggleIcon =
    postStatus === "published" ? EyeOffIcon : postStatus === "hidden" ? EyeIcon : RocketIcon;

  async function handleToggle() {
    setIsPending(true);

    try {
      const formData = new FormData();
      formData.set("postId", postId);
      await toggleAction(formData);

      if (postStatus === "published") {
        toast.success("Post hidden.");
      } else if (postStatus === "hidden") {
        toast.success("Post unhidden.");
      } else {
        toast.success("Post published.");
      }

      router.refresh();
    } catch {
      toast.error("Unable to update post visibility. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={toggleVariant}
      size="icon-sm"
      aria-label={`${toggleLabel} ${postTitle}`}
      title={toggleLabel}
      onClick={handleToggle}
      disabled={isPending}
    >
      <ToggleIcon />
    </Button>
  );
}

function DeletePostActionButton({
  postId,
  postTitle,
  deleteAction,
}: {
  postId: string;
  postTitle: string;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    setIsPending(true);

    try {
      const formData = new FormData();
      formData.set("postId", postId);
      await deleteAction(formData);
      toast.success("Post deleted.");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Unable to delete post. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          aria-label={`Delete ${postTitle}`}
        >
          <Trash2Icon />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this post?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. &ldquo;{postTitle}&rdquo; will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function getPostStatus(post: PostListItem): PostStatus {
  if (post.published) {
    return "published";
  }

  return post.publishedAt ? "hidden" : "draft";
}

function SortIndicator({ value }: { value: false | SortDirection }) {
  if (!value) {
    return <ArrowUpDownIcon className="size-3.5 text-muted-foreground" />;
  }

  return value === "asc" ? (
    <ArrowUpIcon className="size-3.5 text-foreground" />
  ) : (
    <ArrowDownIcon className="size-3.5 text-foreground" />
  );
}

export function BloggerPostsTable({
  posts,
  publishAction,
  unpublishAction,
  deleteAction,
}: BloggerPostsTableProps) {
  const data = useMemo<TablePost[]>(
    () =>
      posts.map((post) => ({
        ...post,
        status: getPostStatus(post),
      })),
    [posts],
  );

  const [sorting, setSorting] = useState<SortingState>([{ id: "publishedAt", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = useMemo<ColumnDef<TablePost>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: ({ column }) => (
          <button
            type="button"
            onClick={column.getToggleSortingHandler()}
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            Title
            <SortIndicator value={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row }) => {
          const post = row.original;
          return (
            <div className="flex max-w-104 flex-col gap-1">
              <Link
                href={`/posts/${post.slug}`}
                className="line-clamp-1 font-medium hover:underline"
              >
                {post.title}
              </Link>
              <span className="line-clamp-1 text-xs text-muted-foreground">/posts/{post.slug}</span>
            </div>
          );
        },
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        filterFn: "equalsString",
        cell: ({ row }) => {
          const status = row.original.status;
          const statusLabel =
            status === "published" ? "Published" : status === "hidden" ? "Hidden" : "Draft";
          const statusVariant =
            status === "published" ? "default" : status === "hidden" ? "outline" : "secondary";
          return <Badge variant={statusVariant}>{statusLabel}</Badge>;
        },
      },
      {
        id: "updatedAt",
        accessorFn: (row) => new Date(row.updatedAt).getTime(),
        header: ({ column }) => (
          <button
            type="button"
            onClick={column.getToggleSortingHandler()}
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            Updated
            <SortIndicator value={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row }) => formatDateTime(row.original.updatedAt),
      },
      {
        id: "publishedAt",
        accessorFn: (row) => new Date(row.publishedAt ?? 0).getTime(),
        header: ({ column }) => (
          <button
            type="button"
            onClick={column.getToggleSortingHandler()}
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            Published at
            <SortIndicator value={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row }) => formatDateTime(row.original.publishedAt),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const post = row.original;
          const postStatus = post.status;

          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                asChild
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${post.title}`}
              >
                <Link href={`/blogger/posts/${post.id}/edit`}>
                  <PencilIcon />
                </Link>
              </Button>

              <VisibilityActionButton
                postId={post.id}
                postStatus={postStatus}
                postTitle={post.title}
                publishAction={publishAction}
                unpublishAction={unpublishAction}
              />

              <DeletePostActionButton
                postId={post.id}
                postTitle={post.title}
                deleteAction={deleteAction}
              />
            </div>
          );
        },
      },
    ],
    [deleteAction, publishAction, unpublishAction],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    autoResetPageIndex: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const statusColumn = table.getColumn("status");
  const statusFilterValue = ((statusColumn?.getFilterValue() as PostStatus | undefined) ??
    "all") as StatusFilter;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const currentRows = table.getRowModel().rows;
  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageSize = table.getState().pagination.pageSize;
  const start = filteredCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filteredCount);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
          <span className="text-muted-foreground">Status</span>
          <Select
            value={statusFilterValue}
            onValueChange={(value) => {
              statusColumn?.setFilterValue(value === "all" ? undefined : value);
            }}
          >
            <SelectTrigger className="min-w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all" className="cursor-pointer">
                  All
                </SelectItem>
                <SelectItem value="published" className="cursor-pointer">
                  Published
                </SelectItem>
                <SelectItem value="hidden" className="cursor-pointer">
                  Hidden
                </SelectItem>
                <SelectItem value="draft" className="cursor-pointer">
                  Draft
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody className="[&_tr:last-child]:border-b">
            {currentRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center text-muted-foreground"
                >
                  No posts found for this status filter.
                </TableCell>
              </TableRow>
            ) : (
              currentRows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          <p className="text-sm text-muted-foreground">
            Showing {start} - {end} of {filteredCount} posts
          </p>

          {filteredCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => table.firstPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to first page"
              >
                <ChevronsLeftIcon />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to previous page"
              >
                <ChevronLeftIcon />
              </Button>

              <span className="inline-flex min-w-9 items-center justify-center text-sm font-medium tabular-nums">
                {currentPage}
              </span>

              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to next page"
              >
                <ChevronRightIcon />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => table.lastPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to last page"
              >
                <ChevronsRightIcon />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
