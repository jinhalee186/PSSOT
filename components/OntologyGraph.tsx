"use client";

import { useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { OntologyModel } from "@/lib/ssot/types";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export function OntologyGraph({
  model,
  onSelectEntity,
  onSelectRelationship,
  onConnectEntities,
}: {
  model: OntologyModel;
  onSelectEntity: (id: string) => void;
  onSelectRelationship: (id: string) => void;
  onConnectEntities?: (sourceId: string, targetId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { t } = useI18n();

  const { nodes, edges } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = model.entities.filter((e) => {
      if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.attributes.some((a) => a.name.toLowerCase().includes(q))
      );
    });
    const visibleIds = new Set(visible.map((e) => e.id));
    const nodes: Node[] = visible.map((e, i) => ({
      id: e.id,
      position: { x: (i % 4) * 240, y: Math.floor(i / 4) * 160 },
      data: { label: `${e.name}\n${e.status}` },
      style: {
        border: e.status === "APPROVED" ? "2px solid #245c45" : "1px solid #b44a28",
        background: "#f4efe6",
        borderRadius: 12,
        padding: 10,
        fontSize: 12,
        whiteSpace: "pre-line",
        width: 180,
      },
    }));
    const edges: Edge[] = model.relationships
      .filter((r) => visibleIds.has(r.sourceEntityId) && visibleIds.has(r.targetEntityId))
      .map((r) => ({
        id: r.id,
        source: r.sourceEntityId,
        target: r.targetEntityId,
        label: `${r.label} ${r.cardinality}`,
        animated: r.status === "AI_GENERATED",
        style: { stroke: r.status === "APPROVED" ? "#245c45" : "#8a341c" },
      }));
    return { nodes, edges };
  }, [model, query, statusFilter]);

  function onConnect(c: Connection) {
    if (c.source && c.target && onConnectEntities) onConnectEntities(c.source, c.target);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("ont.search")}
          className="min-w-56 flex-1 rounded-lg border border-[var(--rule)] bg-white px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[var(--rule)] bg-white px-3 py-2 text-sm"
        >
          {(["ALL", "AI_GENERATED", "PENDING_REVIEW", "USER_MODIFIED", "VALIDATED", "APPROVED"] as const).map((s) => (
            <option key={s} value={s}>{s === "ALL" ? t("ont.filterAll") : s}</option>
          ))}
        </select>
      </div>
      <div className="h-[520px] overflow-hidden rounded-xl border border-[var(--rule)] bg-white">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            onConnect={onConnect}
            onNodeClick={(_, n) => onSelectEntity(n.id)}
            onEdgeClick={(_, e) => onSelectRelationship(e.id)}
          >
            <Background color="#d9d0c0" />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
      <p className="mt-2 text-xs text-[var(--ink-soft)]">{t("ont.connectHint")}</p>
    </div>
  );
}
