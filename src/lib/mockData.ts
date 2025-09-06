import { World, Folder, Template, TemplateField, Entity, Link, RelationshipRow, WorldMember, WorldInvite } from './types';
import { createCoreTemplates } from './coreTemplates';

export const worlds: World[] = [
  { id: 'w1', name: 'Eldervale', summary: 'Low fantasy realm.', entityCount: 0, updatedAt: new Date().toISOString() },
  { id: 'w2', name: 'Starward', summary: 'Frontier sci-fi cluster.', entityCount: 0, updatedAt: new Date().toISOString() },
];

export const folders: Folder[] = [
  { id: 'f-ents-characters', worldId: 'w1', name: 'Characters', description: 'Player characters, NPCs, and important figures', kind: 'entities', color: 'blue', count: 0 },
  { id: 'f-ents-locations',  worldId: 'w1', name: 'Locations', description: 'Towns, dungeons, and places of interest', kind: 'entities', color: 'green', count: 0 },
  { id: 'f-ents-items',      worldId: 'w1', name: 'Items', description: 'Weapons, artifacts, and magical objects', kind: 'entities', color: 'purple', count: 0 },
  { id: 'f-ents-factions',   worldId: 'w1', name: 'Factions', description: 'Organizations, guilds, and political groups', kind: 'entities', color: 'red', count: 0 },
  { id: 'f-tpl-core',        worldId: 'w1', name: 'Core', description: 'Essential templates for world building', kind: 'templates', color: 'indigo', count: 0 },
  { id: 'f-tpl-homebrew',    worldId: 'w1', name: 'Homebrew', description: 'Custom templates for unique content', kind: 'templates', color: 'yellow', count: 0 },
];

const characterFields: TemplateField[] = [
  { 
    id: 'tf-char-name', 
    name: 'Character Name', 
    type: 'shortText',
    prompt: 'Enter the character\'s full name',
    required: true
  },
  { 
    id: 'tf-char-concept', 
    name: 'One-Line Concept', 
    type: 'shortText',
    prompt: 'The hook (e.g., "grizzled courier hiding a royal secret")',
    required: true
  },
  { 
    id: 'tf-char-role', 
    name: 'Role / Archetype', 
    type: 'select',
    options: ['Protagonist', 'Antagonist', 'Ally', 'Mentor', 'Rival', 'Foil', 'Background'],
    prompt: 'Select the character\'s narrative role',
    required: true
  },
  { 
    id: 'tf-char-pronouns', 
    name: 'Pronouns & Form of Address', 
    type: 'shortText',
    prompt: 'e.g., she/her; "Captain"'
  },
  { 
    id: 'tf-char-species', 
    name: 'Species / Origin', 
    type: 'shortText',
    prompt: 'Keep generic (e.g., Human, Elf, Android)'
  },
  { 
    id: 'tf-char-age-appearance', 
    name: 'Age & Appearance Snapshot', 
    type: 'shortText',
    prompt: 'Age range, build, notable features'
  },
  { 
    id: 'tf-char-distinctive', 
    name: 'Distinctive Features', 
    type: 'multiSelect',
    options: ['Scars', 'Limp/Gait', 'Distinctive Scent', 'Unique Voice', 'Wardrobe Motif', 'Facial Hair', 'Jewelry', 'Tattoos', 'Missing Limb', 'Eyepatch', 'Distinctive Weapon', 'Pet/Companion'],
    prompt: 'Select notable physical or behavioral traits'
  },
  { 
    id: 'tf-char-personality', 
    name: 'Personality Traits (3–5)', 
    type: 'multiSelect',
    options: ['Stoic', 'Compassionate', 'Impulsive', 'Calculating', 'Loyal', 'Suspicious', 'Optimistic', 'Cynical', 'Brave', 'Cautious', 'Charming', 'Blunt', 'Patient', 'Hot-tempered', 'Wise', 'Naive', 'Ambitious', 'Content', 'Curious', 'Secretive'],
    prompt: 'Choose 3-5 core personality traits'
  },
  { 
    id: 'tf-char-values', 
    name: 'Values & Beliefs', 
    type: 'longText',
    prompt: 'What they won\'t compromise on; their moral code and core beliefs'
  },
  { 
    id: 'tf-char-motivations', 
    name: 'Motivations & Goals', 
    type: 'longText',
    prompt: 'Primary and secondary motivations; what drives them forward'
  },
  { 
    id: 'tf-char-flaws', 
    name: 'Flaws & Vulnerabilities', 
    type: 'longText',
    prompt: 'Blind spots, fears, limitations, and character weaknesses'
  },
  { 
    id: 'tf-char-skills', 
    name: 'Skills & Competencies', 
    type: 'multiSelect',
    options: ['Lockpicking', 'Diplomacy', 'Herbcraft', 'Combat', 'Investigation', 'Stealth', 'Leadership', 'Medicine', 'Engineering', 'Magic', 'Performance', 'Survival', 'Academics', 'Crafting', 'Animal Handling', 'Languages', 'Navigation', 'Intimidation', 'Deception', 'Persuasion'],
    prompt: 'Select relevant skills and abilities'
  },
  { 
    id: 'tf-char-resources', 
    name: 'Resources & Assets', 
    type: 'longText',
    prompt: 'Contacts, status, gear, wealth—non-mechanical resources'
  },
  { 
    id: 'tf-char-relationships', 
    name: 'Relationships Overview', 
    type: 'longText',
    prompt: 'Role-based relationships: "estranged parent," "old rival," "secret patron"'
  },
  { 
    id: 'tf-char-secrets', 
    name: 'Secrets & GM Notes', 
    type: 'longText',
    prompt: 'Private field for twists, hidden agendas, and GM-only information'
  }
];

export const templates: Template[] = [
  // Add comprehensive Character, Location, and Object templates from core templates
  ...createCoreTemplates('w1', 'f-tpl-core').map((template, index) => ({
    id: `tpl-${template.name.toLowerCase()}`,
    ...template
  })),
];

export const entities: Entity[] = [
  {
    id: 'e-lyle',
    worldId: 'w1',
    folderId: 'f-ents-characters',
    templateId: 'tpl-character',
    name: 'Lyle Thorn',
    summary: 'A wary ranger from the northern pines.',
    fields: { 
      'tf-char-name': 'Lyle Thorn',
      'tf-char-concept': 'Grizzled ranger guarding ancient secrets',
      'tf-char-role': 'Ally',
      'tf-char-pronouns': 'he/him; "Ranger"',
      'tf-char-species': 'Human',
      'tf-char-age-appearance': 'Mid-40s, lean and weathered, premature gray hair',
      'tf-char-distinctive': ['Scars', 'Limp/Gait', 'Distinctive Weapon'],
      'tf-char-personality': ['Stoic', 'Suspicious', 'Loyal', 'Cautious'],
      'tf-char-values': 'Protecting the innocent, preserving ancient knowledge, honoring fallen comrades. Will never abandon a post or break an oath.',
      'tf-char-motivations': 'Primary: Prevent the return of the Shadow Cult. Secondary: Train a worthy successor before retiring.',
      'tf-char-flaws': 'Struggles with survivor\'s guilt, overly suspicious of outsiders, refuses help even when needed.',
      'tf-char-skills': ['Combat', 'Survival', 'Investigation', 'Stealth', 'Animal Handling'],
      'tf-char-resources': 'Network of ranger contacts, knowledge of hidden paths, inherited cabin with supplies, modest savings.',
      'tf-char-relationships': 'Estranged daughter (city guard), mentor\'s ghost (haunting dreams), old war buddy (tavern keeper)',
      'tf-char-secrets': 'Carries the last Ward Stone fragment. Dreams reveal locations of cult activity. His "death" 10 years ago was staged.'
    },
    links: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'e-haven',
    worldId: 'w1',
    folderId: 'f-ents-locations',
    templateId: 'tpl-location',
    name: 'Havenridge',
    summary: 'Hill town guarding the old road.',
    fields: {
      'tf-loc-name': 'Havenridge',
      'tf-loc-description': 'Fortified hill town controlling the old trade road',
      'tf-loc-category': 'Settlement',
      'tf-loc-context': ['Mountain', 'Rural'],
      'tf-loc-climate': ['Temperate'],
      'tf-loc-population': 'Lively',
      'tf-loc-atmosphere': ['Orderly', 'Welcoming'],
      'tf-loc-safety': 'Safe',
      'tf-loc-law': 'Local Authority',
      'tf-loc-hazards': [],
      'tf-loc-access': 'Main road from south, mountain pass to north. 1 day travel from major cities. Guard checkpoint at town gates.',
      'tf-loc-economy': 'Trade hub for northern routes. Taxes on merchant caravans, local crafts, and mountain mining operations provide steady income.',
      'tf-loc-services': ['Lodging', 'Market', 'Healer', 'Workshop', 'Water Source'],
      'tf-loc-points-of-interest': '• Stone Keep - Lord\'s residence and garrison\n• Market Square - daily trading and town gatherings\n• The Crossroads Inn - travelers\' lodge\n• Temple of the Mountain - local shrine\n• Watchtowers - overlook approaches',
      'tf-loc-secrets': 'Underground tunnels connect key buildings. Hidden vault beneath keep contains emergency supplies and old treaties with mountain clans.'
    },
    links: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'e-shadowpeak',
    worldId: 'w1',
    folderId: 'f-ents-locations',
    templateId: 'tpl-location',
    name: 'Shadowpeak Monastery',
    summary: 'Ancient monastery perched on a mist-shrouded mountain.',
    fields: {
      'tf-loc-name': 'Shadowpeak Monastery',
      'tf-loc-description': 'Crumbling sanctuary where monks once studied forbidden magics',
      'tf-loc-category': 'Ruin',
      'tf-loc-context': ['Mountain', 'Subterranean'],
      'tf-loc-climate': ['Alpine', 'Temperate'],
      'tf-loc-population': 'Abandoned',
      'tf-loc-atmosphere': ['Ominous', 'Sacred', 'Ancient', 'Mysterious'],
      'tf-loc-safety': 'Dangerous',
      'tf-loc-law': 'None',
      'tf-loc-hazards': ['Unstable Terrain', 'Supernatural Anomalies', 'Predators'],
      'tf-loc-access': 'Treacherous mountain path, 2 days climb from Havenridge. Ancient rope bridge (may collapse). Hidden tunnel entrance through collapsed bell tower.',
      'tf-loc-economy': 'No active economy. Contains rare alchemical components, ancient texts, and crystal formations valued by scholars and mages.',
      'tf-loc-services': ['Water Source', 'Shrine'],
      'tf-loc-points-of-interest': '• Main Chapel - collapsed roof, altar still intact\n• The Scriptorium - scattered magical texts\n• Crystal Caves - natural formations amplify magic\n• Bell Tower - contains hidden passage\n• Monks\' Quarters - personal effects remain',
      'tf-loc-secrets': 'The monastery was abandoned when monks opened a portal to shadow realm. Portal still exists in basement, sealed but weakening. The last abbot hid a powerful artifact before fleeing.'
    },
    links: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'e-sword',
    worldId: 'w1',
    folderId: 'f-ents-items',
    templateId: 'tpl-object',
    name: 'Ashenblade',
    summary: 'A relic blade that sings in moonlight.',
    fields: {
      'tf-obj-name': 'Ashenblade',
      'tf-obj-description': 'Ancient blade that resonates with haunting melodies under moonlight',
      'tf-obj-category': 'Weapon',
      'tf-obj-size': 'Handheld',
      'tf-obj-materials': ['Steel', 'Silver', 'Crystal'],
      'tf-obj-quality': 'Masterwork',
      'tf-obj-condition': 'Good',
      'tf-obj-origin': 'Moonforge smiths of the Silver Peaks',
      'tf-obj-functions': ['Combat', 'Ritual', 'Signaling'],
      'tf-obj-features': ['Engraving', 'Inlay', 'Maker\'s Mark', 'Custom Modification'],
      'tf-obj-operation': 'Standard sword techniques apply. Under moonlight, the blade vibrates with harmonic frequencies that can be heard within 100 feet. The song intensifies when undead or shadow creatures are near.',
      'tf-obj-capabilities': 'Functions as a high-quality longsword. Moonlight song can detect supernatural entities, boost morale of allies, and potentially disrupt certain magical effects. Limited to line-of-sight moonlight exposure.',
      'tf-obj-power': 'Arcane',
      'tf-obj-value': 'Extremely valuable to collectors and scholars. Worth a small fortune, but priceless to those who understand its true nature. Highly sought after by both heroes and dark cultists.',
      'tf-obj-secrets': 'The blade was forged with fragments of a fallen star. It grows stronger during lunar eclipses and can cut through certain magical barriers. The song carries encoded messages from its original wielder\'s spirit.'
    },
    links: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'e-rangers',
    worldId: 'w1',
    folderId: 'f-ents-factions',
    templateId: 'tpl-organization',
    name: 'The Shadow Wardens',
    summary: 'Elite rangers protecting the realm from supernatural threats.',
    fields: {
      'tf-org-name': 'The Shadow Wardens',
      'tf-org-summary': 'Elite ranger organization defending against supernatural threats and ancient evils',
      'tf-org-type': 'Paramilitary',
      'tf-org-purpose': 'To protect the realm from supernatural threats, monitor dimensional rifts, and preserve ancient knowledge about otherworldly dangers. Founded after the Shadow War to ensure such horrors never return.',
      'tf-org-scope': 'Regional',
      'tf-org-governance': 'Council',
      'tf-org-transparency': 'Opaque',
      'tf-org-methods': ['Research', 'Espionage', 'Violence', 'Diplomacy'],
      'tf-org-legal': 'State-Sanctioned',
      'tf-org-influence': ['military', 'academia', 'politics'],
      'tf-org-resources': 'Government stipend supplemented by confiscated dark artifacts. Network of safe houses, specialized equipment for supernatural threats, extensive library of forbidden knowledge, trained rangers and scholars.',
      'tf-org-membership': 'Invitation only. Requires proven skill in combat and supernatural encounters, unwavering loyalty, and psychological resilience. Members take binding oaths and undergo rigorous training. Benefits include specialized equipment, supernatural protection wards, and substantial compensation.',
      'tf-org-culture': 'Honor-bound brotherhood with strong emphasis on duty and sacrifice. Regular cleansing rituals to prevent corruption. Motto: "Shadows cannot hide from those who guard the light." Hierarchy based on experience and specialized knowledge.',
      'tf-org-risk': 'Calculated',
      'tf-org-secrets': 'Several members are unknowingly descendants of Shadow War heroes. The organization monitors but has not eliminated all Shadow Cult remnants. A hidden vault contains captured artifacts too dangerous to destroy, guarded by ancient wards that are slowly weakening.'
    },
    links: [],
    updatedAt: new Date().toISOString(),
  },
];

export const links: Link[] = [
  { id: 'lnk-1', fromEntityId: 'e-lyle', toEntityId: 'e-haven', label: 'resides in' },
  { id: 'lnk-2', fromEntityId: 'e-lyle', toEntityId: 'e-sword', label: 'possesses' },
];

export const relationships: RelationshipRow[] = [
  { id: 'r-1', worldId: 'w1', from: 'e-lyle', to: 'e-haven', label: 'resides in' },
  { id: 'r-2', worldId: 'w1', from: 'e-lyle', to: 'e-sword', label: 'possesses' },
];

export const members: WorldMember[] = [
  {
    id: 'member-1',
    worldId: 'w1',
    userId: 'user-1',
    email: 'current@user.com',
    name: 'You',
    role: 'owner',
    joinedAt: '2024-01-01T00:00:00Z',
    lastActiveAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'member-2',
    worldId: 'w1',
    userId: 'user-2',
    email: 'alice@example.com',
    name: 'Alice Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b68e8810?w=32&h=32&fit=crop&crop=face',
    role: 'admin',
    joinedAt: '2024-01-05T00:00:00Z',
    lastActiveAt: '2024-01-14T15:45:00Z',
    invitedBy: 'user-1',
  },
  {
    id: 'member-3',
    worldId: 'w1',
    userId: 'user-3',
    email: 'bob@example.com',
    name: 'Bob Smith',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
    role: 'editor',
    joinedAt: '2024-01-10T00:00:00Z',
    lastActiveAt: '2024-01-13T09:20:00Z',
    invitedBy: 'user-2',
  },
  {
    id: 'member-4',
    worldId: 'w1',
    userId: 'user-4',
    email: 'carol@example.com',
    name: 'Carol Davis',
    role: 'viewer',
    joinedAt: '2024-01-12T00:00:00Z',
    lastActiveAt: '2024-01-12T14:15:00Z',
    invitedBy: 'user-1',
  },
  {
    id: 'member-5',
    worldId: 'w2',
    userId: 'user-1',
    email: 'current@user.com',
    name: 'You',
    role: 'owner',
    joinedAt: '2024-01-01T00:00:00Z',
    lastActiveAt: '2024-01-15T10:30:00Z',
  },
];

export const invites: WorldInvite[] = [
  {
    id: 'invite-1',
    worldId: 'w1',
    email: 'eve@example.com',
    role: 'editor',
    invitedBy: 'user-1',
    invitedAt: '2024-01-14T00:00:00Z',
    expiresAt: '2024-01-21T00:00:00Z',
  },
  {
    id: 'invite-2',
    worldId: 'w1',
    email: 'frank@example.com',
    role: 'viewer',
    invitedBy: 'user-2',
    invitedAt: '2024-01-13T00:00:00Z',
    expiresAt: '2024-01-20T00:00:00Z',
  },
];
