-- Fix templates and add missing ones
INSERT INTO public.templates (name, description, icon, category, fields, is_system) VALUES
('Character', 'People, creatures, and sentient beings', 'user', 'Character', '[
  {"name": "name", "type": "text", "label": "Name", "required": true},
  {"name": "appearance", "type": "textarea", "label": "Appearance"},
  {"name": "personality", "type": "textarea", "label": "Personality"},
  {"name": "background", "type": "textarea", "label": "Background"},
  {"name": "goals", "type": "textarea", "label": "Goals & Motivations"},
  {"name": "skills", "type": "tags", "label": "Skills & Abilities"}
]', true),

('Location', 'Places, regions, and geographical areas', 'map-pin', 'Location', '[
  {"name": "name", "type": "text", "label": "Name", "required": true},
  {"name": "type", "type": "select", "label": "Location Type", "options": ["City", "Town", "Village", "Region", "Building", "Landmark"]},
  {"name": "description", "type": "textarea", "label": "Description"},
  {"name": "geography", "type": "textarea", "label": "Geography & Climate"},
  {"name": "population", "type": "text", "label": "Population"},
  {"name": "culture", "type": "textarea", "label": "Culture & Society"}
]', true),

('Object', 'Items, artifacts, and physical things', 'package', 'Object', '[
  {"name": "name", "type": "text", "label": "Name", "required": true},
  {"name": "type", "type": "select", "label": "Object Type", "options": ["Weapon", "Armor", "Tool", "Artifact", "Book", "Other"]},
  {"name": "description", "type": "textarea", "label": "Description"},
  {"name": "properties", "type": "textarea", "label": "Properties & Abilities"},
  {"name": "history", "type": "textarea", "label": "History & Origin"},
  {"name": "rarity", "type": "select", "label": "Rarity", "options": ["Common", "Uncommon", "Rare", "Legendary"]}
]', true),

('Organization', 'Groups, factions, and institutions', 'users', 'Organization', '[
  {"name": "name", "type": "text", "label": "Name", "required": true},
  {"name": "type", "type": "select", "label": "Organization Type", "options": ["Government", "Military", "Religious", "Guild", "Company", "Secret Society"]},
  {"name": "description", "type": "textarea", "label": "Description"},
  {"name": "leadership", "type": "textarea", "label": "Leadership Structure"},
  {"name": "goals", "type": "textarea", "label": "Goals & Agenda"},
  {"name": "resources", "type": "textarea", "label": "Resources & Assets"}
]', true),

('Event', 'Historical events and occurrences', 'calendar', 'Event', '[
  {"name": "name", "type": "text", "label": "Event Name", "required": true},
  {"name": "date", "type": "text", "label": "Date/Time"},
  {"name": "description", "type": "textarea", "label": "Description"},
  {"name": "participants", "type": "textarea", "label": "Key Participants"},
  {"name": "consequences", "type": "textarea", "label": "Consequences"},
  {"name": "significance", "type": "textarea", "label": "Historical Significance"}
]', true),

('Species', 'Races and species in your world', 'dna', 'Species', '[
  {"name": "name", "type": "text", "label": "Species Name", "required": true},
  {"name": "appearance", "type": "textarea", "label": "Physical Appearance"},
  {"name": "traits", "type": "textarea", "label": "Notable Traits"},
  {"name": "culture", "type": "textarea", "label": "Culture & Society"},
  {"name": "habitat", "type": "textarea", "label": "Natural Habitat"},
  {"name": "abilities", "type": "textarea", "label": "Special Abilities"}
]', true),

('Religion', 'Belief systems and deities', 'star', 'Religion', '[
  {"name": "name", "type": "text", "label": "Religion Name", "required": true},
  {"name": "deity", "type": "text", "label": "Primary Deity/Deities"},
  {"name": "beliefs", "type": "textarea", "label": "Core Beliefs"},
  {"name": "practices", "type": "textarea", "label": "Practices & Rituals"},
  {"name": "followers", "type": "textarea", "label": "Followers & Clergy"},
  {"name": "influence", "type": "textarea", "label": "Influence & Power"}
]', true),

('Magic System', 'Magical systems and rules', 'sparkles', 'Magic', '[
  {"name": "name", "type": "text", "label": "System Name", "required": true},
  {"name": "source", "type": "text", "label": "Power Source"},
  {"name": "rules", "type": "textarea", "label": "Rules & Limitations"},
  {"name": "practitioners", "type": "textarea", "label": "Who Can Use It"},
  {"name": "effects", "type": "textarea", "label": "Possible Effects"},
  {"name": "cost", "type": "textarea", "label": "Cost & Consequences"}
]', true)
