// Dynamic priority recalculation algorithm
const { haversineDistance } = require('./haversine');

/**
 * Calculate priority score for a task
 * Lower score = higher priority
 * 
 * priority = α*(deadline urgency) + β*(distance) + γ*(task_type)
 * 
 * @param {Object} task - {task_type, node_coords, deadline, package_urgency}
 * @param {Object} currentLocation - {lat, lng}
 * @param {Object} weights - {alpha, beta, gamma}
 * @returns {Number} priority score
 */
function calculatePriority(task, currentLocation, containerCapacity = {}, weights = {alpha: 0.5, beta: 0.3, gamma: 0.2}) {
  const { alpha, beta, gamma } = weights;
  
  // 1. Deadline urgency (0-1, higher = more urgent)
  let deadlineScore = 0;
  if (task.deadline) {
    const now = new Date();
    const deadline = new Date(task.deadline);
    const hoursRemaining = (deadline - now) / (1000 * 60 * 60);
    
    if (hoursRemaining < 0) deadlineScore = 1; // overdue
    else if (hoursRemaining < 2) deadlineScore = 0.9;
    else if (hoursRemaining < 6) deadlineScore = 0.7;
    else if (hoursRemaining < 24) deadlineScore = 0.5;
    else deadlineScore = 0.3;
  } else {
    deadlineScore = 0.5; // default medium urgency
  }
  
  // 2. Distance score (normalized to 0-1)
  let distanceScore = 0;
  if (currentLocation && task.node_coords) {
    const distance = haversineDistance(
      currentLocation.lat,
      currentLocation.lng,
      task.node_coords.lat,
      task.node_coords.lng
    );
    // Normalize: closer = lower score (better)
    distanceScore = Math.min(distance / 100, 1); // cap at 100km
  }
  
  // 3. Task type score - DYNAMIC based on container capacity
  const totalSections = containerCapacity.total_sections || 1;
  const usedSections = containerCapacity.used_sections || 0;
  const capacityRatio = usedSections / totalSections;
  
  let taskTypeScore = 0;
  if (capacityRatio >= 0.8) {
    // Container 80%+ full: PRIORITIZE DELIVERIES (lower score = higher priority)
    taskTypeScore = task.task_type === 'DELIVERY' ? 0.2 : 0.8;
  } else if (capacityRatio >= 0.5) {
    // Container 50-80% full: moderate preference for deliveries
    taskTypeScore = task.task_type === 'DELIVERY' ? 0.4 : 0.6;
  } else {
    // Container less than 50% full: prefer pickups
    taskTypeScore = task.task_type === 'PICKUP' ? 0.4 : 0.6;
  }
  
  // Final priority score (lower = more important)
  const priority = alpha * deadlineScore + beta * distanceScore + gamma * taskTypeScore;
  
  return priority;
}

/**
 * Recalculate priorities for all pending tasks in a route
 * @param {Array} tasks - array of task objects
 * @param {Object} currentLocation - {lat, lng}
 * @returns {Array} tasks sorted by priority (ascending)
 */
function recalculatePriorities(tasks, currentLocation, containerCapacity = {}) {
  const tasksWithPriority = tasks.map(task => {
    const priorityScore = calculatePriority(task, currentLocation, containerCapacity);
    return { ...task, priority_score: priorityScore };
  });
  
  // Sort by priority score (lower = higher priority)
  tasksWithPriority.sort((a, b) => a.priority_score - b.priority_score);
  
  // Assign new priority_order
  return tasksWithPriority.map((task, index) => ({
    ...task,
    priority_order: index + 1
  }));
}

module.exports = { calculatePriority, recalculatePriorities };
