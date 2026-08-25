import SegmentedPicker from "./SegmentedPicker";
import CalendarPicker from "./CalendarPicker";

const timeRangeOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export default function TimeFilters({ filters, onChange, accentColor, onOpenChange }) {
  const { timeRange, selectedMonth, selectedWeek, selectedYear } = filters;

  const handleTimeRangeChange = (value) => {
    const now = new Date();
    const currentWeekIdx = Math.floor((now.getDate() - 1) / 7);
    onChange({
      timeRange: value,
      selectedYear: value === "weekly" ? now.getFullYear() : undefined,
      selectedMonth: value === "weekly" ? now.getMonth() : undefined,
      selectedWeek: value === "weekly" ? currentWeekIdx : undefined,
    });
  };

  const handleSelectMonth = (month, year) => {
    const now = new Date();
    const isCurrentMonth = month === now.getMonth() && (year === now.getFullYear() || !year);
    const defaultWeek = isCurrentMonth ? Math.floor((now.getDate() - 1) / 7) : 0;

    onChange({
      ...filters,
      selectedMonth: month,
      selectedYear: year,
      selectedWeek: filters.selectedWeek !== undefined ? filters.selectedWeek : defaultWeek,
    });
  };

  const handleSelectYear = (year) => {
    onChange({
      ...filters,
      selectedYear: year,
      selectedMonth: undefined,
      selectedWeek: undefined,
    });
  };

  const handleSelectWeek = (week) => {
    onChange({
      ...filters,
      selectedWeek: week,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 relative z-30">
      {/* 1. Mode Selector Dropdown (Weekly / Monthly / Yearly) */}
      <SegmentedPicker
        options={timeRangeOptions}
        value={timeRange}
        onChange={handleTimeRangeChange}
        accentColor={accentColor}
        onOpenStateChange={onOpenChange}
      />

      {/* 2. WEEKLY FLOW */}
      {timeRange === "weekly" && (
        <>
          {/* Month Calendar Picker (shows "Month: July 2026") */}
          <CalendarPicker
            type="month"
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onSelectMonth={handleSelectMonth}
            placeholder="Select Month"
            accentColor={accentColor}
            onOpenStateChange={onOpenChange}
            showLabelPrefix={true}
          />

          {/* Week Picker (active after Month selected) */}
          {selectedMonth !== undefined && (
            <CalendarPicker
              type="week"
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              selectedWeek={selectedWeek}
              onSelectWeek={handleSelectWeek}
              placeholder="Week"
              accentColor={accentColor}
              onOpenStateChange={onOpenChange}
              showLabelPrefix={false}
            />
          )}
        </>
      )}

      {/* 3. MONTHLY FLOW */}
      {timeRange === "monthly" && (
        <>
          {/* Year Picker (shows "Year: 2026") */}
          <CalendarPicker
            type="year"
            selectedYear={selectedYear}
            onSelectYear={handleSelectYear}
            placeholder="Select Year"
            accentColor={accentColor}
            onOpenStateChange={onOpenChange}
            showLabelPrefix={true}
          />

          {/* Month Calendar Picker (shows "Month: July") */}
          {selectedYear && (
            <CalendarPicker
              type="month"
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onSelectMonth={handleSelectMonth}
              placeholder="Select Month"
              accentColor={accentColor}
              onOpenStateChange={onOpenChange}
              showLabelPrefix={true}
            />
          )}

          {/* Week Picker (optional after Month selected) */}
          {selectedYear && selectedMonth !== undefined && (
            <CalendarPicker
              type="week"
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              selectedWeek={selectedWeek}
              onSelectWeek={handleSelectWeek}
              placeholder="Week (opt)"
              accentColor={accentColor}
              onOpenStateChange={onOpenChange}
              showLabelPrefix={false}
            />
          )}
        </>
      )}

      {/* 4. YEARLY FLOW */}
      {timeRange === "yearly" && (
        <>
          {/* Year Picker */}
          <CalendarPicker
            type="year"
            selectedYear={selectedYear}
            onSelectYear={handleSelectYear}
            placeholder="Select Year"
            accentColor={accentColor}
            onOpenStateChange={onOpenChange}
            showLabelPrefix={true}
          />

          {/* Month Calendar Picker (optional after Year selected) */}
          {selectedYear && (
            <CalendarPicker
              type="month"
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onSelectMonth={handleSelectMonth}
              placeholder="Month (opt)"
              accentColor={accentColor}
              onOpenStateChange={onOpenChange}
              showLabelPrefix={true}
            />
          )}

          {/* Week Picker (optional after Month selected) */}
          {selectedYear && selectedMonth !== undefined && (
            <CalendarPicker
              type="week"
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              selectedWeek={selectedWeek}
              onSelectWeek={handleSelectWeek}
              placeholder="Week (opt)"
              accentColor={accentColor}
              onOpenStateChange={onOpenChange}
              showLabelPrefix={false}
            />
          )}
        </>
      )}
    </div>
  );
}
