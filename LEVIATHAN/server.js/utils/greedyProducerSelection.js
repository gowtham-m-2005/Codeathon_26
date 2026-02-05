// Greedy capacity-aware producer selection (Knapsack-style)
const { haversineDistance } = require('./haversine');

/**
 * Greedy producer selection based on package_count/distance ratio
 * @param {Array} producers - [{producer_id, lat, lng, package_count}]
 * @param {Object} containerLocation - {lat, lng}
 * @param {Number} availableSections - available capacity
 * @returns {Array} selected producer IDs
 */
function greedyProducerSelection(producers, containerLocation, availableSections) {
  // Calculate efficiency score for each producer
  const scoredProducers = producers.map(p => {
    const distance = haversineDistance(
      containerLocation.lat,
      containerLocation.lng,
      p.lat,
      p.lng
    );
    
    // Efficiency: package_count / distance (higher is better)
    const efficiency = distance > 0 ? p.package_count / distance : p.package_count * 1000;
    
    return {
      producer_id: p.producer_id,
      package_count: p.package_count,
      required_sections: p.required_sections || p.package_count, // assume 1 section per package if not specified
      distance,
      efficiency
    };
  });
  
  // Sort by efficiency (descending)
  scoredProducers.sort((a, b) => b.efficiency - a.efficiency);
  
  // Greedy selection until capacity exhausted
  const selected = [];
  let usedSections = 0;
  
  for (let producer of scoredProducers) {
    if (usedSections + producer.required_sections <= availableSections) {
      selected.push(producer.producer_id);
      usedSections += producer.required_sections;
    }
    
    if (usedSections >= availableSections) break;
  }
  
  return selected;
}

module.exports = { greedyProducerSelection };
