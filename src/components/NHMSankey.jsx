/* ═══════════════════════════════════════════════════════════════════════════
   NHMSankey.jsx — NHM Programme Flow Sankey
   NHM → 5 Divisions → Programmes → Status (Critical / Caution / On Track / Not Mapped)
   Uses @nivo/sankey v0.99. Click on division/programme nodes to navigate.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useMemo, useRef, useEffect, useState } from 'react';
import { ResponsiveSankey } from '@nivo/sankey';
import { KD_TREE } from '../data/kdData';
import { DIVISIONS } from '../data/programs';

/* ── Colour palette ─────────────────────────────────────────────────────── */
const DIV_COLORS = {
  rch:  '#4F8EF7',
  ndcp: '#F7B23B',
  ncd:  '#9B6FEB',
  hss:  '#2DD4BF',
  hrh:  '#F7614F',
};

/* Programme nodes get a lightened version of their parent division colour */
const PROG_TINTS = {
  rch:  '#93C5FD',
  ndcp: '#FCD34D',
  ncd:  '#C4B5FD',
  hss:  '#99F6E4',
  hrh:  '#FDBA74',
};

const STATUS_COLORS = {
  'Critical':   '#FF3B5C',
  'Caution':    '#FFB020',
  'On Track':   '#00C97A',
  'Not Mapped': '#94A3B8',
};

const NHM_COLOR  = '#1E3A5F';
const STATUS_IDS = ['On Track', 'Caution', 'Critical', 'Not Mapped'];

/* ── kdStatus helper ─────────────────────────────────────────────────────── */
function kdStatus(kd) {
  if (kd.achievement == null || kd.target == null || kd.target === 0) return 'Not Mapped';
  const r = kd.achievement / kd.target;
  if (kd.lowerIsBetter) return r <= 1 ? 'On Track' : r <= 1.33 ? 'Caution' : 'Critical';
  return r >= 1 ? 'On Track' : r >= 0.75 ? 'Caution' : 'Critical';
}

/* ── Build Sankey data from KD_TREE + DIVISIONS ─────────────────────────── */
function buildSankeyData() {
  const nodes = [];
  const links = [];

  const addNode = (id, label, group, divId = null) => {
    nodes.push({ id, label, group, divId });
  };

  /* Root */
  addNode('NHM', 'NHM', 'nhm');

  /* Totals for NHM→Division links */
  const divTotals = {};

  DIVISIONS.forEach(div => {
    const divId = div.id;
    addNode(`div_${divId}`, div.label, 'division', divId);

    const tree = KD_TREE[divId];

    /* Use programs.js as the source of truth for the 37 programmes.
       Look up KDs from KD_TREE by matching progId; sentinel-1 if no match. */
    (div.programs || []).forEach(prog => {
      const nodeId = `prog_${divId}_${prog.id}`;
      addNode(nodeId, prog.name || prog.id, 'programme', divId);

      const kdProg = tree?.programmes?.[prog.id];
      const kds    = kdProg?.kds || [];

      if (kds.length === 0) {
        /* No KD data mapped yet → thin sentinel link to Not Mapped */
        divTotals[divId] = (divTotals[divId] || 0) + 1;
        links.push({ source: `div_${divId}`, target: nodeId,     value: 1 });
        links.push({ source: nodeId,          target: 'Not Mapped', value: 1 });
        return;
      }

      const total  = kds.length;
      divTotals[divId] = (divTotals[divId] || 0) + total;
      links.push({ source: `div_${divId}`, target: nodeId, value: total });

      const counts = { 'On Track': 0, 'Caution': 0, 'Critical': 0, 'Not Mapped': 0 };
      kds.forEach(kd => counts[kdStatus(kd)]++);
      STATUS_IDS.forEach(st => {
        if (counts[st] > 0) {
          links.push({ source: nodeId, target: st, value: counts[st] });
        }
      });
    });
  });

  /* NHM → Division links (sized by total KD count) */
  DIVISIONS.forEach(div => {
    const total = divTotals[div.id] || 0;
    if (total > 0) {
      links.push({ source: 'NHM', target: `div_${div.id}`, value: total });
    }
  });

  /* Status sink nodes */
  STATUS_IDS.forEach(st => addNode(st, st, 'status'));

  return { nodes, links };
}

/* ── Colour accessor for @nivo/sankey ────────────────────────────────────── */
function nodeColor(node) {
  if (node.id === 'NHM')              return NHM_COLOR;
  if (node.group === 'division')      return DIV_COLORS[node.divId] || '#888';
  if (node.group === 'programme')     return PROG_TINTS[node.divId] || '#ccc';
  return STATUS_COLORS[node.id]       || '#ccc';
}

/* ── Label display ───────────────────────────────────────────────────────── */
function shortLabel(node) {
  if (node.group === 'nhm')      return 'NHM';
  if (node.group === 'division') return node.label || node.id.replace('div_', '').toUpperCase();
  if (node.group === 'status')   return node.id;
  /* Programme — truncate long names */
  const name = node.label || node.id;
  return name.length > 18 ? name.slice(0, 16) + '…' : name;
}

/* ── Custom tooltip ──────────────────────────────────────────────────────── */
function NodeTooltip({ node }) {
  const bg = nodeColor(node);
  return (
    <div style={{
      background: '#fff', border: `2px solid ${bg}`,
      borderRadius: 8, padding: '8px 14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      fontSize: 13, fontFamily: 'Inter, sans-serif',
      pointerEvents: 'none',
    }}>
      <div style={{ fontWeight: 700, color: '#1A2340', marginBottom: 2 }}>{node.label}</div>
      <div style={{ color: '#64748B', fontSize: 12 }}>
        {node.group === 'status'
          ? `${node.value} KDs`
          : node.group === 'programme'
          ? `${node.value} indicators`
          : `${node.value} KDs total`}
      </div>
      {(node.group === 'division' || node.group === 'programme') && (
        <div style={{ color: bg, fontSize: 11, marginTop: 4, fontWeight: 600 }}>
          Click to explore
        </div>
      )}
    </div>
  );
}

function LinkTooltip({ link }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 8, padding: '8px 14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      fontSize: 12, fontFamily: 'Inter, sans-serif', pointerEvents: 'none',
    }}>
      <span style={{ color: '#64748B' }}>
        {link.source.label} → {link.target.label}:{' '}
        <strong style={{ color: '#1A2340' }}>{link.value} KDs</strong>
      </span>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function NHMSankey({ onSelectDivision, onSelectProgramme, theme = 'light' }) {
  const { nodes, links } = useMemo(buildSankeyData, []);
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);

  /* Scroll-reveal: only animate in when section enters viewport */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.10 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleNodeClick = (node) => {
    if (node.group === 'division') {
      const div = DIVISIONS.find(d => d.id === node.divId);
      if (div && onSelectDivision) onSelectDivision(div);
    } else if (node.group === 'programme') {
      const div = DIVISIONS.find(d => d.id === node.divId);
      if (div && onSelectProgramme) {
        /* Try to find the programme in DIVISIONS first, else navigate to division */
        const prog = (div.programs || []).find(p => {
          const nodeProgId = node.id.replace(`prog_${node.divId}_`, '');
          return p.id === nodeProgId;
        });
        onSelectProgramme(prog || null, div);
      }
    }
  };

  const isDark = theme === 'dark';
  const labelColor = isDark ? '#CBD5E1' : '#334155';

  return (
    <div
      ref={wrapRef}
      className="nhm-sankey-wrap"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease' }}
    >
      {visible && (
        <ResponsiveSankey
          data={{ nodes, links }}
          margin={{ top: 20, right: 160, bottom: 20, left: 160 }}
          align="justify"
          sort="input"
          nodeOpacity={1}
          nodeHoverOthersOpacity={0.25}
          nodeThickness={14}
          nodeSpacing={6}
          nodePaddingX={5}
          nodeBorderWidth={0}
          nodeBorderRadius={3}
          linkOpacity={0.22}
          linkHoverOthersOpacity={0.06}
          linkContract={2}
          enableLinkGradient={true}
          labelPosition="outside"
          labelOrientation="horizontal"
          labelPadding={14}
          label={shortLabel}
          labelTextColor={labelColor}
          colors={nodeColor}
          animate={true}
          motionConfig={{
            mass: 1,
            tension: 180,
            friction: 26,
            clamp: false,
            precision: 0.01,
            velocity: 0,
          }}
          nodeTooltip={NodeTooltip}
          linkTooltip={LinkTooltip}
          onClick={handleNodeClick}
        />
      )}
    </div>
  );
}
