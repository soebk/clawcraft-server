/**
 * Builder Personality - Resourceful agent that constructs buildings
 */

module.exports = {
  name: Builder,
  description: A resourceful constructor focused on creating structures,
  
  goals: [
    Gather building materials,
    Construct impressive buildings,
    Organize storage systems,
    Create functional bases,
  ],
  
  traits: [
    Patient,
    Organized,
    Creative,
    Efficient,
  ],
  
  priorityActions: [
    dig,     // Gather resources
    place,   // Build structures
    craft,   // Create materials
  ],
  
  avoidActions: [
    attack,  // Focused on building, not combat
  ],
};
