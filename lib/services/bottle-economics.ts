import { calcProofGallons } from '../ttb';

export interface PackagingCost {
  bottle: number;
  label: number;
  closure: number;
  case: number; // Per bottle cost (total case cost / bottles per case)
}

export interface BottleEconomicsParams {
  spirit_cost: number;
  barrel_cost: number;
  packaging_cost: PackagingCost;
  labor_estimate: number;
  proofing_loss_pct: number;
  tax_estimate_per_pg: number;
  distributor_price: number;
  wholesale_price: number;
  tasting_room_price: number;
  msrp: number;
  expected_bottle_count: number;
  bottle_proof: number;
}

export interface ChannelMargin {
  price: number;
  margin_dollars: number;
  margin_pct: number;
}

export interface BottleEconomicsResult {
  total_cogs: number;
  cogs_per_bottle: number;
  gross_margin_per_channel: {
    distributor: ChannelMargin;
    wholesale: ChannelMargin;
    tasting_room: ChannelMargin;
    retail: ChannelMargin;
  };
  break_even_bottle_count: number;
  expected_revenue: {
    distributor: number;
    wholesale: number;
    tasting_room: number;
    mixed_case_example: number; // Weighted average or similar
  };
  expected_gross_profit: {
    distributor: number;
    wholesale: number;
    tasting_room: number;
  };
}

const WG_PER_750ML = 0.198129;

/**
 * Calculates the economics for a bottling run.
 * 
 * Standard distillery math:
 * 750ml = 0.198129 wine gallons
 * 1 Case (12 bottles) = 2.377548 wine gallons
 */
export function calculateBottleEconomics(params: BottleEconomicsParams): BottleEconomicsResult {
  const {
    spirit_cost,
    barrel_cost,
    packaging_cost,
    labor_estimate,
    proofing_loss_pct,
    tax_estimate_per_pg,
    distributor_price,
    wholesale_price,
    tasting_room_price,
    msrp,
    expected_bottle_count,
    bottle_proof,
  } = params;

  // Calculate tax per bottle
  const pg_per_bottle = calcProofGallons(WG_PER_750ML, bottle_proof);
  const tax_per_bottle = pg_per_bottle * tax_estimate_per_pg;

  // Calculate packaging per bottle
  const packaging_per_bottle = 
    packaging_cost.bottle + 
    packaging_cost.label + 
    packaging_cost.closure + 
    packaging_cost.case;

  // Total variable costs per bottle (packaging + tax)
  const variable_cost_per_bottle = packaging_per_bottle + tax_per_bottle;

  // Apply proofing loss to spirit cost if we assume spirit_cost is for input liquid
  // and we lose some percentage during the process.
  // If we lose 2%, the effective cost of the remaining liquid is higher.
  const adjusted_spirit_cost = spirit_cost / (1 - proofing_loss_pct / 100);

  // Fixed costs for this run
  const fixed_costs = adjusted_spirit_cost + barrel_cost + labor_estimate;

  // Total COGS
  const total_cogs = fixed_costs + (variable_cost_per_bottle * expected_bottle_count);
  const cogs_per_bottle = total_cogs / expected_bottle_count;

  const calculateMargin = (price: number): ChannelMargin => {
    const margin_dollars = price - cogs_per_bottle;
    return {
      price,
      margin_dollars,
      margin_pct: (margin_dollars / price) * 100,
    };
  };

  // Break even calculation (Fixed Costs / Contribution Margin)
  // We'll use a weighted average price or just the wholesale price as a baseline for break-even
  const contribution_margin_wholesale = wholesale_price - variable_cost_per_bottle - (adjusted_spirit_cost / expected_bottle_count) - (barrel_cost / expected_bottle_count);
  // Simpler break even: total fixed costs / (price - variable costs per bottle)
  // But spirit and barrel are fixed *per run* here.
  const break_even_bottle_count = Math.ceil(fixed_costs / (wholesale_price - variable_cost_per_bottle));

  return {
    total_cogs,
    cogs_per_bottle,
    gross_margin_per_channel: {
      distributor: calculateMargin(distributor_price),
      wholesale: calculateMargin(wholesale_price),
      tasting_room: calculateMargin(tasting_room_price),
      retail: calculateMargin(msrp),
    },
    break_even_bottle_count,
    expected_revenue: {
      distributor: distributor_price * expected_bottle_count,
      wholesale: wholesale_price * expected_bottle_count,
      tasting_room: tasting_room_price * expected_bottle_count,
      mixed_case_example: (distributor_price * 0.4 + wholesale_price * 0.4 + tasting_room_price * 0.2) * expected_bottle_count,
    },
    expected_gross_profit: {
      distributor: (distributor_price - cogs_per_bottle) * expected_bottle_count,
      wholesale: (wholesale_price - cogs_per_bottle) * expected_bottle_count,
      tasting_room: (tasting_room_price - cogs_per_bottle) * expected_bottle_count,
    },
  };
}
