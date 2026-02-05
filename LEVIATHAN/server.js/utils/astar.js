// A* algorithm for faster route planning with heuristic
const { haversineDistance } = require('./haversine');

class PriorityQueue {
  constructor() {
    this.values = [];
  }

  enqueue(val, priority) {
    this.values.push({ val, priority });
    this.sort();
  }

  dequeue() {
    return this.values.shift();
  }

  sort() {
    this.values.sort((a, b) => a.priority - b.priority);
  }

  isEmpty() {
    return this.values.length === 0;
  }
}

/**
 * A* algorithm - faster with heuristic
 * @param {Object} graph - adjacency list {nodeId: [{node, weight}, ...]}
 * @param {Number} start - starting node ID
 * @param {Number} end - ending node ID
 * @param {Object} nodeCoords - {nodeId: {lat, lng}}
 * @returns {Object} {distance, path: [nodeIds]}
 */
function aStar(graph, start, end, nodeCoords) {
  const gScore = {}; // actual cost from start
  const fScore = {}; // estimated total cost (g + h)
  const previous = {};
  const pq = new PriorityQueue();
  
  // Initialize
  for (let node in graph) {
    gScore[node] = node == start ? 0 : Infinity;
    fScore[node] = node == start ? heuristic(start, end, nodeCoords) : Infinity;
    previous[node] = null;
  }
  
  pq.enqueue(start, fScore[start]);
  
  while (!pq.isEmpty()) {
    const { val: currentNode } = pq.dequeue();
    
    if (currentNode == end) {
      // Build path
      const path = [];
      let current = end;
      while (current !== null) {
        path.unshift(parseInt(current));
        current = previous[current];
      }
      return { distance: gScore[end], path };
    }
    
    if (!graph[currentNode]) continue;
    
    for (let neighbor of graph[currentNode]) {
      const tentativeG = gScore[currentNode] + neighbor.weight;
      
      if (tentativeG < gScore[neighbor.node]) {
        previous[neighbor.node] = currentNode;
        gScore[neighbor.node] = tentativeG;
        fScore[neighbor.node] = tentativeG + heuristic(neighbor.node, end, nodeCoords);
        pq.enqueue(neighbor.node, fScore[neighbor.node]);
      }
    }
  }
  
  return { distance: Infinity, path: [] };
}

function heuristic(nodeA, nodeB, nodeCoords) {
  if (!nodeCoords[nodeA] || !nodeCoords[nodeB]) return 0;
  // Use haversine distance as heuristic (in km)
  // Convert to approximate travel time (assume avg speed 40 km/h)
  const dist = haversineDistance(
    nodeCoords[nodeA].lat,
    nodeCoords[nodeA].lng,
    nodeCoords[nodeB].lat,
    nodeCoords[nodeB].lng
  );
  return (dist / 40) * 60; // Convert to minutes
}

module.exports = { aStar };
