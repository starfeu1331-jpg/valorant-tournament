
"use client";
"use client";
import { useEffect, useState } from "react";

type Tournament = {
  id: string;
  name: string;
};

type Overlay = {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string;
  isActive: boolean;
  config?: string;
  createdAt: string;
  updatedAt: string;
};

export default function RegieDashboardPage() {
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createType, setCreateType] = useState("SCOREBOARD");
  const [createDesc, setCreateDesc] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  // Fetch tournaments for select
  useEffect(() => {
    fetch("/api/tournaments/list").then(async r => {
      if (r.ok) {
        const data = await r.json();
        setTournaments(data);
        if (data.length > 0) setSelectedTournament(data[0].id);
      }
    });
  }, []);

  // Fetch overlays
  const fetchOverlays = async () => {
    setLoading(true);
    const res = await fetch("/api/overlay/list");
    if (res.ok) {
      const data = await res.json();
      // Robust: accept array or {overlays: array}
      if (Array.isArray(data)) {
        setOverlays(data);
      } else if (Array.isArray(data.overlays)) {
        setOverlays(data.overlays);
      } else {
        setFeedback("Erreur: format inattendu de la réponse API overlays");
        setOverlays([]);
      }
    } else {
      setFeedback("Erreur lors de la récupération des overlays");
      setOverlays([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOverlays();
    const interval = setInterval(fetchOverlays, 3000);
    return () => clearInterval(interval);
  }, []);

  // Toggle overlay active
  const handleToggle = async (id: string, isActive: boolean) => {
    setFeedback("Mise à jour...");
    const res = await fetch(`/api/overlay/${id}/toggle`, {
      method: "POST",
      body: JSON.stringify({ isActive: !isActive }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      setFeedback("Statut mis à jour !");
      fetchOverlays();
    } else {
      setFeedback("Erreur lors du toggle");
    }
    setTimeout(() => setFeedback(null), 1200);
  };

  // Delete overlay
  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet overlay ?")) return;
    setFeedback("Suppression...");
    const res = await fetch(`/api/overlay/${id}`, { method: "DELETE" });
    if (res.ok) {
      setFeedback("Overlay supprimé");
      fetchOverlays();
    } else {
      setFeedback("Erreur suppression");
    }
    setTimeout(() => setFeedback(null), 1200);
  };

  // Edit overlay
  const handleEdit = (overlay: Overlay) => {
    setEditId(overlay.id);
    setEditName(overlay.name);
    setEditDesc(overlay.description || "");
  };
  const handleEditSave = async () => {
    setFeedback("Sauvegarde...");
    const res = await fetch(`/api/overlay/${editId}`, {
      method: "PUT",
      body: JSON.stringify({ name: editName, description: editDesc }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      setFeedback("Modifié !");
      setEditId(null);
      fetchOverlays();
    } else {
      setFeedback("Erreur édition");
    }
    setTimeout(() => setFeedback(null), 1200);
  };

  // Créer overlay
  const handleCreate = async (e: any) => {
    e.preventDefault();
    setFeedback("Création...");
    let config = undefined;
    if (createType === "BRACKET" && selectedTournament) {
      config = JSON.stringify({ tournamentId: selectedTournament });
    }
    const res = await fetch("/api/overlay/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: createName, slug: createSlug, type: createType, description: createDesc, config }),
    });
    if (res.ok) {
      setFeedback("Overlay créé !");
      setCreateName(""); setCreateSlug(""); setCreateType("SCOREBOARD"); setCreateDesc("");
      fetchOverlays();
    } else {
      setFeedback("Erreur création");
    }
    setTimeout(() => setFeedback(null), 1200);
  };

  // Copier le lien
  const handleCopy = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/live-overlay?overlay=${slug}`);
    setFeedback("Lien copié !");
    setTimeout(() => setFeedback(null), 1200);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#fe2860]/60 to-[#ff6388]/60 p-8">
      <h1 className="text-3xl font-bold mb-6 text-white drop-shadow">Régie Overlays</h1>
      {feedback && (
        <div className="mb-4 px-4 py-2 rounded bg-white/20 text-white font-semibold shadow-lg w-fit animate-pulse">{feedback}</div>
      )}
      {/* Création overlay */}
      <form onSubmit={handleCreate} className="bg-white/10 backdrop-blur rounded-xl p-6 mb-8 max-w-xl border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4">Créer un overlay</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required className="rounded px-3 py-2" placeholder="Nom" value={createName} onChange={e => setCreateName(e.target.value)} />
          <input required className="rounded px-3 py-2" placeholder="Slug (unique)" value={createSlug} onChange={e => setCreateSlug(e.target.value)} />
          <select className="rounded px-3 py-2" value={createType} onChange={e => setCreateType(e.target.value)}>
            <option value="SCOREBOARD">Scoreboard</option>
            <option value="BRACKET">Bracket</option>
            <option value="PLAYERS">Players</option>
            <option value="TOURNAMENT_INFO">Tournament Info</option>
            <option value="CUSTOM">Custom</option>
          </select>
          <input className="rounded px-3 py-2" placeholder="Description" value={createDesc} onChange={e => setCreateDesc(e.target.value)} />
          {createType === "BRACKET" && (
            <select className="rounded px-3 py-2 col-span-2" value={selectedTournament} onChange={e => setSelectedTournament(e.target.value)}>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded font-bold shadow">Créer</button>
        </div>
      </form>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="text-white">Chargement...</div>
        ) : overlays.length === 0 ? (
          <div className="text-white/80 col-span-3">Aucun overlay trouvé.</div>
        ) : overlays.map((overlay: any) => (
          <div key={overlay.id} className="bg-white/10 backdrop-blur rounded-xl p-6 shadow-lg border border-white/20 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-lg text-white drop-shadow">{overlay.name}</span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${overlay.isActive ? "bg-green-500/80 text-white" : "bg-gray-500/40 text-white/70"}`}>
                {overlay.isActive ? "Actif" : "Inactif"}
              </span>
            </div>
            <div className="text-white/80 text-sm mb-2">{overlay.description}</div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <a
                href={`/live-overlay?overlay=${overlay.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded shadow text-xs font-semibold"
              >
                Ouvrir Overlay
              </a>
              <button
                onClick={() => handleCopy(overlay.slug)}
                className="bg-white/20 hover:bg-white/30 text-pink-500 px-3 py-1 rounded shadow text-xs font-semibold border border-pink-400"
              >
                Copier lien
              </button>
              <button
                onClick={() => handleToggle(overlay.id, overlay.isActive)}
                className={`px-3 py-1 rounded shadow text-xs font-semibold ${overlay.isActive ? "bg-gray-700 text-white hover:bg-gray-800" : "bg-green-500 text-white hover:bg-green-600"}`}
              >
                {overlay.isActive ? "Désactiver" : "Activer"}
              </button>
              <button
                onClick={() => handleEdit(overlay)}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded shadow text-xs font-semibold"
              >
                Éditer
              </button>
              <button
                onClick={() => handleDelete(overlay.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow text-xs font-semibold"
              >
                Supprimer
              </button>
            </div>
            {/* Édition inline */}
            {editId === overlay.id && (
              <div className="mt-4 bg-white/20 p-3 rounded-xl flex flex-col gap-2">
                <input
                  className="px-2 py-1 rounded bg-white/80 text-gray-900 font-semibold"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Nom"
                />
                <textarea
                  className="px-2 py-1 rounded bg-white/80 text-gray-900 font-semibold"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="Description"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleEditSave}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded shadow text-xs font-semibold"
                  >
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded shadow text-xs font-semibold"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
