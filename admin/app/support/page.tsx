'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpRight, Loader2, Plus, X } from 'lucide-react';
import { Panel } from '@eightblock/ui/components/panel';
import { Field } from '@eightblock/ui/components/field';
import { Input } from '@eightblock/ui/components/input';
import { Switch } from '@eightblock/ui/components/switch';
import { Eyebrow } from '@eightblock/ui/components/section-header';
import { useToast } from '@eightblock/ui/hooks/use-toast';
import { ApiError } from '@/lib/api';
import { siteHref } from '@/lib/site-config';
import {
  MAX_WALLETS,
  fetchSupportWallets,
  saveSupportWallets,
  type SupportWallet,
  type SupportWalletInput,
} from '@/lib/support-wallets';

interface Row {
  key: string;
  id?: string;
  network: string;
  currency: string;
  address: string;
  label: string;
  note: string;
  enabled: boolean;
}

let nextKey = 0;
const newKey = () => `new-${nextKey++}`;

const toRows = (wallets: SupportWallet[]): Row[] =>
  wallets.map((wallet) => ({
    key: wallet.id,
    id: wallet.id,
    network: wallet.network,
    currency: wallet.currency,
    address: wallet.address,
    label: wallet.label ?? '',
    note: wallet.note ?? '',
    enabled: wallet.enabled,
  }));

const isBlank = (row: Row) => !row.network.trim() && !row.currency.trim() && !row.address.trim();

function toPayload(rows: Row[]): SupportWalletInput[] {
  return rows
    .filter((row) => !isBlank(row))
    .map((row) => ({
      id: row.id,
      network: row.network.trim(),
      currency: row.currency.trim().toUpperCase(),
      address: row.address.trim(),
      label: row.label.trim() || null,
      note: row.note.trim() || null,
      enabled: row.enabled,
    }));
}

function problem(rows: Row[]): string | null {
  for (const [index, row] of rows.entries()) {
    if (isBlank(row)) continue;
    const name = `Wallet ${index + 1}`;
    if (!row.network.trim() || !row.currency.trim() || !row.address.trim()) {
      return `${name} needs a network, a currency and an address.`;
    }
    if (/\s/.test(row.address.trim())) return `${name}: the address must not contain spaces.`;
  }
  return null;
}

const iconButton =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40';

export default function SupportWalletsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
    data: saved,
    isSuccess,
    isError,
    refetch,
    isFetching,
  } = useQuery({ queryKey: ['support-wallets'], queryFn: fetchSupportWallets });

  const [rows, setRows] = useState<Row[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isSuccess && rows === null) setRows(toRows(saved));
  }, [isSuccess, saved, rows]);

  if (!rows && isError) {
    return (
      <div className="container-page max-w-4xl py-14">
        <Panel className="p-8 text-center">
          <p className="font-display text-lg font-semibold text-foreground">
            Could not load the support wallets
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Editing is paused so a save cannot remove wallets you did not see.
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
      </div>
    );
  }

  if (!rows) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const update = (key: string, patch: Partial<Row>) =>
    setRows((current) =>
      current ? current.map((row) => (row.key === key ? { ...row, ...patch } : row)) : current
    );

  const move = (index: number, by: -1 | 1) =>
    setRows((current) => {
      if (!current) return current;
      const next = [...current];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });

  const add = () =>
    setRows((current) => [
      ...(current ?? []),
      {
        key: newKey(),
        network: '',
        currency: '',
        address: '',
        label: '',
        note: '',
        enabled: true,
      },
    ]);

  const remove = (key: string) =>
    setRows((current) => (current ? current.filter((row) => row.key !== key) : current));

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const issue = problem(rows);
    if (issue) {
      toast({ title: 'Check the wallets', description: issue, variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const result = await saveSupportWallets(toPayload(rows));
      queryClient.setQueryData(['support-wallets'], result);
      setRows(toRows(result));
      toast({
        title: 'Support wallets saved',
        description: 'Readers see the change the next time they open a page.',
      });
    } catch (error) {
      toast({
        title: 'Could not save the wallets',
        description:
          error instanceof ApiError && error.status === 400
            ? 'An address contains characters wallets do not use, or a field is too long.'
            : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const shown = rows.filter((row) => row.enabled && !isBlank(row)).length;

  return (
    <div className="container-page max-w-4xl py-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>Support</Eyebrow>
          <h1 className="mt-5 font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            Support wallets
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Addresses readers can tip, shown under every article and on the About page. Readers pick
            a network when there is more than one. With none enabled, the support box is hidden.
          </p>
        </div>
        <a href={siteHref('/about')} target="_blank" rel="noreferrer" className="btn-pill-outline">
          View on the blog
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      <form onSubmit={handleSave} className="mt-10">
        <fieldset disabled={saving} className="contents">
          <div className="space-y-4">
            {rows.length === 0 && (
              <Panel className="border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                No wallets. The support box is hidden on the blog.
              </Panel>
            )}

            {rows.map((row, index) => (
              <Panel key={row.key} className="space-y-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-brand-blue">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-display font-semibold text-foreground">
                      {row.network.trim() || 'New wallet'}
                      {row.currency.trim() && (
                        <span className="text-muted-foreground">
                          {' '}
                          · {row.currency.trim().toUpperCase()}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="mr-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Switch
                        checked={row.enabled}
                        onChange={(enabled) => update(row.key, { enabled })}
                      />
                      {row.enabled ? 'Shown' : 'Hidden'}
                    </label>
                    <button
                      type="button"
                      className={iconButton}
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={iconButton}
                      aria-label="Move down"
                      disabled={index === rows.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={iconButton}
                      aria-label="Remove wallet"
                      onClick={() => remove(row.key)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Network" htmlFor={`network-${row.key}`}>
                    <Input
                      id={`network-${row.key}`}
                      placeholder="Cardano"
                      maxLength={40}
                      value={row.network}
                      onChange={(event) => update(row.key, { network: event.target.value })}
                    />
                  </Field>
                  <Field label="Currency" htmlFor={`currency-${row.key}`}>
                    <Input
                      id={`currency-${row.key}`}
                      placeholder="ADA"
                      maxLength={12}
                      value={row.currency}
                      onChange={(event) => update(row.key, { currency: event.target.value })}
                    />
                  </Field>
                </div>
                <Field
                  label="Address"
                  htmlFor={`address-${row.key}`}
                  hint="Check it twice: tips sent to a wrong address cannot be recovered."
                >
                  <Input
                    id={`address-${row.key}`}
                    className="font-mono text-xs"
                    placeholder="addr1…"
                    maxLength={200}
                    spellCheck={false}
                    autoComplete="off"
                    value={row.address}
                    onChange={(event) => update(row.key, { address: event.target.value })}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Heading"
                    htmlFor={`label-${row.key}`}
                    hint={`Optional. Defaults to "Support with ${row.currency.trim().toUpperCase() || 'ADA'}".`}
                  >
                    <Input
                      id={`label-${row.key}`}
                      maxLength={80}
                      value={row.label}
                      onChange={(event) => update(row.key, { label: event.target.value })}
                    />
                  </Field>
                  <Field
                    label="Note"
                    htmlFor={`note-${row.key}`}
                    hint="Optional. A short line under the address, like a memo or tag to include."
                  >
                    <Input
                      id={`note-${row.key}`}
                      maxLength={200}
                      value={row.note}
                      onChange={(event) => update(row.key, { note: event.target.value })}
                    />
                  </Field>
                </div>
              </Panel>
            ))}

            {rows.length < MAX_WALLETS && (
              <button type="button" className="btn-pill-outline" onClick={add}>
                <Plus className="h-4 w-4" />
                Add wallet
              </button>
            )}
          </div>

          <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-4 border-t border-border bg-background py-4">
            <p className="text-xs text-muted-foreground">
              {shown === 0
                ? 'No wallet will be shown on the blog.'
                : `${shown} wallet${shown === 1 ? '' : 's'} shown on the blog.`}
            </p>
            <button type="submit" className="btn-pill" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save wallets
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
