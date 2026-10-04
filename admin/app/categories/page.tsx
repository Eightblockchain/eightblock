'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpRight, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Panel } from '@eightblock/ui/components/panel';
import { Field } from '@eightblock/ui/components/field';
import { Input } from '@eightblock/ui/components/input';
import { Eyebrow } from '@eightblock/ui/components/section-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@eightblock/ui/components/alert-dialog';
import { useToast } from '@eightblock/ui/hooks/use-toast';
import { siteHref } from '@/lib/site-config';
import {
  apiMessage,
  createCategory,
  deleteCategory,
  fetchCategories,
  reorderCategories,
  updateCategory,
  type Category,
  type CategoryInput,
} from '@/lib/categories';

const QUERY_KEY = ['categories'];

const iconButton =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40';

const articles = (count: number) => `${count} article${count === 1 ? '' : 's'}`;

function CategoryForm({
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: Category;
  submitLabel: string;
  pending: boolean;
  onSubmit: (input: CategoryInput) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const id = initial?.id ?? 'new';

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), description: description.trim() || null });
      }}
    >
      <fieldset
        disabled={pending}
        className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
      >
        <Field label="Name" htmlFor={`name-${id}`}>
          <Input
            id={`name-${id}`}
            placeholder="Cardano"
            maxLength={40}
            required
            autoFocus={Boolean(initial)}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field
          label="Description"
          htmlFor={`description-${id}`}
          hint="Optional. Shown on the blog when readers browse this category."
        >
          <Input
            id={`description-${id}`}
            maxLength={200}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
      </fieldset>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="btn-pill" disabled={pending || !name.trim()}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            !initial && <Plus className="h-4 w-4" />
          )}
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn-pill-outline" disabled={pending} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
    data: categories,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchCategories,
  });

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const setList = (list: Category[]) => queryClient.setQueryData(QUERY_KEY, list);

  const failed = (title: string, error: unknown) =>
    toast({
      title,
      description: apiMessage(error) ?? 'Please try again.',
      variant: 'destructive',
    });

  const create = useMutation({
    mutationFn: createCategory,
    onSuccess: (category) => {
      setList([...(categories ?? []), category]);
      setAdding(false);
      toast({
        title: `${category.name} added`,
        description: 'Writers can file articles under it now.',
        variant: 'success',
      });
    },
    onError: (error) => failed('Could not add the category', error),
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryInput }) => updateCategory(id, input),
    onSuccess: (category) => {
      setList((categories ?? []).map((c) => (c.id === category.id ? category : c)));
      setEditingId(null);
      toast({ title: 'Category saved', variant: 'success' });
    },
    onError: (error) => failed('Could not save the category', error),
  });

  const remove = useMutation({
    mutationFn: (category: Category) => deleteCategory(category.id),
    onSuccess: (_, category) => {
      setList((categories ?? []).filter((c) => c.id !== category.id));
      setDeleting(null);
      toast({ title: `${category.name} deleted`, variant: 'success' });
    },
    onError: (error) => failed('Could not delete the category', error),
  });

  const reorder = useMutation({
    mutationFn: reorderCategories,
    onMutate: (ids) => {
      const previous = categories;
      const byId = new Map((categories ?? []).map((c) => [c.id, c]));
      setList(ids.flatMap((id) => byId.get(id) ?? []));
      return { previous };
    },
    onSuccess: setList,
    onError: (error, _, context) => {
      if (context?.previous) setList(context.previous);
      failed('Could not reorder the categories', error);
    },
  });

  const move = (index: number, by: -1 | 1) => {
    if (!categories) return;
    const ids = categories.map((c) => c.id);
    [ids[index], ids[index + by]] = [ids[index + by], ids[index]];
    reorder.mutate(ids);
  };

  return (
    <div className="container-page max-w-4xl py-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>Content</Eyebrow>
          <h1 className="mt-5 font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            Categories
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            The blockchains articles are filed under. Writers pick at least one before publishing,
            and readers can browse the blog by category. Everything else stays a tag.
          </p>
        </div>
        <a
          href={siteHref('/writing')}
          target="_blank"
          rel="noreferrer"
          className="btn-pill-outline"
        >
          View on the blog
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      <div className="mt-10 space-y-4">
        {isError && !categories && (
          <Panel className="p-8 text-center">
            <p className="font-display text-lg font-semibold text-foreground">
              Could not load the categories
            </p>
            <button
              type="button"
              className="btn-pill mt-6"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
              Try again
            </button>
          </Panel>
        )}

        {!categories && !isError && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {categories?.length === 0 && (
          <Panel className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            No categories yet. Writers cannot publish until you add one.
          </Panel>
        )}

        {categories?.map((category, index) => (
          <Panel key={category.id} className="p-5 sm:p-6">
            {editingId === category.id ? (
              <CategoryForm
                initial={category}
                submitLabel="Save"
                pending={update.isPending}
                onSubmit={(input) => update.mutate({ id: category.id, input })}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-1 font-mono text-[11px] text-brand-blue">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-foreground">{category.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      /{category.slug} · {articles(category.articleCount)}
                    </p>
                    {category.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className={iconButton}
                    aria-label={`Move ${category.name} up`}
                    disabled={index === 0 || reorder.isPending}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={iconButton}
                    aria-label={`Move ${category.name} down`}
                    disabled={index === categories.length - 1 || reorder.isPending}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={iconButton}
                    aria-label={`Edit ${category.name}`}
                    onClick={() => setEditingId(category.id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={`${iconButton} hover:text-destructive`}
                    aria-label={`Delete ${category.name}`}
                    onClick={() => setDeleting(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </Panel>
        ))}

        {categories &&
          (adding ? (
            <Panel className="p-5 sm:p-6">
              <CategoryForm
                submitLabel="Add category"
                pending={create.isPending}
                onSubmit={(input) => create.mutate(input)}
                onCancel={() => setAdding(false)}
              />
            </Panel>
          ) : (
            <button type="button" className="btn-pill-outline" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" />
              Add category
            </button>
          ))}
      </div>

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && !remove.isPending && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.articleCount
                ? `${articles(deleting.articleCount)} will lose this category. The articles are kept; any left without a category need a new one before they can be published again.`
                : 'No article uses it.'}{' '}
              Links to its page on the blog will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={remove.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (deleting) remove.mutate(deleting);
              }}
            >
              {remove.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
