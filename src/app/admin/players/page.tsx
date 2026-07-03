"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Player } from "@/lib/types";

const emptyForm = {
  name: "",
  hometown: "",
  handicap: "",
  fun_fact: "",
};

export default function PlayersPage() {
  const supabase = createClient();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPlayers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("name", { ascending: true })
      .returns<Player[]>();
    if (error) setError(error.message);
    setPlayers(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);

    const { error } = await supabase.from("players").insert({
      name: form.name.trim(),
      hometown: form.hometown.trim() || null,
      handicap: form.handicap ? Number(form.handicap) : null,
      fun_fact: form.fun_fact.trim() || null,
    });

    if (error) {
      setError(error.message);
    } else {
      setForm(emptyForm);
      await loadPlayers();
    }
    setSaving(false);
  }

  async function toggleActive(player: Player) {
    await supabase
      .from("players")
      .update({ active: !player.active })
      .eq("id", player.id);
    loadPlayers();
  }

  return (
    <div className="space-y-10">
      <section>
        <p className="stamp text-turf-500 mb-2">Player pool</p>
        <h1 className="font-display text-3xl font-700 text-turf-950">
          Eligible players
        </h1>
        <p className="text-turf-700 mt-1 max-w-lg">
          Everyone who could be drafted, across every year. Mark someone
          inactive rather than deleting them — their history stays intact.
        </p>
      </section>

      <section className="scorecard p-6">
        <h2 className="stamp text-turf-500 mb-4">Add a player</h2>
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="stamp text-turf-700">Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-white/70 border border-turf-900/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-turf-500"
              placeholder="Full name"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="stamp text-turf-700">Hometown</span>
            <input
              value={form.hometown}
              onChange={(e) => setForm({ ...form, hometown: e.target.value })}
              className="bg-white/70 border border-turf-900/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-turf-500"
              placeholder="City, State"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="stamp text-turf-700">Handicap</span>
            <input
              type="number"
              step="0.1"
              value={form.handicap}
              onChange={(e) => setForm({ ...form, handicap: e.target.value })}
              className="bg-white/70 border border-turf-900/20 rounded px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-turf-500"
              placeholder="e.g. 12.4"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="stamp text-turf-700">Fun fact</span>
            <input
              value={form.fun_fact}
              onChange={(e) => setForm({ ...form, fun_fact: e.target.value })}
              className="bg-white/70 border border-turf-900/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-turf-500"
              placeholder="Once lost a ball in a golf cart"
            />
          </label>

          <div className="sm:col-span-2 flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-turf-900 text-parchment-100 stamp px-5 py-2.5 rounded hover:bg-turf-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add player"}
            </button>
            {error && <p className="text-flag text-sm">{error}</p>}
          </div>
        </form>
      </section>

      <section>
        <h2 className="stamp text-turf-500 mb-4">
          Roster {players.length > 0 && `(${players.length})`}
        </h2>
        {loading ? (
          <p className="text-turf-700">Loading…</p>
        ) : players.length === 0 ? (
          <div className="scorecard p-8 text-center text-turf-700">
            No players yet — add the first one above.
          </div>
        ) : (
          <div className="scorecard overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="stamp text-turf-500 border-b border-turf-900/15">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Hometown</th>
                  <th className="px-4 py-3">Handicap</th>
                  <th className="px-4 py-3">Fun fact</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-turf-900/10 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-turf-700">
                      {p.hometown ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {p.handicap ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-turf-700">
                      {p.fun_fact ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(p)}
                        className={`stamp px-2.5 py-1 rounded-full border ${
                          p.active
                            ? "border-turf-700/40 text-turf-700"
                            : "border-flag/40 text-flag"
                        }`}
                      >
                        {p.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
