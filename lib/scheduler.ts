// Helper to parse "30 mins" or "1 hour" into numeric minutes
export const parseDurationInMinutes = (durationStr: string): number => {
  const num = parseInt(durationStr.match(/\d+/)?.at(0) || "30");
  if (durationStr.toLowerCase().includes("hour") || durationStr.toLowerCase().includes("hr")) {
    return num * 60;
  }
  return num;
};

// Helper to format Date into 12-hour string (e.g., 5:30 PM)
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

// Calculate a full schedule for an event's today_tasks
export const calculateEventSchedule = (event: any) => {
  if (!event.plan || !event.plan.today_tasks) return [];

  // Use the stored generatedAt as a persistent scheduling anchor
  // Fallback to Now only if it's a legacy plan without the timestamp
  let cumulativeTime = event.plan.generatedAt ? new Date(event.plan.generatedAt) : new Date();
  
  const completedIds = event.completedTasks || [];
  
  return event.plan.today_tasks.map((task: any, i: number) => {
    const taskId = `task-${event.id}-${i}`;
    const isCompleted = completedIds.includes(taskId);
    const duration = parseDurationInMinutes(task.estimated_time);
    
    // Logic: The first uncompleted task starts at current cumulativeTime.
    // Completed tasks are treated as "past" and don't push the current anchor forward.
    let startTime: Date;
    let endTime: Date;

    if (isCompleted) {
      // Completed tasks technically happened before the current anchor block
      // We show them as ending at the anchor point relative to their duration
      endTime = new Date(cumulativeTime.getTime());
      startTime = new Date(endTime.getTime() - duration * 60000);
      // DO NOT advance cumulativeTime for the rest of the schedule
    } else {
      startTime = new Date(cumulativeTime.getTime());
      endTime = new Date(startTime.getTime() + duration * 60000);
      cumulativeTime = endTime; // Advance for the next uncompleted task
    }
    
    const timeSlotStr = `${formatTime(startTime)} – ${formatTime(endTime)}`;

    return {
      ...task,
      id: taskId,
      eventId: event.id,
      eventName: event.name,
      isCompleted,
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      timeSlot: timeSlotStr,
      generatedAt: event.plan.generatedAt,
    };
  });
};
