import { TemplateField, Template } from './types';

// Core Species Template - Available to all worlds
const speciesFields: TemplateField[] = [
  {
    id: 'tf-spec-name',
    name: 'Species Name',
    type: 'shortText',
    prompt: 'Enter the species name',
    required: true
  },
  {
    id: 'tf-spec-identity',
    name: 'One-Line Identity',
    type: 'shortText',
    prompt: 'What defines them at a glance',
    required: true
  },
  {
    id: 'tf-spec-morphology',
    name: 'Morphology Archetype',
    type: 'select',
    options: ['Humanoid', 'Quadruped', 'Avian', 'Serpentine', 'Arthropod', 'Amorphous', 'Plantlike', 'Aquatic', 'Energy/Elemental', 'Construct', 'Other'],
    prompt: 'Select the basic body structure',
    required: true
  },
  {
    id: 'tf-spec-size',
    name: 'Typical Size & Build',
    type: 'shortText',
    prompt: 'Height/length, mass, posture'
  },
  {
    id: 'tf-spec-physiology',
    name: 'Physiology Highlights',
    type: 'multiSelect',
    options: ['Exoskeleton', 'Redundant Organs', 'Bioluminescence', 'Thermal Sacs', 'Regeneration', 'Camouflage', 'Venom/Poison', 'Gills', 'Wings', 'Claws/Talons', 'Shells', 'Spines/Quills', 'Armored Hide', 'Translucent'],
    prompt: 'Select notable physical traits'
  },
  {
    id: 'tf-spec-lifecycle',
    name: 'Life Cycle & Lifespan',
    type: 'shortText',
    prompt: 'Maturation age, typical/maximum lifespan'
  },
  {
    id: 'tf-spec-reproduction',
    name: 'Reproduction & Parenting',
    type: 'longText',
    prompt: 'Method, gestation/incubation, brood size, parental care'
  },
  {
    id: 'tf-spec-senses',
    name: 'Senses & Perception',
    type: 'longText',
    prompt: 'Low-light vision, echolocation, electroreception, pheromones, etc.'
  },
  {
    id: 'tf-spec-habitats',
    name: 'Preferred Habitats & Range',
    type: 'multiSelect',
    options: ['Forest', 'Desert', 'Tundra', 'Grassland', 'Mountains', 'Coastal', 'Deep Ocean', 'Freshwater', 'Caves', 'Volcanic', 'Arctic', 'Tropical', 'Urban', 'Aerial', 'Underground', 'Swamp/Marsh'],
    prompt: 'Select preferred biomes and environments'
  },
  {
    id: 'tf-spec-diet',
    name: 'Diet & Metabolism',
    type: 'longText',
    prompt: 'Herbivore/omnivore/carnivore/chemo/photo; feeding patterns, allergies'
  },
  {
    id: 'tf-spec-intelligence',
    name: 'Cognition & Intelligence Tier',
    type: 'select',
    options: ['Animal', 'Proto-sapient', 'Sapient', 'Supra-sapient'],
    prompt: 'Select cognitive development level'
  },
  {
    id: 'tf-spec-communication',
    name: 'Communication Modes',
    type: 'longText',
    prompt: 'Vocal, visual, pheromonal, tactile, sign, written, telepathic'
  },
  {
    id: 'tf-spec-temperament',
    name: 'Temperament & Social Behavior',
    type: 'longText',
    prompt: 'Solitary/pack, hierarchy, cooperation/competition tendencies'
  },
  {
    id: 'tf-spec-adaptations',
    name: 'Adaptations & Vulnerabilities',
    type: 'longText',
    prompt: 'Strengths, environmental tolerances, known weaknesses'
  },
  {
    id: 'tf-spec-ecology',
    name: 'Ecological Niche & Impact',
    type: 'longText',
    prompt: 'Predator/prey, keystone roles, symbioses, invasive potential'
  }
];

// Core Religion/Philosophy Template - Available to all worlds
const religionFields: TemplateField[] = [
  {
    id: 'tf-relig-name',
    name: 'Tradition Name',
    type: 'shortText',
    prompt: 'Enter the name of the religious or philosophical tradition',
    required: true
  },
  {
    id: 'tf-relig-identity',
    name: 'One-Line Identity',
    type: 'shortText',
    prompt: 'What defines it at a glance',
    required: true
  },
  {
    id: 'tf-relig-type',
    name: 'Tradition Type',
    type: 'select',
    options: ['Religion', 'Philosophy', 'Spiritual Movement', 'Cult', 'Mystery Tradition', 'Syncretic'],
    prompt: 'Select the type of tradition',
    required: true
  },
  {
    id: 'tf-relig-tenets',
    name: 'Core Tenets',
    type: 'longText',
    prompt: 'Foundational principles, aims'
  },
  {
    id: 'tf-relig-cosmology',
    name: 'Cosmology & Origins',
    type: 'longText',
    prompt: 'Creation/origin story, metaphysics'
  },
  {
    id: 'tf-relig-deity',
    name: 'Deity/Force Model',
    type: 'select',
    options: ['None/Non-theistic', 'Monist', 'Dualist', 'Polytheist', 'Animist', 'Ancestor Veneration', 'Abstract Principles'],
    prompt: 'Select the divine or force model'
  },
  {
    id: 'tf-relig-sources',
    name: 'Sacred Sources',
    type: 'multiSelect',
    options: ['Oral Tradition', 'Scriptures', 'Commentaries', 'Revelations', 'Visions', 'Dreams', 'Omens', 'Ancestral Teachings', 'Natural Signs', 'Ritual Knowledge'],
    prompt: 'Select sources of sacred knowledge'
  },
  {
    id: 'tf-relig-rites',
    name: 'Rites & Practices',
    type: 'longText',
    prompt: 'Daily/weekly practices, initiations, sacraments, meditation, offerings'
  },
  {
    id: 'tf-relig-morals',
    name: 'Moral Framework & Virtues',
    type: 'longText',
    prompt: 'Ethics, obligations, virtues'
  },
  {
    id: 'tf-relig-prohibitions',
    name: 'Prohibitions & Taboos',
    type: 'longText',
    prompt: 'Purity codes, dietary rules, forbidden acts'
  },
  {
    id: 'tf-relig-organization',
    name: 'Organization & Clergy',
    type: 'longText',
    prompt: 'Structure, roles, selection/training, vows'
  },
  {
    id: 'tf-relig-symbols',
    name: 'Symbols & Aesthetic Motifs',
    type: 'longText',
    prompt: 'Colors, icons, architecture, vestments, music'
  },
  {
    id: 'tf-relig-observances',
    name: 'Observances & Calendar',
    type: 'longText',
    prompt: 'Festivals, holy days, fasts, cycles'
  },
  {
    id: 'tf-relig-stance',
    name: 'Stance Toward Others',
    type: 'longText',
    prompt: 'Proselytizing vs. insular, view of outsiders, tech/magic attitude'
  },
  {
    id: 'tf-relig-secrets',
    name: 'Secrets & GM Notes',
    type: 'longText',
    prompt: 'Private field: mysteries, hidden doctrines, schisms, reveal triggers'
  }
];

// Core Government & Law Template - Available to all worlds
const governmentFields: TemplateField[] = [
  {
    id: 'tf-gov-name',
    name: 'Government Name',
    type: 'shortText',
    prompt: 'Enter the name of this government or governing body',
    required: true
  },
  {
    id: 'tf-gov-identity',
    name: 'One-Line Identity',
    type: 'shortText',
    prompt: 'What defines this government at a glance',
    required: true
  },
  {
    id: 'tf-gov-type',
    name: 'Governance Type',
    type: 'select',
    options: ['Autocracy', 'Monarchy', 'Oligarchy', 'Theocracy', 'Democracy', 'Republic', 'Technocracy', 'Meritocracy', 'Tribal Council', 'Confederation', 'Corporate State', 'Military Junta', 'Anarchic/Stateless', 'Other'],
    prompt: 'Select the primary form of government',
    required: true
  },
  {
    id: 'tf-gov-jurisdiction',
    name: 'Jurisdiction Level',
    type: 'select',
    options: ['Local', 'Regional', 'National', 'Planetary', 'Multi-world/Planar', 'Galactic'],
    prompt: 'Select the scope of governmental authority',
    required: true
  },
  {
    id: 'tf-gov-legitimacy',
    name: 'Legitimacy Source',
    type: 'select',
    options: ['Hereditary', 'Popular Mandate/Elections', 'Divine Mandate', 'Conquest', 'Corporate Charter', 'Council Compact', 'Technocratic Appointment', 'Revolutionary', 'Other'],
    prompt: 'Select the basis for governmental authority',
    required: true
  },
  {
    id: 'tf-gov-branches',
    name: 'Branches / Power Distribution',
    type: 'multiSelect',
    options: ['Executive', 'Legislative', 'Judicial', 'Civil Service', 'Councils', 'Guild Courts', 'Religious Courts'],
    prompt: 'How governmental power is divided and organized'
  },
  {
    id: 'tf-gov-legal-system',
    name: 'Legal System Type',
    type: 'select',
    options: ['Customary', 'Common Law', 'Civil/Code Law', 'Religious Law', 'Mixed'],
    prompt: 'Select the foundation of the legal system'
  },
  {
    id: 'tf-gov-lawmaking',
    name: 'Lawmaking Process',
    type: 'longText',
    prompt: 'Who drafts laws, how they are enacted, veto/override procedures, codification process'
  },
  {
    id: 'tf-gov-rights',
    name: 'Rights & Protections',
    type: 'longText',
    prompt: 'Guaranteed rights: speech, due process, property, privacy, association, minority protections'
  },
  {
    id: 'tf-gov-duties',
    name: 'Duties & Obligations',
    type: 'longText',
    prompt: 'Citizen responsibilities: taxes/tribute, service/conscription, oaths, tithes, civic duties'
  },
  {
    id: 'tf-gov-enforcement',
    name: 'Enforcement & Policing',
    type: 'longText',
    prompt: 'Law enforcement agencies, jurisdictions, investigative powers, use-of-force policies'
  },
  {
    id: 'tf-gov-courts',
    name: 'Courts & Due Process',
    type: 'longText',
    prompt: 'Court hierarchy, trial formats, evidence standards, legal counsel, appeals process'
  },
  {
    id: 'tf-gov-punishments',
    name: 'Punishments & Sanctions',
    type: 'longText',
    prompt: 'Penalties: fines, restitution, labor, exile, imprisonment, corporal, capital punishment; alternatives'
  },
  {
    id: 'tf-gov-integrity',
    name: 'Integrity & Corruption Level',
    type: 'select',
    options: ['Very High', 'High', 'Mixed', 'Low', 'Endemic'],
    prompt: 'Select the overall governmental integrity and corruption level'
  },
  {
    id: 'tf-gov-emergency',
    name: 'Emergency Powers & Security',
    type: 'longText',
    prompt: 'Emergency states, martial law, surveillance rules, internal security measures'
  }
];

// Core Power System Template - Available to all worlds
const powerSystemFields: TemplateField[] = [
  {
    id: 'tf-power-name',
    name: 'Power System Name',
    type: 'shortText',
    prompt: 'Enter the name of this power system',
    required: true
  },
  {
    id: 'tf-power-identity',
    name: 'One-Line Identity',
    type: 'shortText',
    prompt: 'What this power system is at a glance',
    required: true
  },
  {
    id: 'tf-power-source',
    name: 'Source Type',
    type: 'select',
    options: ['Arcane', 'Divine', 'Psychic', 'Vital/Chi', 'Biological', 'Technological', 'Alchemical', 'Quantum', 'Elemental', 'Void/Entropy', 'Other'],
    prompt: 'Select the fundamental source of this power',
    required: true
  },
  {
    id: 'tf-power-access',
    name: 'Access Requirements',
    type: 'longText',
    prompt: 'What is needed to access this power: innate talent, training, attunement, lineage, implants, licenses'
  },
  {
    id: 'tf-power-interface',
    name: 'Interface / Method',
    type: 'multiSelect',
    options: ['Ritual', 'Incantation', 'Gestures/Signs', 'Sigils/Runes', 'Device/Console', 'Code/Program', 'Mental Focus/Meditation', 'Biomodulation/Breathwork', 'Martial Forms', 'Alchemy/Crafting', 'Prayer/Invocation', 'Tuning/Resonance'],
    prompt: 'How practitioners interface with or activate this power'
  },
  {
    id: 'tf-power-domains',
    name: 'Domains of Effect',
    type: 'multiSelect',
    options: ['Telepathy', 'Illusions', 'Translocation', 'Healing', 'Biomancy', 'Technomancy', 'Divination', 'Wards', 'Summoning', 'Matter Shaping', 'Energy Control', 'Time', 'Entropy', 'Elements'],
    prompt: 'What kinds of effects this power system can produce'
  },
  {
    id: 'tf-power-range',
    name: 'Range & Scale',
    type: 'shortText',
    prompt: 'Effective range and scale: touch, line-of-sight, regional, global; micro ⟷ colossal'
  },
  {
    id: 'tf-power-costs',
    name: 'Costs & Fuel',
    type: 'longText',
    prompt: 'What powers require: stamina/focus, reagents/components, charges, cooldown/time, currency, reputation'
  },
  {
    id: 'tf-power-risks',
    name: 'Risks & Side Effects',
    type: 'longText',
    prompt: 'Dangers and consequences: burnout, backlash, mutation, corruption, exposure, collateral damage'
  },
  {
    id: 'tf-power-rules',
    name: 'Rules & Constraints',
    type: 'longText',
    prompt: 'Operating limitations: conservation/exchange rules, ritual conditions, prohibitions, null zones'
  },
  {
    id: 'tf-power-stability',
    name: 'Stability & Predictability',
    type: 'select',
    options: ['Deterministic', 'Reliable with Variance', 'Probabilistic', 'Chaotic'],
    prompt: 'How consistent and predictable the power system is'
  },
  {
    id: 'tf-power-countermeasures',
    name: 'Countermeasures & Resistance',
    type: 'longText',
    prompt: 'Defenses against this power: wards, shielding, materials, jamming, skepticism/null fields'
  },
  {
    id: 'tf-power-legality',
    name: 'Legality & Social Standing',
    type: 'select',
    options: ['Outlawed', 'Restricted/License', 'Regulated/Permitted', 'State-Monopolized', 'Unregulated', 'Sacred/Taboo'],
    prompt: 'Legal and social status of this power system'
  },
  {
    id: 'tf-power-practitioners',
    name: 'Typical Practitioners',
    type: 'longText',
    prompt: 'Who uses this power, training paths, organizational ties, social roles'
  },
  {
    id: 'tf-power-aesthetics',
    name: 'Signatures & Aesthetics',
    type: 'longText',
    prompt: 'Sensory manifestations: visuals, sounds, smells; UI motifs, symbols, distinctive tells'
  }
];

// Core Economy & Trade Template - Available to all worlds
const economyFields: TemplateField[] = [
  {
    id: 'tf-econ-name',
    name: 'Economy Name',
    type: 'shortText',
    prompt: 'Enter the name of this economic system',
    required: true
  },
  {
    id: 'tf-econ-identity',
    name: 'One-Line Identity',
    type: 'shortText',
    prompt: 'What defines this economy at a glance',
    required: true
  },
  {
    id: 'tf-econ-currency',
    name: 'Currency Model',
    type: 'select',
    options: ['Barter', 'Commodity Money', 'Coinage', 'Fiat', 'Credit/Script', 'Digital/Ledger', 'Energy/Charge', 'Mixed'],
    prompt: 'Select the primary currency or exchange system',
    required: true
  },
  {
    id: 'tf-econ-resources',
    name: 'Primary Resources & Goods',
    type: 'multiSelect',
    options: ['Grain', 'Ore', 'Timber', 'Textiles', 'Data', 'Reagents', 'Livestock', 'Fish', 'Spices', 'Gems', 'Energy', 'Information', 'Art', 'Labor', 'Services'],
    prompt: 'Key resources and goods that drive this economy'
  },
  {
    id: 'tf-econ-scarcity',
    name: 'Scarcity & Abundance',
    type: 'longText',
    prompt: 'What is scarce versus plentiful; where and why these conditions exist'
  },
  {
    id: 'tf-econ-sectors',
    name: 'Key Sectors & Industries',
    type: 'multiSelect',
    options: ['Agriculture', 'Mining', 'Craft', 'Manufacturing', 'Services', 'Research', 'Logistics', 'Finance', 'Entertainment', 'Defense', 'Magic/Tech'],
    prompt: 'Major economic sectors and industries'
  },
  {
    id: 'tf-econ-production',
    name: 'Production Methods',
    type: 'longText',
    prompt: 'How goods are made: guild craft, cottage industry, factories, automation, bio-grown, arcane/tech hybrids'
  },
  {
    id: 'tf-econ-labor',
    name: 'Labor Market & Class Dynamics',
    type: 'longText',
    prompt: 'Labor sources, contracts, mobility, social status, unrest pressures'
  },
  {
    id: 'tf-econ-tech-magic',
    name: 'Impact of Tech/Magic',
    type: 'longText',
    prompt: 'How technology/magic amplifies, constrains, or disrupts economic activity'
  },
  {
    id: 'tf-econ-trade-routes',
    name: 'Trade Routes & Logistics',
    type: 'longText',
    prompt: 'Transportation methods: land/sea/air/portal; transit times; chokepoints; hazards'
  },
  {
    id: 'tf-econ-markets',
    name: 'Markets & Hubs',
    type: 'longText',
    prompt: 'Bazaars, exchanges, fairs; frequency/seasonality; clearing mechanisms'
  },
  {
    id: 'tf-econ-regulation',
    name: 'Regulation, Tariffs & Taxes',
    type: 'longText',
    prompt: 'Tariff regimes, monopolies/charters, export controls, consumer regulations'
  },
  {
    id: 'tf-econ-finance',
    name: 'Finance & Credit System',
    type: 'longText',
    prompt: 'Moneylenders/banks, letters of credit, insurance, venture capital'
  },
  {
    id: 'tf-econ-risks',
    name: 'Risks & Disruptions',
    type: 'longText',
    prompt: 'Banditry, piracy, sanctions, contagion, famine, strikes, technological shocks'
  },
  {
    id: 'tf-econ-secrets',
    name: 'Secrets & GM Notes',
    type: 'longText',
    prompt: 'Private field: hidden cartels, price manipulation, planned economic shocks'
  }
];

// Core Creature (Fauna) Template - Available to all worlds
const creatureFields: TemplateField[] = [
  {
    id: 'tf-creature-name',
    name: 'Creature Name',
    type: 'shortText',
    prompt: 'Enter the name of this creature',
    required: true
  },
  {
    id: 'tf-creature-description',
    name: 'One-Line Description',
    type: 'shortText',
    prompt: 'What makes this creature distinct at a glance',
    required: true
  },
  {
    id: 'tf-creature-type',
    name: 'Creature Type / Classification',
    type: 'select',
    options: ['Natural Beast', 'Mammal', 'Reptile', 'Avian', 'Amphibian', 'Fish', 'Arthropod', 'Mollusk', 'Invertebrate', 'Elemental/Paranatural', 'Constructed/Bioengineered', 'Aberrant/Eldritch', 'Other'],
    prompt: 'Select the primary creature classification',
    required: true
  },
  {
    id: 'tf-creature-size',
    name: 'Size & Build',
    type: 'shortText',
    prompt: 'Physical dimensions: length/height, mass, silhouette description'
  },
  {
    id: 'tf-creature-habitat',
    name: 'Habitat & Biome',
    type: 'multiSelect',
    options: ['Forest', 'Desert', 'Coastal', 'Wetland', 'Mountain', 'Underground', 'Urban', 'Reef', 'Tundra', 'Savanna', 'Volcanic', 'Arctic', 'Swamp', 'Plains', 'Sky/Aerial'],
    prompt: 'Primary habitats and biomes where this creature lives'
  },
  {
    id: 'tf-creature-activity',
    name: 'Activity Cycle',
    type: 'select',
    options: ['Diurnal', 'Nocturnal', 'Crepuscular', 'Cathemeral', 'Seasonal/Hibernation', 'Seasonal/Estivation'],
    prompt: 'When this creature is most active'
  },
  {
    id: 'tf-creature-temperament',
    name: 'Temperament',
    type: 'select',
    options: ['Docile', 'Skittish', 'Territorial', 'Defensive', 'Aggressive/Predatory', 'Apex'],
    prompt: 'General behavioral disposition and threat level'
  },
  {
    id: 'tf-creature-social',
    name: 'Social Structure',
    type: 'select',
    options: ['Solitary', 'Pair-bonded', 'Small Group', 'Pack/Herd', 'Colony/Hive', 'Swarm'],
    prompt: 'How this creature organizes socially'
  },
  {
    id: 'tf-creature-diet',
    name: 'Diet & Feeding Behavior',
    type: 'longText',
    prompt: 'Dietary type: herbivore/omnivore/carnivore/chemo/photo; hunting and foraging strategies'
  },
  {
    id: 'tf-creature-senses',
    name: 'Senses & Perception',
    type: 'longText',
    prompt: 'Sensory capabilities: low-light vision, echolocation, electroreception, heat detection, pheromones'
  },
  {
    id: 'tf-creature-movement',
    name: 'Movement & Locomotion',
    type: 'multiSelect',
    options: ['Walking', 'Running', 'Climbing', 'Burrowing', 'Swimming', 'Flying', 'Gliding', 'Leaping', 'Teleportation', 'Phase-shifting'],
    prompt: 'Methods of movement and locomotion'
  },
  {
    id: 'tf-creature-adaptations',
    name: 'Adaptations (Physical/Behavioral)',
    type: 'longText',
    prompt: 'Special adaptations: camouflage, armor plates, bioluminescence, regenerative tissue, migration patterns'
  },
  {
    id: 'tf-creature-defenses',
    name: 'Defenses & Hazards',
    type: 'longText',
    prompt: 'How it protects itself and threatens others: venom, quills, charge attacks, disease vectors, toxic residue'
  },
  {
    id: 'tf-creature-reproduction',
    name: 'Reproduction & Life Cycle',
    type: 'longText',
    prompt: 'Mating seasons, gestation/incubation periods, clutch/brood sizes, parental care, life stages, lifespan'
  },
  {
    id: 'tf-creature-ecology',
    name: 'Ecological Role & Interactions',
    type: 'longText',
    prompt: 'Ecological niche, predator/prey relations, keystone effects, domestication potential, invasive risks'
  }
];

// Core Plant/Fungi Template - Available to all worlds
const plantFields: TemplateField[] = [
  {
    id: 'tf-plant-name',
    name: 'Species/Common Name',
    type: 'shortText',
    prompt: 'Enter the name of this plant or fungus',
    required: true
  },
  {
    id: 'tf-plant-description',
    name: 'One-Line Description',
    type: 'shortText',
    prompt: 'What makes this species distinct at a glance',
    required: true
  },
  {
    id: 'tf-plant-classification',
    name: 'Classification Type',
    type: 'select',
    options: ['Plant', 'Fungus', 'Lichen', 'Algae', 'Other'],
    prompt: 'Select the primary biological classification',
    required: true
  },
  {
    id: 'tf-plant-morphology',
    name: 'Growth Form / Morphology',
    type: 'select',
    options: ['Tree', 'Shrub', 'Herb', 'Vine', 'Grass', 'Fern', 'Moss', 'Mushroom', 'Bracket Fungus', 'Coral/Club Fungus', 'Lichen (Crustose/Foliose/Fruticose)', 'Algal Mat', 'Other'],
    prompt: 'Select the growth form and physical structure'
  },
  {
    id: 'tf-plant-habitat',
    name: 'Habitat, Biome & Climate',
    type: 'multiSelect',
    options: ['Forest', 'Desert', 'Wetland', 'Alpine', 'Reef', 'Tundra', 'Grassland', 'Coastal', 'Arid', 'Temperate', 'Tropical', 'Polar', 'Montane', 'Cave'],
    prompt: 'Primary habitats, biomes, and climate preferences'
  },
  {
    id: 'tf-plant-substrate',
    name: 'Substrate / Soil Preferences',
    type: 'multiSelect',
    options: ['Loam', 'Clay', 'Sand', 'Acidic', 'Alkaline', 'Peat', 'Decaying Wood', 'Rock', 'Dung', 'Rich Humus', 'Poor Soil', 'Waterlogged', 'Well-drained'],
    prompt: 'Preferred growing substrates and soil conditions'
  },
  {
    id: 'tf-plant-phenology',
    name: 'Phenology (Seasonality)',
    type: 'shortText',
    prompt: 'Blooming/fruiting periods; evergreen/deciduous nature; diurnal/nocturnal patterns'
  },
  {
    id: 'tf-plant-reproduction',
    name: 'Reproduction & Propagation',
    type: 'longText',
    prompt: 'Seeds/spores, pollination/dispersion vectors, vegetative spread mechanisms'
  },
  {
    id: 'tf-plant-features',
    name: 'Distinctive Field Features',
    type: 'multiSelect',
    options: ['Bright Flowers', 'Unusual Leaf Shape', 'Distinctive Bark', 'Cap & Gills', 'Bracket Form', 'Latex/Sap', 'Strong Odor', 'Colorful Spores', 'Unique Texture', 'Bioluminescence'],
    prompt: 'Notable visual and sensory characteristics for identification'
  },
  {
    id: 'tf-plant-edibility',
    name: 'Edibility & Culinary Use',
    type: 'longText',
    prompt: 'Edible parts, flavor profiles, safe preparation methods (descriptive only)'
  },
  {
    id: 'tf-plant-medicinal',
    name: 'Medicinal / Alchemical Properties',
    type: 'longText',
    prompt: 'Traditional uses, claimed effects, preparation methods, notable compounds (descriptive only)'
  },
  {
    id: 'tf-plant-hazards',
    name: 'Hazards & Toxicity',
    type: 'longText',
    prompt: 'Poisonous parts, allergenic reactions, dangerous look-alikes, safe handling precautions'
  },
  {
    id: 'tf-plant-ecology',
    name: 'Ecological Role & Interactions',
    type: 'longText',
    prompt: 'Relationships with pollinators, mycorrhizae, nitrogen-fixing, decomposer roles, parasitic/symbiotic relationships'
  },
  {
    id: 'tf-plant-distribution',
    name: 'Distribution & Range',
    type: 'longText',
    prompt: 'Native versus introduced status; elevation/depth ranges; distribution patterns and abundance'
  },
  {
    id: 'tf-plant-uses',
    name: 'Human/Industry Uses',
    type: 'longText',
    prompt: 'Applications in fiber, dye, resin, timber, fermentation, bioremediation, ritual/ceremonial uses'
  }
];

// Core Material/Resource Template - Available to all worlds
const materialFields: TemplateField[] = [
  {
    id: 'tf-material-name',
    name: 'Material/Resource Name',
    type: 'shortText',
    prompt: 'Enter the material or resource name',
    required: true
  },
  {
    id: 'tf-material-description',
    name: 'One-Line Description',
    type: 'shortText',
    prompt: 'What makes this material distinct and recognizable',
    required: true
  },
  {
    id: 'tf-material-category',
    name: 'Category / Type',
    type: 'select',
    options: ['Mineral/Ore', 'Metal', 'Alloy', 'Crystal/Gem', 'Ceramic/Glass', 'Polymer', 'Composite', 'Biomass/Organic', 'Chemical/Reagent', 'Pharmaceutical', 'Fuel/Energy Carrier', 'Isotope/Radioactive', 'Gas', 'Liquid', 'Other'],
    prompt: 'Primary classification of this material',
    required: true
  },
  {
    id: 'tf-material-state',
    name: 'Physical State',
    type: 'select',
    options: ['Solid', 'Liquid', 'Gas', 'Plasma', 'Energy/Field', 'Information'],
    prompt: 'Primary physical state under normal conditions'
  },
  {
    id: 'tf-material-appearance',
    name: 'Appearance & Identifiers',
    type: 'multiSelect',
    options: ['Color', 'Luster', 'Grain', 'Odor', 'Fluorescence', 'Grain Size', 'Transparency', 'Texture', 'Crystalline', 'Metallic', 'Glossy', 'Matte', 'Iridescent', 'Translucent', 'Opaque'],
    prompt: 'Visual and sensory characteristics for identification'
  },
  {
    id: 'tf-material-properties',
    name: 'Core Properties (Mech/Therm/Elec/Chem)',
    type: 'longText',
    prompt: 'Key physical properties: hardness, density, melting point, conductivity, reactivity, brittleness, elasticity, solubility, affinity'
  },
  {
    id: 'tf-material-grade',
    name: 'Grade & Purity',
    type: 'shortText',
    prompt: 'Common grades, purity levels, and assay ranges available'
  },
  {
    id: 'tf-material-occurrence',
    name: 'Occurrence & Formation',
    type: 'longText',
    prompt: 'Geological or biological contexts; typical deposits, sources, and formation processes (no specific location names)'
  },
  {
    id: 'tf-material-extraction',
    name: 'Extraction / Harvest Methods',
    type: 'longText',
    prompt: 'Mining, tapping, cultivation, synthesis methods; prerequisites, constraints, and technical requirements'
  },
  {
    id: 'tf-material-refinement',
    name: 'Refinement & Processing',
    type: 'longText',
    prompt: 'Processing steps: smelting, distillation, polymerization, annealing, purification; required facilities and expertise'
  },
  {
    id: 'tf-material-forms',
    name: 'Forms & Standard Units',
    type: 'multiSelect',
    options: ['Ingots', 'Sheets', 'Wire', 'Pellets', 'Powder', 'Crystal Rods', 'Vials', 'Barrels', 'Tubes', 'Blocks', 'Spheres', 'Flakes', 'Fibers', 'Granules', 'Chunks'],
    prompt: 'Available forms and standard measurement units'
  },
  {
    id: 'tf-material-applications',
    name: 'Applications & Use Cases',
    type: 'longText',
    prompt: 'Primary uses: structural, medical, energy, data, optics, catalysts, ritual/ceremonial, industrial applications'
  },
  {
    id: 'tf-material-availability',
    name: 'Availability & Rarity',
    type: 'longText',
    prompt: 'Abundance scale, seasonal availability, geographic distribution breadth, substitution pressure and alternatives'
  },
  {
    id: 'tf-material-hazards',
    name: 'Hazards, Safety & Handling',
    type: 'longText',
    prompt: 'Safety considerations: toxicity, flammability, reactivity, contamination risks, required PPE, proper disposal methods'
  },
  {
    id: 'tf-material-storage',
    name: 'Storage, Transport & Stability',
    type: 'longText',
    prompt: 'Storage requirements: temperature, humidity, shielding, containment specifications, shelf life, transport considerations'
  }
];

// Core Monster Template - Available to all worlds
const monsterFields: TemplateField[] = [
  {
    id: 'tf-monster-name',
    name: 'Monster Name',
    type: 'shortText',
    prompt: 'Enter the monster\'s name or designation',
    required: true
  },
  {
    id: 'tf-monster-description',
    name: 'One-Line Description',
    type: 'shortText',
    prompt: 'What makes this monster distinct and memorable',
    required: true
  },
  {
    id: 'tf-monster-origin',
    name: 'Origin Type',
    type: 'select',
    options: ['Natural Mutation', 'Corrupted/Plagued', 'Cursed', 'Summoned/Bound', 'Experimental/Bioengineered', 'Construct/Automaton', 'Undead', 'Extraplanar/Otherworldly', 'Mythic/Primordial', 'Folkloric/Thoughtform', 'Other'],
    prompt: 'How this monster came to exist',
    required: true
  },
  {
    id: 'tf-monster-classification',
    name: 'Classification',
    type: 'select',
    options: ['Beastlike', 'Humanoid', 'Swarm', 'Aberration', 'Elemental', 'Plantlike', 'Parasite', 'Predator', 'Colossus', 'Trickster', 'Other'],
    prompt: 'Primary morphological or behavioral classification'
  },
  {
    id: 'tf-monster-threat',
    name: 'Threat Level',
    type: 'select',
    options: ['Harmless', 'Caution', 'Risky', 'Dangerous', 'Deadly', 'Catastrophic'],
    prompt: 'Assessment of danger posed to typical encounters'
  },
  {
    id: 'tf-monster-size',
    name: 'Size & Silhouette',
    type: 'shortText',
    prompt: 'Physical dimensions: length/height, mass, and general outline or profile'
  },
  {
    id: 'tf-monster-habitat',
    name: 'Habitat & Domain',
    type: 'multiSelect',
    options: ['Forest', 'Swamp', 'Desert', 'Mountains', 'Underground', 'Urban', 'Ruins', 'Water/Aquatic', 'Aerial', 'Volcanic', 'Frozen/Arctic', 'Planar', 'Dimensional', 'Sacred Sites', 'Cursed Lands'],
    prompt: 'Preferred environments and territorial domains'
  },
  {
    id: 'tf-monster-activity',
    name: 'Activity Cycle',
    type: 'select',
    options: ['Diurnal', 'Nocturnal', 'Crepuscular', 'Cathemeral', 'Seasonal/Hibernation', 'Seasonal/Estivation'],
    prompt: 'When this monster is most active'
  },
  {
    id: 'tf-monster-cognition',
    name: 'Cognition Tier',
    type: 'select',
    options: ['Animal', 'Cunning', 'Sapient', 'Supra-sapient'],
    prompt: 'Level of intelligence and reasoning capability'
  },
  {
    id: 'tf-monster-behavior',
    name: 'Behavior & Temperament',
    type: 'longText',
    prompt: 'Behavioral patterns: stalking, territorial, playful, sadistic, pack mentality, solitary nature, aggression triggers'
  },
  {
    id: 'tf-monster-signs',
    name: 'Signs, Omens & Foreshadowing',
    type: 'longText',
    prompt: 'Warning signs of presence: tracks, smells, sounds, environmental changes, dead wildlife, unexplained phenomena'
  },
  {
    id: 'tf-monster-tactics',
    name: 'Tactics & Preferred Engagements',
    type: 'longText',
    prompt: 'Combat approach: ambush predator, pursuit hunter, trap setter, battlefield controller, swarm tactics, psychological warfare'
  },
  {
    id: 'tf-monster-abilities',
    name: 'Abilities & Special Traits',
    type: 'longText',
    prompt: 'Special capabilities: camouflage, burrowing, mimicry, phase-shift, acid secretion, aura effects, magical abilities (descriptive only)'
  },
  {
    id: 'tf-monster-defenses',
    name: 'Defenses, Resistances & Weaknesses',
    type: 'longText',
    prompt: 'Protective measures and vulnerabilities: natural armor, regeneration, damage resistances, exploitable senses, material/condition weaknesses'
  },
  {
    id: 'tf-monster-lair',
    name: 'Lair Features & Encounter Hooks',
    type: 'longText',
    prompt: 'Environmental advantages: terrain features, hazards, minion patterns, escalation triggers, tactical considerations for encounters'
  }
];

// Core Magic Item Template - Available to all worlds
const magicItemFields: TemplateField[] = [
  {
    id: 'tf-magic-item-name',
    name: 'Item Name',
    type: 'shortText',
    prompt: 'Enter the magical item\'s name',
    required: true
  },
  {
    id: 'tf-magic-item-description',
    name: 'One-Line Description',
    type: 'shortText',
    prompt: 'What makes this magical item distinct and memorable',
    required: true
  },
  {
    id: 'tf-magic-item-category',
    name: 'Item Category / Type',
    type: 'select',
    options: ['Weapon', 'Armor', 'Apparel', 'Accessory', 'Tool/Instrument', 'Focus/Implement', 'Tome/Scroll', 'Container', 'Key/Seal', 'Device/Relic', 'Consumable', 'Other'],
    prompt: 'Primary classification of this magical item',
    required: true
  },
  {
    id: 'tf-magic-item-power-source',
    name: 'Power Source & Attunement',
    type: 'longText',
    prompt: 'Source of magical power and bonding requirements: talent, oath, lineage, ritual, implant, divine blessing, elemental binding'
  },
  {
    id: 'tf-magic-item-activation',
    name: 'Activation Method(s)',
    type: 'multiSelect',
    options: ['Command Word', 'Gesture/Sign', 'Touch Contact', 'Focused Thought', 'Passive/Always-On', 'Proximity Trigger', 'Environmental Trigger', 'Ritual Use', 'Interface/Button', 'Sequence/Pattern'],
    prompt: 'How the item\'s magical effects are triggered or activated'
  },
  {
    id: 'tf-magic-item-effects',
    name: 'Core Effects / Domains',
    type: 'multiSelect',
    options: ['Protection', 'Concealment', 'Sensing', 'Healing', 'Transmutation', 'Summoning', 'Movement', 'Communication', 'Warding', 'Illusion', 'Energy Control', 'Matter Shaping', 'Fate/Entropy', 'Enhancement', 'Divination'],
    prompt: 'Primary magical domains and effect categories'
  },
  {
    id: 'tf-magic-item-capabilities',
    name: 'Capabilities & Limits',
    type: 'longText',
    prompt: 'Detailed description of what the item can and cannot do; scope limitations, range, duration, and edge cases'
  },
  {
    id: 'tf-magic-item-energy',
    name: 'Energy, Charges & Recharge',
    type: 'longText',
    prompt: 'Energy system: charges, fuel consumption, cooldown periods, recharge conditions (sunlight, rest, reagents, rituals)'
  },
  {
    id: 'tf-magic-item-costs',
    name: 'Costs & Requirements',
    type: 'longText',
    prompt: 'Usage costs: focus, stamina, materials, sacrifices, social obligations, legal compliance, economic impact'
  },
  {
    id: 'tf-magic-item-risks',
    name: 'Risks & Side Effects',
    type: 'longText',
    prompt: 'Potential dangers: backlash, corruption, addiction, misfires, unwanted attention, magical signatures, curses'
  },
  {
    id: 'tf-magic-item-conditions',
    name: 'Use Conditions & Rules',
    type: 'longText',
    prompt: 'Operating constraints: timing, location, components, taboos, environmental requirements, failure states'
  },
  {
    id: 'tf-magic-item-resonance',
    name: 'Resonance & Interactions',
    type: 'longText',
    prompt: 'Synergies and conflicts with other power systems, technology, environments, materials, and magical phenomena'
  },
  {
    id: 'tf-magic-item-appearance',
    name: 'Appearance & Signatures',
    type: 'longText',
    prompt: 'Physical description: motifs, craftsmanship quality, magical manifestations (glow, aura, sound, scent, temperature, weight)'
  },
  {
    id: 'tf-magic-item-ownership',
    name: 'Ownership, Binding & Transfer',
    type: 'longText',
    prompt: 'Bonding mechanics: consent requirements, inheritance rules, theft protections, transfer protocols, ownership disputes'
  },
  {
    id: 'tf-magic-item-legality',
    name: 'Legality & Social Standing',
    type: 'select',
    options: ['Outlawed', 'Restricted/License', 'Regulated/Permitted', 'State-Monopolized', 'Unregulated', 'Sacred/Taboo', 'Unknown'],
    prompt: 'Legal status and social perception of this type of magical item'
  }
];

// Core Event Template - Available to all worlds
const eventFields: TemplateField[] = [
  {
    id: 'tf-event-name',
    name: 'Event Name',
    type: 'shortText',
    prompt: 'Enter the event\'s name or designation',
    required: true
  },
  {
    id: 'tf-event-summary',
    name: 'One-Line Summary',
    type: 'shortText',
    prompt: 'What defines this event at a glance',
    required: true
  },
  {
    id: 'tf-event-type',
    name: 'Event Type',
    type: 'select',
    options: ['Accident', 'Natural Phenomenon', 'Disaster', 'Outbreak/Plague', 'Discovery/Innovation', 'Ritual/Ceremony', 'Crime/Heist', 'Uprising/Revolt', 'Battle/Skirmish', 'Invasion', 'Negotiation/Treaty', 'Expedition', 'Festival/Fair', 'Political Action', 'Other'],
    prompt: 'Primary classification of this event',
    required: true
  },
  {
    id: 'tf-event-timeframe',
    name: 'Timeframe & Duration',
    type: 'shortText',
    prompt: 'Date/time window, duration, and recurrence pattern (if applicable)'
  },
  {
    id: 'tf-event-location',
    name: 'Location Context',
    type: 'shortText',
    prompt: 'Environmental or regional role in the event (no specific location names)'
  },
  {
    id: 'tf-event-risk',
    name: 'Risk / Intensity Level',
    type: 'select',
    options: ['Low', 'Moderate', 'High', 'Extreme', 'Catastrophic'],
    prompt: 'Overall danger and intensity level of the event'
  },
  {
    id: 'tf-event-triggers',
    name: 'Triggers & Root Causes',
    type: 'longText',
    prompt: 'Immediate spark that started the event and underlying pressures or conditions that led to it'
  },
  {
    id: 'tf-event-stakes',
    name: 'Goals & Stakes',
    type: 'longText',
    prompt: 'What each side/faction wants to achieve; what is at risk or could be gained/lost'
  },
  {
    id: 'tf-event-participants',
    name: 'Participants (Roles Only)',
    type: 'longText',
    prompt: 'Key participant roles: instigators, authorities, bystanders, victims, opposing factions (describe roles, not specific names)'
  },
  {
    id: 'tf-event-phases',
    name: 'Phases / Timeline Beats',
    type: 'longText',
    prompt: 'Event progression: setup → inciting incident → escalation → climax → resolution phases'
  },
  {
    id: 'tf-event-actions',
    name: 'Key Actions & Turning Points',
    type: 'longText',
    prompt: 'Critical decisions, dramatic reversals, major reveals, and pivotal moments that shaped the event'
  },
  {
    id: 'tf-event-constraints',
    name: 'Constraints & Conditions',
    type: 'longText',
    prompt: 'Limiting factors: weather, terrain, laws, technology/magic limitations, social taboos, resource scarcity'
  },
  {
    id: 'tf-event-outcomes',
    name: 'Outcomes & Consequences',
    type: 'longText',
    prompt: 'Immediate results and longer-term effects on people, places, politics, and ongoing situations'
  },
  {
    id: 'tf-event-narrative',
    name: 'Public Narrative & Perception',
    type: 'longText',
    prompt: 'Official story, public rumors, media coverage, chronicle tone, and how different groups perceive the event'
  },
  {
    id: 'tf-event-secrets',
    name: 'Secrets & GM Notes',
    type: 'longText',
    prompt: 'Hidden information: concealed agendas, planted evidence, cover-ups, reveal triggers (GM only)'
  }
];

// Core Recipe Template - Available to all worlds
const recipeFields: TemplateField[] = [
  {
    id: 'tf-recipe-name',
    name: 'Recipe Name',
    type: 'shortText',
    prompt: 'Enter the recipe or formula name',
    required: true
  },
  {
    id: 'tf-recipe-purpose',
    name: 'One-Line Purpose',
    type: 'shortText',
    prompt: 'What this recipe produces or achieves',
    required: true
  },
  {
    id: 'tf-recipe-domain',
    name: 'Recipe Domain',
    type: 'select',
    options: ['Culinary', 'Crafting', 'Alchemical', 'Pharmaceutical', 'Ritual/Arcane', 'Technological', 'Other'],
    prompt: 'Primary domain or discipline for this recipe',
    required: true
  },
  {
    id: 'tf-recipe-category',
    name: 'Category / Type',
    type: 'shortText',
    prompt: 'Dish/item style or classification (e.g., stew, solvent, widget, enchantment)'
  },
  {
    id: 'tf-recipe-complexity',
    name: 'Complexity Level',
    type: 'select',
    options: ['Simple', 'Moderate', 'Complex', 'Masterwork'],
    prompt: 'Skill level required to execute this recipe successfully'
  },
  {
    id: 'tf-recipe-yield',
    name: 'Yield & Units',
    type: 'shortText',
    prompt: 'Quantity produced: servings, size, batch amount, or output units'
  },
  {
    id: 'tf-recipe-ingredients',
    name: 'Inputs / Ingredients',
    type: 'longText',
    prompt: 'List of required materials (format: qty unit — material (notes)). Include quality grades, alternatives, sourcing notes'
  },
  {
    id: 'tf-recipe-tools',
    name: 'Tools / Equipment / Stations',
    type: 'multiSelect',
    options: ['Knife', 'Kiln', 'Still', 'Forge', 'Clean Bench', 'Ritual Circle', 'Cauldron', 'Mortar & Pestle', 'Precision Scale', 'Furnace', 'Workshop', 'Laboratory', 'Kitchen', 'Enchanting Table', 'Loom'],
    prompt: 'Required tools, equipment, and work stations'
  },
  {
    id: 'tf-recipe-preconditions',
    name: 'Preconditions & Environment',
    type: 'longText',
    prompt: 'Environmental requirements: temperature, pressure, humidity, cleanliness standards, ritual conditions, magical field requirements'
  },
  {
    id: 'tf-recipe-procedure',
    name: 'Procedure / Steps',
    type: 'longText',
    prompt: 'Numbered, step-by-step instructions. Be concise but complete, including critical technique notes'
  },
  {
    id: 'tf-recipe-timing',
    name: 'Timing & Schedule',
    type: 'shortText',
    prompt: 'Time breakdown: prep time, active work, resting/fermentation/curing, total duration'
  },
  {
    id: 'tf-recipe-safety',
    name: 'Safety & Hazards',
    type: 'longText',
    prompt: 'Safety precautions: required PPE, fire/toxicity/contamination risks, first-aid procedures, emergency protocols'
  },
  {
    id: 'tf-recipe-quality',
    name: 'Quality Criteria & Tests',
    type: 'longText',
    prompt: 'How to determine success: doneness indicators, endpoint tests, quality control checks, sensory cues'
  },
  {
    id: 'tf-recipe-variations',
    name: 'Variations, Substitutions & Scaling',
    type: 'longText',
    prompt: 'Ingredient substitutions, scaling up/down procedures, environmental/seasonal adaptations, common modifications'
  },
  {
    id: 'tf-recipe-storage',
    name: 'Storage, Packaging & Shelf Life',
    type: 'longText',
    prompt: 'Proper storage containers, temperature requirements, stability duration, labeling needs, preservation methods'
  }
];

// Core Illness Template - Available to all worlds
const illnessFields: TemplateField[] = [
  {
    id: 'tf-illness-name',
    name: 'Illness Name',
    type: 'shortText',
    prompt: 'Enter the illness, disease, or condition name',
    required: true
  },
  {
    id: 'tf-illness-description',
    name: 'One-Line Description',
    type: 'shortText',
    prompt: 'What defines this illness at a glance',
    required: true
  },
  {
    id: 'tf-illness-etiology',
    name: 'Etiology Type',
    type: 'select',
    options: ['Viral', 'Bacterial', 'Fungal', 'Parasitic', 'Prion', 'Toxic Exposure', 'Autoimmune', 'Genetic/Hereditary', 'Degenerative', 'Neurological', 'Psychogenic', 'Radiation', 'Anomalous/Supernatural', 'Unknown'],
    prompt: 'Primary cause or origin category of the illness',
    required: true
  },
  {
    id: 'tf-illness-transmission',
    name: 'Vector / Transmission Modes',
    type: 'multiSelect',
    options: ['Airborne', 'Droplet', 'Direct Contact', 'Fomite', 'Bloodborne', 'Sexual', 'Waterborne', 'Foodborne', 'Vector-borne (Insect/Animal)', 'Vertical (Parent→Child)', 'Environmental/Spore', 'Iatrogenic', 'Magical/Anomalous'],
    prompt: 'How the illness spreads or is acquired'
  },
  {
    id: 'tf-illness-incubation',
    name: 'Incubation & Onset',
    type: 'shortText',
    prompt: 'Time from exposure to first symptoms; typical onset pattern (sudden, gradual, etc.)'
  },
  {
    id: 'tf-illness-symptoms',
    name: 'Symptoms & Signs',
    type: 'longText',
    prompt: 'Observable manifestations grouped by system: respiratory, gastrointestinal, neurological, dermal, systemic, behavioral'
  },
  {
    id: 'tf-illness-severity',
    name: 'Clinical Severity',
    type: 'select',
    options: ['Mild', 'Moderate', 'Severe', 'Critical'],
    prompt: 'Typical severity level and impact on affected individuals'
  },
  {
    id: 'tf-illness-progression',
    name: 'Progression & Stages',
    type: 'longText',
    prompt: 'Disease timeline: phases, progression patterns, tipping points, recovery/deterioration stages'
  },
  {
    id: 'tf-illness-contagious',
    name: 'Contagious Period & Shedding',
    type: 'shortText',
    prompt: 'When infectious; duration of contagiousness; asymptomatic transmission potential'
  },
  {
    id: 'tf-illness-transmissibility',
    name: 'Transmissibility Level',
    type: 'select',
    options: ['Low', 'Moderate', 'High', 'Very High'],
    prompt: 'How easily the illness spreads between individuals'
  },
  {
    id: 'tf-illness-diagnosis',
    name: 'Diagnosis & Detection',
    type: 'longText',
    prompt: 'Diagnostic criteria, observable clues, testing methods; false positive/negative considerations, differential diagnosis'
  },
  {
    id: 'tf-illness-countermeasures',
    name: 'Countermeasures (Treatment / Prophylaxis / Vaccination)',
    type: 'longText',
    prompt: 'Available treatments: supportive care, medications/antidotes, prophylaxis options, vaccination status and effectiveness'
  },
  {
    id: 'tf-illness-complications',
    name: 'Complications & Sequelae',
    type: 'longText',
    prompt: 'Acute complications and crises; long-term effects and chronic sequelae; mortality and morbidity patterns'
  },
  {
    id: 'tf-illness-vulnerable',
    name: 'Vulnerable Populations & Risk Factors',
    type: 'longText',
    prompt: 'High-risk demographics: age groups, comorbidities, exposure patterns, environmental/occupational factors, genetic predisposition'
  },
  {
    id: 'tf-illness-containment',
    name: 'Public Health Measures & Containment',
    type: 'longText',
    prompt: 'Containment strategies: isolation/quarantine protocols, PPE requirements, disinfection, ventilation, travel/work restrictions, contact tracing'
  }
];

// Core Character Template - Available to all worlds
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
    name: 'Personality Traits',
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

// Core Location Template - Available to all worlds
const locationFields: TemplateField[] = [
  {
    id: 'tf-loc-name',
    name: 'Location Name',
    type: 'shortText',
    prompt: 'Enter the location\'s name',
    required: true
  },
  {
    id: 'tf-loc-description',
    name: 'One-Line Description',
    type: 'shortText',
    prompt: 'What makes this location distinct and memorable',
    required: true
  },
  {
    id: 'tf-loc-category',
    name: 'Category / Type',
    type: 'select',
    options: ['Natural Feature', 'Settlement', 'District/Neighborhood', 'Structure', 'Facility/Outpost', 'Ruin', 'Wilderness Site', 'Other'],
    prompt: 'Select the location\'s primary category',
    required: true
  },
  {
    id: 'tf-loc-context',
    name: 'Setting Context',
    type: 'multiSelect',
    options: ['Coastal', 'Mountain', 'Underground', 'Urban', 'Rural', 'Underwater', 'Skyborne', 'Subterranean', 'Forest', 'Desert', 'Plains', 'Island'],
    prompt: 'Select environmental and geographical context tags'
  },
  {
    id: 'tf-loc-climate',
    name: 'Climate & Biome Snapshot',
    type: 'multiSelect',
    options: ['Temperate', 'Arid', 'Tropical', 'Alpine', 'Swamp', 'Taiga', 'Tundra', 'Steppe', 'Oceanic', 'Mediterranean', 'Continental', 'Volcanic'],
    prompt: 'Select climate and biome characteristics'
  },
  {
    id: 'tf-loc-population',
    name: 'Population / Usage Feel',
    type: 'select',
    options: ['Abandoned', 'Sparse', 'Quiet', 'Lively', 'Bustling', 'Overcrowded', 'Seasonal'],
    prompt: 'How populated or active does this location feel?'
  },
  {
    id: 'tf-loc-atmosphere',
    name: 'Atmosphere & Mood',
    type: 'multiSelect',
    options: ['Serene', 'Ominous', 'Festive', 'Gritty', 'Sacred', 'Haunted', 'Lawless', 'Orderly', 'Melancholic', 'Vibrant', 'Mysterious', 'Welcoming', 'Hostile', 'Ancient'],
    prompt: 'Select atmospheric and emotional qualities'
  },
  {
    id: 'tf-loc-safety',
    name: 'Safety Level',
    type: 'select',
    options: ['Very Safe', 'Safe', 'Uncertain', 'Risky', 'Dangerous', 'Lethal'],
    prompt: 'Overall safety level for typical visitors'
  },
  {
    id: 'tf-loc-law',
    name: 'Law & Order Presence',
    type: 'select',
    options: ['None', 'Minimal/Community', 'Local Authority', 'Regional Authority', 'Military/Authoritarian', 'Corporate/Private'],
    prompt: 'Level and type of governance or law enforcement'
  },
  {
    id: 'tf-loc-hazards',
    name: 'Hazards & Risks',
    type: 'multiSelect',
    options: ['Predators', 'Banditry', 'Toxic Air', 'Contagion', 'Unstable Terrain', 'Storms', 'Supernatural Anomalies', 'Radiation', 'Extreme Weather', 'Magical Instability', 'Political Tension', 'Economic Collapse'],
    prompt: 'Select potential dangers and environmental hazards'
  },
  {
    id: 'tf-loc-access',
    name: 'Access & Travel',
    type: 'longText',
    prompt: 'Routes in/out, travel conditions, typical travel times, checkpoints, transportation methods'
  },
  {
    id: 'tf-loc-economy',
    name: 'Resources & Economy Snapshot',
    type: 'longText',
    prompt: 'What\'s produced/valued; trade drivers; scarcity/abundance; economic activities'
  },
  {
    id: 'tf-loc-services',
    name: 'Services & Amenities',
    type: 'multiSelect',
    options: ['Lodging', 'Market', 'Healer', 'Workshop', 'Transport', 'Shrine', 'Water Source', 'Safehouse', 'Library', 'Training Facility', 'Entertainment', 'Banking', 'Communication Hub', 'Repair Services'],
    prompt: 'Select available services and facilities'
  },
  {
    id: 'tf-loc-points-of-interest',
    name: 'Points of Interest',
    type: 'longText',
    prompt: 'Notable features, landmarks, districts, or areas within the location (bullet list format recommended)'
  },
  {
    id: 'tf-loc-secrets',
    name: 'Secrets & GM Notes',
    type: 'longText',
    prompt: 'Private field for hidden dangers, secret agendas, plot hooks, and reveal triggers'
  }
];

// Core Object Template - Available to all worlds
const objectFields: TemplateField[] = [
  {
    id: 'tf-obj-name',
    name: 'Object Name',
    type: 'shortText',
    prompt: 'Enter the object\'s name',
    required: true
  },
  {
    id: 'tf-obj-description',
    name: 'One-Line Description',
    type: 'shortText',
    prompt: 'What makes this object distinct and memorable',
    required: true
  },
  {
    id: 'tf-obj-category',
    name: 'Category / Type',
    type: 'select',
    options: ['Tool', 'Weapon', 'Apparel', 'Accessory', 'Container', 'Furniture', 'Vehicle', 'Device', 'Artifact', 'Consumable', 'Document', 'Currency', 'Instrument', 'Relic', 'Resource', 'Other'],
    prompt: 'Select the object\'s primary category',
    required: true
  },
  {
    id: 'tf-obj-size',
    name: 'Size & Portability',
    type: 'select',
    options: ['Pocketable', 'Handheld', 'Packable', 'Bulky/Two-Handed', 'Stationary/Installed'],
    prompt: 'How large and portable is this object?'
  },
  {
    id: 'tf-obj-materials',
    name: 'Materials & Construction',
    type: 'multiSelect',
    options: ['Iron', 'Steel', 'Bronze', 'Silver', 'Gold', 'Hardwood', 'Softwood', 'Silk', 'Cotton', 'Leather', 'Bone', 'Stone', 'Crystal', 'Glass', 'Ceramic', 'Composite', 'Plastic', 'Fabric', 'Rope', 'Parchment', 'Paper'],
    prompt: 'Select materials used in construction'
  },
  {
    id: 'tf-obj-quality',
    name: 'Craftsmanship / Quality',
    type: 'select',
    options: ['Crude', 'Common', 'Fine', 'Masterwork', 'Exotic'],
    prompt: 'Overall quality and craftsmanship level'
  },
  {
    id: 'tf-obj-condition',
    name: 'Condition',
    type: 'select',
    options: ['Pristine', 'Good', 'Worn', 'Damaged', 'Ruined'],
    prompt: 'Current physical condition'
  },
  {
    id: 'tf-obj-origin',
    name: 'Era / Origin',
    type: 'shortText',
    prompt: 'Culture/period or maker tradition (keep generic)'
  },
  {
    id: 'tf-obj-functions',
    name: 'Primary Function(s)',
    type: 'multiSelect',
    options: ['Tool', 'Adornment', 'Storage', 'Signaling', 'Navigation', 'Combat', 'Protection', 'Lighting', 'Communication', 'Measurement', 'Transportation', 'Entertainment', 'Ritual', 'Utility', 'Display', 'Recording'],
    prompt: 'Select primary functions and uses'
  },
  {
    id: 'tf-obj-features',
    name: 'Distinctive Features',
    type: 'multiSelect',
    options: ['Engraving', 'Hallmark', 'Serial Number', 'Inlay', 'Patina', 'Emblem', 'Inscription', 'Gemstones', 'Filigree', 'Weathering', 'Battle Damage', 'Maker\'s Mark', 'Custom Modification', 'Worn Handles'],
    prompt: 'Select notable distinctive features'
  },
  {
    id: 'tf-obj-operation',
    name: 'Operation / Usage Procedure',
    type: 'longText',
    prompt: 'How it\'s used; operating procedures; safety steps; special techniques'
  },
  {
    id: 'tf-obj-capabilities',
    name: 'Capabilities & Limits',
    type: 'longText',
    prompt: 'What it can and can\'t do; range, capacity, limitations, durability'
  },
  {
    id: 'tf-obj-power',
    name: 'Power Source (if any)',
    type: 'select',
    options: ['None/Manual', 'Mechanical', 'Chemical', 'Electrical', 'Biological', 'Arcane', 'Psionic', 'Solar', 'Thermal', 'Other'],
    prompt: 'What powers this object (if applicable)?'
  },
  {
    id: 'tf-obj-value',
    name: 'Value & Rarity',
    type: 'longText',
    prompt: 'Perceived worth, trade value, scarcity descriptors, market considerations'
  },
  {
    id: 'tf-obj-secrets',
    name: 'Secrets & GM Notes',
    type: 'longText',
    prompt: 'Private field for hidden functions, twists, reveal triggers, and GM-only information'
  }
];

// Core Organization Template - Available to all worlds
const organizationFields: TemplateField[] = [
  {
    id: 'tf-org-name',
    name: 'Organization Name',
    type: 'shortText',
    prompt: 'Enter the organization\'s name',
    required: true
  },
  {
    id: 'tf-org-summary',
    name: 'One-Line Summary',
    type: 'shortText',
    prompt: 'What this organization does at a glance',
    required: true
  },
  {
    id: 'tf-org-type',
    name: 'Organization Type',
    type: 'select',
    options: ['Guild', 'Clan', 'Government Agency', 'Religious Order', 'Academic', 'Mercantile', 'Criminal Syndicate', 'Paramilitary', 'Cult', 'Mutual Aid', 'Corporation', 'Union', 'Secret Society', 'Explorer Society', 'Research Lab', 'Other'],
    prompt: 'Select the organization\'s primary type',
    required: true
  },
  {
    id: 'tf-org-purpose',
    name: 'Purpose / Mandate',
    type: 'longText',
    prompt: 'Mission, raison d\'être'
  },
  {
    id: 'tf-org-scope',
    name: 'Scope & Reach',
    type: 'select',
    options: ['Local', 'Regional', 'Continental', 'Planetary', 'Multi-world/Planar', 'Galactic'],
    prompt: 'Geographic or dimensional scope of operations'
  },
  {
    id: 'tf-org-governance',
    name: 'Governance Model',
    type: 'select',
    options: ['Autocrat', 'Council', 'Democratic', 'Theocratic', 'Corporate', 'Meritocratic', 'Distributed/Cell'],
    prompt: 'How the organization is structured and governed'
  },
  {
    id: 'tf-org-transparency',
    name: 'Transparency / Secrecy Level',
    type: 'select',
    options: ['Open', 'Opaque', 'Front Organization', 'Clandestine', 'Cell-Structured'],
    prompt: 'How public or secretive the organization operates'
  },
  {
    id: 'tf-org-methods',
    name: 'Operating Methods',
    type: 'multiSelect',
    options: ['Diplomacy', 'Propaganda', 'Espionage', 'Trade', 'Legal Action', 'Violence', 'Research', 'Charity', 'Smuggling', 'Sabotage'],
    prompt: 'Select primary methods of operation'
  },
  {
    id: 'tf-org-legal',
    name: 'Legal Status / Legitimacy',
    type: 'select',
    options: ['Outlawed', 'Illicit but Tolerated', 'Gray-Area', 'Licensed', 'State-Sanctioned', 'Sovereign'],
    prompt: 'Legal standing and legitimacy status'
  },
  {
    id: 'tf-org-influence',
    name: 'Spheres of Influence',
    type: 'multiSelect',
    options: ['politics', 'trade', 'academia', 'religion', 'underworld', 'media', 'military', 'magic/tech'],
    prompt: 'Select areas where the organization has influence'
  },
  {
    id: 'tf-org-resources',
    name: 'Resources & Assets',
    type: 'longText',
    prompt: 'Funding, equipment, facilities, leverage'
  },
  {
    id: 'tf-org-membership',
    name: 'Membership Profile & Requirements',
    type: 'longText',
    prompt: 'Who joins, criteria, obligations, benefits'
  },
  {
    id: 'tf-org-culture',
    name: 'Culture & Practices',
    type: 'longText',
    prompt: 'Ethos, rituals, codes of conduct'
  },
  {
    id: 'tf-org-risk',
    name: 'Risk Posture',
    type: 'select',
    options: ['Cautious', 'Calculated', 'Aggressive', 'Reckless'],
    prompt: 'How willing the organization is to take risks'
  },
  {
    id: 'tf-org-secrets',
    name: 'Secrets & GM Notes',
    type: 'longText',
    prompt: 'Hidden agendas, internal fractures, reveal triggers (GM only)'
  }
];

// Core Culture Template - Available to all worlds
const cultureFields: TemplateField[] = [
  {
    id: 'tf-cult-name',
    name: 'Culture Name',
    type: 'shortText',
    prompt: 'Enter the culture\'s name',
    required: true
  },
  {
    id: 'tf-cult-identity',
    name: 'One-Line Identity',
    type: 'shortText',
    prompt: 'What defines them at a glance',
    required: true
  },
  {
    id: 'tf-cult-values',
    name: 'Core Values & Virtues',
    type: 'multiSelect',
    options: ['Honor', 'Hospitality', 'Thrift', 'Ingenuity', 'Loyalty', 'Independence', 'Wisdom', 'Courage', 'Compassion', 'Justice', 'Order', 'Freedom', 'Tradition', 'Innovation', 'Strength', 'Harmony', 'Prosperity', 'Knowledge', 'Spirituality', 'Community', 'Family', 'Achievement', 'Modesty', 'Pragmatism'],
    prompt: 'Select core cultural values and virtues'
  },
  {
    id: 'tf-cult-social-structure',
    name: 'Social Structure',
    type: 'longText',
    prompt: 'Describe social strata, roles, mobility patterns, and kinship ties'
  },
  {
    id: 'tf-cult-family-pattern',
    name: 'Family & Kinship Pattern',
    type: 'select',
    options: ['Nuclear', 'Extended', 'Clan/Lineage', 'Nomadic Band', 'Communal/Co-op', 'Guild/Household', 'Other'],
    prompt: 'Select the primary family and kinship structure',
    required: true
  },
  {
    id: 'tf-cult-role-expectations',
    name: 'Role Expectations & Labor Division',
    type: 'longText',
    prompt: 'Describe role expectations based on age, experience, vocation (avoid mechanical stats)'
  },
  {
    id: 'tf-cult-customs-taboos',
    name: 'Customs & Taboos',
    type: 'longText',
    prompt: 'Cultural do\'s and don\'ts; what is considered sacred versus profane'
  },
  {
    id: 'tf-cult-etiquette',
    name: 'Etiquette & Social Norms',
    type: 'multiSelect',
    options: ['Formal Greetings', 'Casual Greetings', 'Direct Eye Contact', 'Avoided Eye Contact', 'Physical Touch Welcome', 'Touch Avoided', 'Punctuality Valued', 'Flexible Time', 'Guest Hospitality', 'Privacy Respected', 'Hierarchy Respect', 'Egalitarian Approach', 'Gift Giving', 'Reciprocity Expected'],
    prompt: 'Select social norms around greetings, eye contact, touch, punctuality, hospitality'
  },
  {
    id: 'tf-cult-belief-orientation',
    name: 'Belief Orientation (Religion/Philosophy Presence)',
    type: 'select',
    options: ['Secular', 'Plural/Low', 'Moderate', 'Pervasive/Theocratic'],
    prompt: 'How prominent is religious or philosophical belief in daily life?',
    required: true
  },
  {
    id: 'tf-cult-economy',
    name: 'Economy & Livelihoods',
    type: 'longText',
    prompt: 'Typical work patterns, trade norms, and views on property and wealth'
  },
  {
    id: 'tf-cult-tech-magic-attitude',
    name: 'Attitude to Technology/Magic',
    type: 'select',
    options: ['Embracing', 'Pragmatic', 'Cautious', 'Restrictive', 'Taboo', 'Sacred/Initiatory'],
    prompt: 'How does the culture view and interact with technology or magic?',
    required: true
  },
  {
    id: 'tf-cult-arts-aesthetics',
    name: 'Arts & Aesthetic Motifs',
    type: 'longText',
    prompt: 'Describe architectural styles, music, crafts, preferred colors, symbols, and artistic traditions'
  },
  {
    id: 'tf-cult-justice',
    name: 'Justice & Conflict Resolution',
    type: 'longText',
    prompt: 'Legal ideals, mediation practices, dueling customs, compensation systems'
  },
  {
    id: 'tf-cult-festivals-rites',
    name: 'Festivals & Rites of Passage',
    type: 'longText',
    prompt: 'Seasonal celebrations, coming-of-age ceremonies, mourning practices, and other cultural rituals'
  },
  {
    id: 'tf-cult-contradictions',
    name: 'Contradictions & Fault Lines (GM Notes)',
    type: 'longText',
    prompt: 'Private field: internal tensions, cultural hypocrisies, pressure points, and sources of conflict'
  }
];

/**
 * Creates core templates for a new world
 * These templates are automatically available to all users
 */
export function createCoreTemplates(worldId: string, coreFolder?: string): Omit<Template, 'id'>[] {
  return [
    {
      worldId,
      name: 'Character',
      folderId: coreFolder,
      fields: characterFields
    },
    {
      worldId,
      name: 'Location',
      folderId: coreFolder,
      fields: locationFields
    },
    {
      worldId,
      name: 'Object',
      folderId: coreFolder,
      fields: objectFields
    },
    {
      worldId,
      name: 'Organization',
      folderId: coreFolder,
      fields: organizationFields
    },
    {
      worldId,
      name: 'Culture',
      folderId: coreFolder,
      fields: cultureFields
    },
    {
      worldId,
      name: 'Species',
      folderId: coreFolder,
      fields: speciesFields
    },
    {
      worldId,
      name: 'Religion/Philosophy',
      folderId: coreFolder,
      fields: religionFields
    },
    {
      worldId,
      name: 'Government & Law',
      folderId: coreFolder,
      fields: governmentFields
    },
    {
      worldId,
      name: 'Power System',
      folderId: coreFolder,
      fields: powerSystemFields
    },
    {
      worldId,
      name: 'Economy & Trade',
      folderId: coreFolder,
      fields: economyFields
    },
    {
      worldId,
      name: 'Creature (Fauna)',
      folderId: coreFolder,
      fields: creatureFields
    },
    {
      worldId,
      name: 'Plant/Fungi',
      folderId: coreFolder,
      fields: plantFields
    },
    {
      worldId,
      name: 'Material/Resource',
      folderId: coreFolder,
      fields: materialFields
    },
    {
      worldId,
      name: 'Monster',
      folderId: coreFolder,
      fields: monsterFields
    },
    {
      worldId,
      name: 'Magic Item',
      folderId: coreFolder,
      fields: magicItemFields
    },
    {
      worldId,
      name: 'Event',
      folderId: coreFolder,
      fields: eventFields
    },
    {
      worldId,
      name: 'Recipe',
      folderId: coreFolder,
      fields: recipeFields
    },
    {
      worldId,
      name: 'Illness',
      folderId: coreFolder,
      fields: illnessFields
    }
    // Additional core templates will be added here in future updates
  ];
}

/**
 * Core template names for reference
 */
export const CORE_TEMPLATE_NAMES = {
  CHARACTER: 'Character',
  LOCATION: 'Location',
  OBJECT: 'Object',
  ORGANIZATION: 'Organization',
  CULTURE: 'Culture',
  SPECIES: 'Species',
  RELIGION: 'Religion/Philosophy',
  GOVERNMENT: 'Government & Law',
  POWER_SYSTEM: 'Power System',
  ECONOMY: 'Economy & Trade',
  CREATURE: 'Creature (Fauna)',
  PLANT: 'Plant/Fungi',
  MATERIAL: 'Material/Resource',
  MONSTER: 'Monster',
  MAGIC_ITEM: 'Magic Item',
  EVENT: 'Event',
  RECIPE: 'Recipe',
  ILLNESS: 'Illness'
} as const;
