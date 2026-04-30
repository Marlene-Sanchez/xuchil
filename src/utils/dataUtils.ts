// src/utils/dataUtils.ts

import { 
  RawTaskData, 
  TransformedTaskData, 
  GroupedTaskCategory 
} from '@/types/TaskTime';

/**
 * Calculate median from sorted array
 */
const calculateMedian = (sortedArray: number[]): number => {
  if (sortedArray.length === 0) return 0;
  
  const mid = Math.floor(sortedArray.length / 2);
  
  if (sortedArray.length % 2 === 0) {
    return (sortedArray[mid - 1] + sortedArray[mid]) / 2;
  } else {
    return sortedArray[mid];
  }
};

/**
 * Transform raw task data to chart format
 */
export const transformTaskDataForChart = (tasks: RawTaskData[]): TransformedTaskData[] => {
  return tasks.map(task => {
    const times = task.times || [];
    const previousTimes = task.previousTimes || [];
    
    if (times.length === 0) {
      return {
        taskName: task.taskName,
        min: 0,
        median: 0,
        max: 0,
        previousMedian: 0
      };
    }
    
    const sorted = [...times].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = calculateMedian(sorted);

    let previousMedian = 0;
    if (previousTimes.length > 0) {
      const sortedPrevious = [...previousTimes].sort((a, b) => a - b);
      previousMedian = calculateMedian(sortedPrevious);
    }
    
    return {
      taskName: task.taskName,
      min,
      median,
      max,
      previousMedian
    };
  });
};

/**
 * Group tasks by category
 */
export const groupTasksByCategory = (tasks: RawTaskData[]): GroupedTaskCategory[] => {
  const grouped = new Map<string, RawTaskData[]>();
  
  tasks.forEach(task => {
    const category = task.category;
    const existing = grouped.get(category) || [];
    grouped.set(category, [...existing, task]);
  });
  
  return Array.from(grouped.entries()).map(([category, categoryTasks]) => ({
    category,
    tasks: transformTaskDataForChart(categoryTasks)
  }));
};

/**
 * Generate mock data for testing
 */
export const generateMockTaskData = (): RawTaskData[] => {
  return [
    {
      taskName: "Harina",
      category: "Harina",
      times: [5, 6, 7, 8, 9, 6, 7, 8, 7, 6, 8, 9], // 5-9 min
      previousTimes: [4, 5, 6, 7, 8, 5, 6, 7, 6, 5, 7, 8],
      id: "1"
    },
    {
      taskName: "Galletas",
      category: "Galletas", 
      times: [8, 10, 12, 9, 11, 13, 10, 12, 11, 9, 10, 12], // 8-13 min
      previousTimes: [7, 9, 9, 10, 15, 5, 6, 7, 6, 5, 7, 8],
      id: "2"
    },
    {
      taskName: "Frijol",
      category: "Frijol",
      times: [15, 18, 22, 25, 28, 20, 24, 26, 23, 21, 27, 30], // 15-30 min
      previousTimes: [21, 22, 25, 27, 33, 13, 17, 13, 11, 38, 28, 35],
      id: "3"
    },
    {
      taskName: "Sustituto de café",
      category: "Stustituto de café",
      times: [20, 25, 28, 30, 32, 26, 29, 31, 27, 28, 30, 33], // 20-33 min
      previousTimes: [21, 22, 25, 27, 33, 32, 22, 13, 18, 33, 30, 32],
      id: "4"
    }
  ];
};
