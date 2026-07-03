"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewTournamentPage() {
  const supabase = createClient();
  const router = useRouter();

  const [form, setForm] = useState({
    year: new Date().getFullYear().toString(),
    name: "",
    course_name: "",
    tournament_date: "",
    roster_size: "16",
    num_rounds: "3",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { data, error } = await supabase
      .from("tournaments")
      .insert({
        year: Number(form.year),
        name: form.name.trim(),
        course_name: form.course_name.trim() || null,
        tournament_date: form.tournament_date || null,
        roster_size: Number(form.roster_size),
        num_rounds: Number(form.num_rounds),
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push(`/tournaments/${data.id}`);
  }

  return (
    <div className="space-y-8 max-w-xl">
      <section>
        <p className="stamp text-turf-500 mb-2">New tournament</p>
        <h1 className="font-display text-3xl font-700 text-turf-950">
          Set up this year's cup
        </h1>
        <p className="text-turf-700 mt-1">
          Once created, you'll assign captains and start the draft from the
          tournament page.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="scorecard p-6 grid gap-4">
        <label className="flex flex-col gap-1">
          <span className="stamp text-turf-700">Tournament name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-white/70 border border-turf-900/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-turf-500"
            placeholder="e.g. The 2026 Cup"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="stamp text-turf-700">Year</span>
            <input
              required
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              className="bg-white/70 border border-turf-900/20 rounded px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-turf-500"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="stamp text-turf-700">Date</span>
            <input
              type="date"
              value={form.tournament_date}
              onChange={(e) =>
                setForm({ ...form, tournament_date: e.target.value })
              }
              className="bg-white/70 border border-turf-900/20 rounded px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-turf-500"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="stamp text-turf-700">Course</span>
          <input
            value={form.course_name}
            onChange={(e) =>
              setForm({ ...form, course_name: e.target.value })
            }
            className="bg-white/70 border border-turf-900/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-turf-500"
            placeholder="Course name"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="stamp text-turf-700">Roster size</span>
            <select
              value={form.roster_size}
              onChange={(e) =>
                setForm({ ...form, roster_size: e.target.value })
              }
              className="bg-white/70 border border-turf-900/20 rounded px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-turf-500"
            >
              <option value="16">16 players</option>
              <option value="20">20 players</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="stamp text-turf-700">Rounds</span>
            <input
              type="number"
              min={1}
              value={form.num_rounds}
              onChange={(e) =>
                setForm({ ...form, num_rounds: e.target.value })
              }
              className="bg-white/70 border border-turf-900/20 rounded px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-turf-500"
            />
          </label>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-turf-900 text-parchment-100 stamp px-5 py-2.5 rounded hover:bg-turf-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create tournament"}
          </button>
          {error && <p className="text-flag text-sm">{error}</p>}
        </div>
      </form>
    </div>
  );
}
