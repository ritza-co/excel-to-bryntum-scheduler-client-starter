import {
  Scheduler,
  RecurringTimeSpan,
  TimeSpan,
  RecurringTimeSpansMixin,
  Store,
} from "@bryntum/scheduler";
import "@bryntum/scheduler/scheduler.stockholm.css";
import "./style.css";
import Resource from "./lib/Resource.js";

class MyTimeRange extends RecurringTimeSpan(TimeSpan) {}

class MyTimeRangeStore extends RecurringTimeSpansMixin(Store) {
  static get defaultConfig() {
    return {
      modelClass: MyTimeRange,
      storeId: "timeRanges",
    };
  }
}

function getDaysInMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Create a Date object for the first day of the next month
  const nextMonthFirstDay = new Date(year, month + 1, 1);

  // Subtract one day to get the last day of the current month
  nextMonthFirstDay.setDate(nextMonthFirstDay.getDate() - 1);

  return nextMonthFirstDay.getDate();
}

const myTimeRangeStore = new MyTimeRangeStore();

const schedulerStartDate = new Date(2024, 9, 1);
const schedulerEndDate = new Date(2024, 10, 1);

const scheduler = new Scheduler({
  appendTo: document.body,
  startDate: schedulerStartDate,
  endDate: schedulerEndDate,
  viewPreset: "weekAndDayLetter",
  allowOverlap: false,
  zoomOnTimeAxisDoubleClick: false,
  zoomOnMouseWheel: false,
  features: {
    resourceTimeRanges: {
      // Enable the resource time range elements to be reachable in the DOM (to show tooltips etc.)
      enableMouseEvents: false,
    },
    timeRanges: {
      showCurrentTimeLine: false,
      showHeaderElements: false,
    },
    eventDrag: {
      validatorFn({ newResource, startDate, endDate }) {
        const eventStart = new Date(startDate).getTime();
        const eventEnd = new Date(endDate).getTime();
        const name = newResource.name;
        const resourceId = newResource.id;
        const timeRanges = scheduler.resourceTimeRangeStore
          .getRange()
          .map((item) => item.data);

        let isValid = true;

        // Loop through each time range to check for overlaps
        for (const timeRange of timeRanges) {
          const timeRangeStart = new Date(timeRange.startDate).getTime();
          const timeRangeEnd = new Date(timeRange.endDate).getTime();
          const timeRangeResourceId = timeRange.resourceId;

          if (resourceId === timeRangeResourceId) {
            if (
              (eventStart > timeRangeStart && eventStart < timeRangeEnd) ||
              (eventEnd > timeRangeStart && eventEnd < timeRangeEnd) ||
              (eventStart < timeRangeStart && eventEnd > timeRangeEnd) ||
              (eventStart === timeRangeStart && eventEnd === timeRangeEnd) ||
              (eventStart === timeRangeStart && eventEnd > timeRangeEnd) ||
              (eventEnd === timeRangeEnd && eventStart < timeRangeStart)
            ) {
              isValid = false;
              break;
            }
          }
        }

        return {
          valid: isValid,
          message: !isValid ? `${name} is not available` : "",
        };
      },
    },
  },
  onDataChange() {
    const totalDaysInMonth = getDaysInMonth(schedulerStartDate);
    // Initialize available days for each resource
    const availableDays = {};
    const resourceStore = scheduler.store.resourceStore
      .getRange()
      .map((item) => item.data);
    resourceStore.forEach((resource) => {
      availableDays[resource.id] = totalDaysInMonth;
    });

    // Calculate days occupied by events
    const eventStore = scheduler.store.eventStore
      .getRange()
      .map((item) => item.data);
    eventStore.forEach((event) => {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      const daysOccupied = (endDate - startDate) / (1000 * 60 * 60 * 24);
      availableDays[event.resourceId] -= daysOccupied;
    });

    // Calculate days occupied by resource time ranges with empty name - unavailable days
    const resourceTimeRangeStore = scheduler.store.timeRangesStore
      .getRange()
      .map((item) => item.data);
    resourceTimeRangeStore.forEach((timeRange) => {
      const startDate = new Date(timeRange.startDate);
      const endDate = new Date(timeRange.endDate);
      const daysOccupied = (endDate - startDate) / (1000 * 60 * 60 * 24);
      availableDays[timeRange.resourceId] -= daysOccupied;
    });

    // Calculate the available days for each resource
    Object.keys(availableDays).forEach((resourceId) => {
      if (availableDays[resourceId] < 0) {
        availableDays[resourceId] = 0;
      }

      // Update the resource store
      const resource = scheduler.store.resourceStore.find(
        (record) => record.id === parseInt(resourceId)
      );
      if (resource) {
        resource.set({
          availableDays: availableDays[resourceId],
        });
      }
    });
  },
  project: {
    // use our store for time ranges (crudManager will load it automatically among other project stores)
    timeRangeStore: myTimeRangeStore,
    resourceStore: {
      modelClass: Resource,
    },
  },
  crudManager: {
    autoLoad: true,
    validateResponse: true,
    transport: {
      load: {
        url: "http://localhost:3000/download",
      },
    },
  },
  columns: [
    {
      type: "resourceInfo",
      text: "Workers",
      image: false,
      width: 150,
    },
    {
      text: "Available days",
      field: "availableDays",
      width: 120,
    },
  ],
});
