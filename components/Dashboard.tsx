"use client";

import { useMemo, useState } from "react";
import { Donjon, ELEMENTS, Personnage } from "@/lib/types";
import { AdminGate } from "./AdminGate";

type Tab = "personnages" | "donjons";

export function Dashboard({
  personnages,
  donjons,
}: {
  personnages: Personnage[];
  donjons: Donjon[];
}) {
  const [tab, setTab] = useState<Tab>("personnages");

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">ORIGIN / DATABASE</div>
          <h1>Explorer</h1>
          <p>
            Deux bases indépendantes, une interface de recherche et de
            statistiques.
          </p>
        </div>
        <a className="admin-link" href="/login">
          Administration
        </a>
      </header>

      <nav className="tabs">
        <button
          className={tab === "personnages" ? "tab active" : "tab"}
          onClick={() => setTab("personnages")}
        >
          Personnages <span>{personnages.length}</span>
        </button>
        <button
          className={tab === "donjons" ? "tab active" : "tab"}
          onClick={() => setTab("donjons")}
        >
          Donjons <span>{donjons.length}</span>
        </button>
      </nav>

      {tab === "personnages" ? (
        <PersonnagesView rows={personnages} />
      ) : (
        <DonjonsView rows={donjons} />
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

function PersonnagesView({ rows }: { rows: Personnage[] }) {
  const [filter, setFilter] = useState({
    arme: "Toutes",
    element: "Tous",
    type: "Tous",
    histoire: "Toutes",
  });
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (filter.arme === "Toutes" || r.arme === filter.arme) &&
          (filter.element === "Tous" || r.element === filter.element) &&
          (filter.type === "Tous" || r.type_personnage === filter.type) &&
          (filter.histoire === "Toutes" || r.histoire === filter.histoire) &&
          r.personnage.toLowerCase().includes(query.toLowerCase()),
      ),
    [rows, filter, query],
  );

  const topElement = ranking(rows.map((r) => r.element));
  const topType = ranking(rows.map((r) => r.type_personnage));
  const topArme = ranking(rows.map((r) => r.arme));
  const topHistoire = ranking(rows.map((r) => r.histoire));

  return (
    <>
      <section className="stats-grid">
        <StatCard
          label="Personnages"
          value={rows.length}
          detail={`${filtered.length} affichés`}
        />
        <StatCard
          label="Élément dominant"
          value={topElement?.label ?? "—"}
          detail={`${topElement?.count ?? 0} personnage(s)`}
        />
        <StatCard
          label="Type dominant"
          value={topType?.label ?? "—"}
          detail={`${topType?.count ?? 0} personnage(s)`}
        />
        <StatCard
          label="Histoire dominante"
          value={topHistoire?.label ?? "—"}
          detail={`${topHistoire?.count ?? 0} personnage(s)`}
        />
      </section>

      <section className="analytics">
        <Ranking
          title="Répartition des éléments"
          data={percentageRanking(
            rows.map((r) => r.element),
            rows.length,
          )}
        />
        <Ranking
          title="Répartition des armes"
          data={percentageRanking(
            rows.map((r) => r.arme),
            rows.length,
          )}
        />
        <Ranking
          title="Répartition des types"
          data={percentageRanking(
            rows.map((r) => r.type_personnage),
            rows.length,
          )}
        />
        <Ranking
          title="Répartition des histoires"
          data={percentageRanking(
            rows.map((r) => r.histoire),
            rows.length,
          )}
        />
      </section>

      <section className="table-card">
        <div className="table-toolbar">
          <input
            placeholder="Rechercher un personnage…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select
            value={filter.arme}
            onChange={(v) => setFilter((f) => ({ ...f, arme: v }))}
            options={["Toutes", ...new Set(rows.map((r) => r.arme))]}
          />
          <Select
            value={filter.element}
            onChange={(v) => setFilter((f) => ({ ...f, element: v }))}
            options={["Tous", ...ELEMENTS]}
          />
          <Select
            value={filter.type}
            onChange={(v) => setFilter((f) => ({ ...f, type: v }))}
            options={["Tous", "DPS", "Déluge", "Défense", "Support"]}
          />
          <Select
            value={filter.histoire}
            onChange={(v) => setFilter((f) => ({ ...f, histoire: v }))}
            options={["Toutes", "7DS", "4KoA", "OC"]}
          />
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Personnage</th>
                <th>Rareté</th>
                <th>Arme</th>
                <th>Élément</th>
                <th>Type</th>
                <th>Histoire</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <img src={r.image_url ?? "/placeholder.png"} alt={r.personnage} />
                  </td>
                  <td>
                    <b>{r.personnage}</b>
                  </td>
                  <td>{r.rarete}</td>
                  <td>{r.arme}</td>
                  <td>
                    <Badge text={r.element} />
                  </td>
                  <td>{r.type_personnage}</td>
                  <td>{r.histoire}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <AdminGate kind="personnages" rows={rows} />
    </>
  );
}

function DonjonsView({ rows }: { rows: Donjon[] }) {
  const [filter, setFilter] = useState({
    etat: "Tous",
    type: "Tous",
    faiblesse: "Toutes",
  });
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (filter.etat === "Tous" || r.etat === filter.etat) &&
          (filter.type === "Tous" || r.type === filter.type) &&
          (filter.faiblesse === "Toutes" ||
            r.faiblesses.includes(filter.faiblesse)) &&
          r.nom_donjon.toLowerCase().includes(query.toLowerCase()),
      ),
    [rows, filter, query],
  );

  const weakCounts = ELEMENTS.map((e) => ({
    label: e,
    count: rows.filter((r) => r.faiblesses.includes(e)).length,
  })).sort((a, b) => b.count - a.count);

  const available = rows.filter((r) => r.etat === "Disponible").length;
  const noWeakness = rows.filter((r) => r.faiblesses.length === 0).length;
  const avgWeakness = rows.length
    ? (rows.reduce((s, r) => s + r.faiblesses.length, 0) / rows.length).toFixed(
        2,
      )
    : "0";

  return (
    <>
      <section className="stats-grid">
        <StatCard
          label="Donjons"
          value={rows.length}
          detail={`${filtered.length} affichés`}
        />
        <StatCard
          label="Disponibles"
          value={available}
          detail={percent(available, rows.length)}
        />
        <StatCard
          label="Faiblesse la + fréquente"
          value={weakCounts[0]?.label ?? "—"}
          detail={percent(weakCounts[0]?.count ?? 0, rows.length)}
        />
        <StatCard
          label="Faiblesses moyennes"
          value={avgWeakness}
          detail="par donjon"
        />
      </section>

      <section className="analytics">
        <Ranking
          title="Faiblesses — % des donjons"
          data={weakCounts.map((x) => ({
            ...x,
            percent: percent(x.count, rows.length),
          }))}
        />
        <Ranking
          title="États"
          data={percentageRanking(
            rows.map((r) => r.etat),
            rows.length,
          )}
        />
        <Ranking
          title="Types de donjon"
          data={percentageRanking(
            rows.map((r) => r.type),
            rows.length,
          )}
        />
        <Ranking
          title="Donjons sans faiblesse"
          data={[
            {
              label: "Sans faiblesse",
              count: noWeakness,
              percent: percent(noWeakness, rows.length),
            },
            {
              label: "Avec faiblesse",
              count: rows.length - noWeakness,
              percent: percent(rows.length - noWeakness, rows.length),
            },
          ]}
        />
      </section>

      <section className="table-card">
        <div className="table-toolbar">
          <input
            placeholder="Rechercher un donjon…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select
            value={filter.etat}
            onChange={(v) => setFilter((f) => ({ ...f, etat: v }))}
            options={[
              "Tous",
              "Disponible",
              "Temporairement désactivé",
              "Retiré",
              "Terminé",
            ]}
          />
          <Select
            value={filter.type}
            onChange={(v) => setFilter((f) => ({ ...f, type: v }))}
            options={["Tous", "Boss d’Elite", "Donjons", "Raids", "Jonctions"]}
          />
          <Select
            value={filter.faiblesse}
            onChange={(v) => setFilter((f) => ({ ...f, faiblesse: v }))}
            options={["Toutes", ...ELEMENTS]}
          />
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Faiblesses</th>
                <th>État</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <b>{r.nom_donjon}</b>
                  </td>
                  <td>
                    {r.faiblesses.length ? (
                      r.faiblesses.map((x) => <Badge key={x} text={x} />)
                    ) : (
                      <span className="muted">Aucune</span>
                    )}
                  </td>
                  <td>{r.etat}</td>
                  <td>{r.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <AdminGate kind="donjons" rows={rows} />
    </>
  );
}

function Ranking({
  title,
  data,
}: {
  title: string;
  data: { label: string; count: number; percent: string }[];
}) {
  const max = Math.max(...data.map((x) => x.count), 1);
  return (
    <div className="rank-card">
      <h3>{title}</h3>
      {data.slice(0, 8).map((x, i) => (
        <div className="rank-row" key={x.label}>
          <span className="rank-number">#{i + 1}</span>
          <span className="rank-label">{x.label}</span>
          <div className="bar">
            <i style={{ width: `${(x.count / max) * 100}%` }} />
          </div>
          <strong>{x.percent}</strong>
        </div>
      ))}
    </div>
  );
}

function ranking(values: string[]) {
  const map = new Map<string, number>();
  values.forEach((v) => map.set(v, (map.get(v) ?? 0) + 1));
  const [label, count] =
    [...map.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  return label ? { label, count } : null;
}
function percentageRanking(values: string[], total: number) {
  const map = new Map<string, number>();
  values.forEach((v) => map.set(v, (map.get(v) ?? 0) + 1));
  return [...map.entries()]
    .map(([label, count]) => ({ label, count, percent: percent(count, total) }))
    .sort((a, b) => b.count - a.count);
}
function percent(n: number, total: number) {
  return total ? `${((n / total) * 100).toFixed(1)} %` : "0 %";
}
function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}
function Badge({ text }: { text: string }) {
  return <span className="badge">{text}</span>;
}
