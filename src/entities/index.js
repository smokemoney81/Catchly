// Compatibility shim - leitet alle alten entity imports auf base44Client um
import { base44 } from '@/api/base44Client';

export const User = base44.auth;
export const Catch = base44.entities.Catch;
export const Spot = base44.entities.Spot;
export const SpotGroup = base44.entities.SpotGroup;
export const Post = base44.entities.Post;
export const Comment = base44.entities.Comment;
export const FishingPlan = base44.entities.FishingPlan;
export const FishingClub = base44.entities.FishingClub;
export const RuleEntry = base44.entities.RuleEntry;
export const Species = base44.entities.Species;
export const License = base44.entities.License;
export const BaitIngredient = base44.entities.BaitIngredient;
export const BaitRecipe = base44.entities.BaitRecipe;
export const LeaderboardEntry = base44.entities.LeaderboardEntry;
export const ChatMessage = base44.entities.ChatMessage;
export const FishingEvent = base44.entities.FishingEvent;

// Stubs für nicht migrierte Entities
const createStub = (name) => ({
  list: async () => [],
  filter: async () => [],
  get: async () => null,
  create: async (d) => ({ id: Date.now().toString(), ...d }),
  update: async (id, d) => ({ id, ...d }),
  delete: async () => {},
});

export const GearCategory = createStub('GearCategory');
export const GearItem = createStub('GearItem');
export const Loadout = createStub('Loadout');
export const PackSession = createStub('PackSession');
export const GearRule = createStub('GearRule');
export const Gear = createStub('Gear');
export const UsageSession = createStub('UsageSession');
export const PremiumEvent = createStub('PremiumEvent');
