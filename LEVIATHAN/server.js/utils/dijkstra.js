// Dijkstra's shortest path algorithm for guaranteed shortest travel time

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
 * Dijkstra's algorithm - guaranteed shortest path
 * @param {Object} graph - adjacency list {nodeId: [{node, weight}, ...]}
 * @param {Number} start - starting node ID
 * @param {Number} end - ending node ID
 * @returns {Object} {distance, path: [nodeIds]}
 */
function dijkstra(graph, start, end) {
  const distances = {};
  const previous = {};
  const pq = new PriorityQueue();
  
  // Initialize
  for (let node in graph) {
    distances[node] = node == start ? 0 : Infinity;
    previous[node] = null;
  }
  
  pq.enqueue(start, 0);
  
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
      return { distance: distances[end], path };
    }
    
    if (!graph[currentNode]) continue;
    
    for (let neighbor of graph[currentNode]) {
      const alt = distances[currentNode] + neighbor.weight;
      if (alt < distances[neighbor.node]) {
        distances[neighbor.node] = alt;
        previous[neighbor.node] = currentNode;
        pq.enqueue(neighbor.node, alt);
      }
    }
  }
  
  return { distance: Infinity, path: [] };
}

module.exports = { dijkstra };
