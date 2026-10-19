import type { ThreadId } from "@/content/site";

/**
 * Text alternatives for the four research figures. They sit on the
 * prerendered role="img" frame (not on the client-only SVG), so the
 * description is in the HTML before — and without — the figure itself.
 * Every figure is an illustration of the method, never model output.
 */
export const FIGURE_LABELS: Record<ThreadId, string> = {
  exoplanet:
    "Schematic: a coronagraph frame. The star is hidden behind the occulter, surrounded by diffraction spikes and speckle noise; a faint exoplanet beside it is boxed as the signal.",
  renal:
    "Schematic: an axial CT slice at kidney level, with a tumour outlined on one kidney and a small stone ringed on the other, above a router that sends each region to one of four experts: normal, tumour, stone and edge.",
  sepsis:
    "Schematic: a five-by-five grid of treatment actions, IV fluid by vasopressor dose, with some cells marked inadmissible. The learned policy steps only through admissible cells; an unmasked policy's path enters an inadmissible cell and the episode terminates.",
  genome:
    "Schematic: a reference sequence above four isoforms, with one C to T variant highlighted in the isoforms that carry it and its prediction set keeping both benign and pathogenic, meaning uncertain. Below, a small molecule graph whose attention edges feed a readout for 23 ADMET endpoints.",
};

export const SCHEMATIC_NOTE = "Schematic · not model output";
