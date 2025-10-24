import { useState, useEffect } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isAfter, isBefore, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';

const AvailabilityCalendar = ({ checkInDate, checkOutDate, onDateSelect, bookedDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const isDateBooked = (date) => {
    return bookedDates.some((bookedRange) => {
      const checkIn = new Date(bookedRange.check_in);
      const checkOut = new Date(bookedRange.check_out);

      return isWithinInterval(date, {
        start: checkIn,
        end: addDays(checkOut, -1), // Checkout day is available
      });
    });
  };

  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today) || isDateBooked(date);
  };

  const isDateSelected = (date) => {
    if (!checkInDate || !checkOutDate) {
      return checkInDate && format(date, 'yyyy-MM-dd') === format(checkInDate, 'yyyy-MM-dd');
    }

    return isWithinInterval(date, {
      start: checkInDate,
      end: addDays(checkOutDate, -1),
    });
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;

    if (!checkInDate || (checkInDate && checkOutDate)) {
      // Start new selection
      onDateSelect(date, null);
    } else {
      // Set checkout date
      if (isAfter(date, checkInDate)) {
        // Check if any dates in between are booked
        const hasBookedDates = bookedDates.some((bookedRange) => {
          const checkIn = new Date(bookedRange.check_in);
          const checkOut = new Date(bookedRange.check_out);

          return (
            (isAfter(checkIn, checkInDate) && isBefore(checkIn, date)) ||
            (isAfter(checkOut, checkInDate) && isBefore(checkOut, date)) ||
            (isBefore(checkIn, checkInDate) && isAfter(checkOut, date))
          );
        });

        if (hasBookedDates) {
          // Reset selection if there are booked dates in between
          onDateSelect(date, null);
        } else {
          onDateSelect(checkInDate, addDays(date, 1));
        }
      } else {
        // If selected date is before check-in, start new selection
        onDateSelect(date, null);
      }
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const getDayClassName = (date) => {
    const baseClass = 'h-12 w-12 flex items-center justify-center rounded-full text-sm cursor-pointer';
    const disabled = isDateDisabled(date);
    const selected = isDateSelected(date);
    const notCurrentMonth = !isSameMonth(date, currentMonth);

    if (disabled) {
      return `${baseClass} bg-gray-100 text-gray-300 cursor-not-allowed line-through`;
    }

    if (selected) {
      return `${baseClass} bg-blue-600 text-white font-semibold`;
    }

    if (notCurrentMonth) {
      return `${baseClass} text-gray-300 hover:bg-gray-100`;
    }

    return `${baseClass} text-gray-900 hover:bg-blue-100`;
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="h-12 flex items-center justify-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date) => (
          <div
            key={date.toString()}
            onClick={() => handleDateClick(date)}
            className={getDayClassName(date)}
          >
            {format(date, 'd')}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
          <span className="text-gray-600">Selected</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
          <span className="text-gray-600 line-through">Booked</span>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
