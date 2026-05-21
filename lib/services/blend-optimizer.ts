import { Barrel } from '../../types/database';
import { calcProofGallons } from '../ttb';

export interface BlendComponent {
  volume: number; // wine gallons
  proof: number;
  age_months?: number; // Optional for average age calculation
}

export interface BlendResult {
  total_volume: number; // wine gallons
  final_proof: number;
  total_proof_gallons: number;
  yield_bottles_750ml: number;
  average_age_months: number | null;
}

const WG_PER_750ML = 0.198129;

/**
 * Calculates the resulting characteristics of a blend.
 */
export function calculateBlend(components: BlendComponent[]): BlendResult {
  let totalVolume = 0;
  let totalProofGallons = 0;
  let weightedAgeSum = 0;
  let volumeWithAge = 0;

  for (const comp of components) {
    totalVolume += comp.volume;
    totalProofGallons += calcProofGallons(comp.volume, comp.proof);
    
    if (comp.age_months !== undefined) {
      weightedAgeSum += comp.age_months * comp.volume;
      volumeWithAge += comp.volume;
    }
  }

  const finalProof = totalVolume > 0 ? (totalProofGallons / totalVolume) * 100 : 0;
  const yieldBottles = totalVolume / WG_PER_750ML;
  const averageAge = volumeWithAge > 0 ? weightedAgeSum / volumeWithAge : null;

  return {
    total_volume: totalVolume,
    final_proof: finalProof,
    total_proof_gallons: totalProofGallons,
    yield_bottles_750ml: Math.floor(yieldBottles),
    average_age_months: averageAge,
  };
}

/**
 * Heuristic to select barrels to hit a target volume and proof.
 * 
 * Strategy:
 * 1. Sort barrels by how close they are to the target proof.
 * 2. Greedy selection to hit volume, while trying to balance the proof.
 */
export function optimizeBlendForTarget(
  barrels: Barrel[], 
  targetProof: number, 
  targetVolume: number
): Barrel[] {
  // Filter out barrels without volume or proof
  const candidates = barrels.filter(b => 
    (b.current_wine_gallons || b.wine_gallons) && 
    (b.current_proof_estimate || b.entry_proof)
  );

  // Sort candidates by proof proximity
  candidates.sort((a, b) => {
    const proofA = a.current_proof_estimate || a.entry_proof || 0;
    const proofB = b.current_proof_estimate || b.entry_proof || 0;
    return Math.abs(proofA - targetProof) - Math.abs(proofB - targetProof);
  });

  const selected: Barrel[] = [];
  let currentVolume = 0;
  let currentPG = 0;

  for (const barrel of candidates) {
    const vol = barrel.current_wine_gallons || barrel.wine_gallons || 0;
    const proof = barrel.current_proof_estimate || barrel.entry_proof || 0;

    if (currentVolume + vol <= targetVolume * 1.1) { // Allow slight overage
      selected.push(barrel);
      currentVolume += vol;
      currentPG += (vol * proof / 100);
    }

    if (currentVolume >= targetVolume) break;
  }

  return selected;
}
