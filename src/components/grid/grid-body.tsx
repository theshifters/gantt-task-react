import React, { ReactChild, useMemo } from "react";
import { OffDate, Task, ViewMode } from "../../types/public-types";
import { addToDate, getDaysInMonth } from "../../helpers/date-helper";
import styles from "./grid.module.css";

interface TaskWidthParams {
  freeWidth: number;
  toAddTickX: number;
  taskWidth: number;
}

export type GridBodyProps = {
  tasks: Task[];
  dates: Date[];
  svgWidth: number;
  rowHeight: number;
  columnWidth: number;
  todayColor: string;
  wcOverlapColor: string;
  holidayColor: string;
  plannedDownTimeColor: string;
  overtimeColor: string;
  rtl: boolean;
  offDates: OffDate[];
  viewMode: ViewMode;
};
export const GridBody: React.FC<GridBodyProps> = ({
  tasks,
  dates,
  rowHeight,
  svgWidth,
  columnWidth,
  todayColor,
  wcOverlapColor,
  holidayColor,
  plannedDownTimeColor,
  overtimeColor,
  rtl,
  offDates,
  viewMode,
}) => {
  let viewModeFactor = 1;
  switch (viewMode) {
    case ViewMode.Hour:
      viewModeFactor = 24;
      break;
    case ViewMode.QuarterDay:
      viewModeFactor = 4;
      break;
    case ViewMode.HalfDay:
      viewModeFactor = 2;
      break;
    case ViewMode.Day:
      viewModeFactor = 1;
      break;
    case ViewMode.Week:
      viewModeFactor = 1 / 7;
      break;
  }

  const yWcIdMap = useMemo(() => {
    const wcIds = Array.from(new Set(offDates.map(it => it.wcId!!)).values());
    const yWcIdMapTemp: Record<string, { y: number; height: number }> = {};
    let yTemp = 0;

    for (const task of tasks) {
      if (wcIds.some(wcId => `WC${wcId}` === task.id)) {
        const wcId = task.id;
        const tasksInProject = tasks.filter(task => task.project === wcId);
        yWcIdMapTemp[wcId] = {
          y: yTemp,
          height: rowHeight * (tasksInProject.length + 1),
        };
      }

      yTemp += rowHeight;
    }

    return yWcIdMapTemp;
  }, [offDates]);

  let y = 0;
  const gridRows: ReactChild[] = [];
  const rowLines: ReactChild[] = [
    <line
      key="RowLineFirst"
      x="0"
      y1={0}
      x2={svgWidth}
      y2={0}
      className={styles.gridRowLine}
    />,
  ];
  for (const task of tasks) {
    gridRows.push(
      <rect
        key={"Row" + task.id}
        x="0"
        y={y}
        width={svgWidth}
        height={rowHeight}
        className={styles.gridRow}
      />
    );
    rowLines.push(
      <line
        key={"RowLine" + task.id}
        x="0"
        y1={y + rowHeight}
        x2={svgWidth}
        y2={y + rowHeight}
        className={styles.gridRowLine}
      />
    );
    y += rowHeight;
  }

  const now = new Date();
  let tickX = 0;
  const ticks: ReactChild[] = [];
  let today: ReactChild = <rect />;
  const wcOverlapOffDatesRect: ReactChild[] = [];
  const holidayOffDatesRect: ReactChild[] = [];
  const plannedDowntimeOffDatesRect: ReactChild[] = [];
  const overtimeOffDatesRect: ReactChild[] = [];
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    ticks.push(
      <line
        key={date.getTime()}
        x1={tickX}
        y1={0}
        x2={tickX}
        y2={y}
        className={styles.gridTick}
      />
    );
    if (
      (i + 1 !== dates.length &&
        date.getTime() < now.getTime() &&
        dates[i + 1].getTime() >= now.getTime()) ||
      // if current date is last
      (i !== 0 &&
        i + 1 === dates.length &&
        date.getTime() < now.getTime() &&
        addToDate(
          date,
          date.getTime() - dates[i - 1].getTime(),
          "millisecond"
        ).getTime() >= now.getTime())
    ) {
      today = (
        <rect
          x={tickX}
          y={0}
          width={columnWidth}
          height={y}
          fill={todayColor}
        />
      );
    }
    // rtl for today
    if (
      rtl &&
      i + 1 !== dates.length &&
      date.getTime() >= now.getTime() &&
      dates[i + 1].getTime() < now.getTime()
    ) {
      today = (
        <rect
          x={tickX + columnWidth}
          y={0}
          width={columnWidth}
          height={y}
          fill={todayColor}
        />
      );
    }

    // offDates
    const totalMsInOneDay = 86400000;
    const startOfTodayMs = date.getTime();
    const daysInMonth = getDaysInMonth(date.getMonth(), date.getFullYear());
    const columnWidthViewModeFactor =
      viewMode === "Month"
        ? columnWidth * (1 / daysInMonth)
        : columnWidth * viewModeFactor;

    for (let j = 0; j < offDates.length; j++) {
      const offDate = offDates[j];
      const offStartMs = offDate.start.getTime();
      const offEndMs = offDate.end.getTime();
      const taskMs = offEndMs - offStartMs;
      const taskWidth = (taskMs / totalMsInOneDay) * columnWidthViewModeFactor;
      const freeMs = totalMsInOneDay - taskMs;
      const freeWidth = (freeMs / totalMsInOneDay) * columnWidthViewModeFactor;
      const startToOffStartMsInOneDay = offStartMs - startOfTodayMs;
      const toAddTickX =
        (startToOffStartMsInOneDay / totalMsInOneDay) *
        columnWidthViewModeFactor;

      if (!rtl) {
        if (
          viewMode === "Hour" &&
          offDate.type === "overtime" &&
          dates[i].getDate() === dates[0].getDate() &&
          dates[i].getMonth() === dates[0].getMonth() &&
          dates[i].getFullYear() === dates[0].getFullYear()
        ) {
          const firstDateOfGantt = dates[0];
          const countDateSameAsFirstDateOfGantt = dates.filter(
            it =>
              it.getDate() === firstDateOfGantt.getDate() &&
              it.getMonth() === firstDateOfGantt.getMonth() &&
              it.getFullYear() === firstDateOfGantt.getFullYear()
          ).length;
          const nextDateOfFirstDateOfGantt =
            dates[countDateSameAsFirstDateOfGantt];

          if (
            firstDateOfGantt.getTime() <= offDate.end.getTime() &&
            offDate.end.getTime() <= nextDateOfFirstDateOfGantt.getTime()
          ) {
            const startOfFirstDateOfGanttMs = firstDateOfGantt.getTime();
            const endOfFirstDateOfGanttMs =
              nextDateOfFirstDateOfGantt.getTime();
            const taskWidthParams = calcTaskWidthParams(
              startOfFirstDateOfGanttMs,
              endOfFirstDateOfGanttMs,
              offDate,
              columnWidth,
              countDateSameAsFirstDateOfGantt,
              totalMsInOneDay,
              columnWidthViewModeFactor
            );

            overtimeOffDatesRect.push(
              <rect
                key={"overtimeTemp" + i + " - " + j}
                x={taskWidthParams.toAddTickX}
                y={yWcIdMap[`WC${offDate.wcId!!}`].y}
                width={
                  columnWidth * countDateSameAsFirstDateOfGantt -
                  taskWidthParams.freeWidth
                }
                height={yWcIdMap[`WC${offDate.wcId!!}`].height}
                fill={overtimeColor}
              />
            );
          }
        }
      } else {
        // rtl
        if (
          viewMode === "Hour" &&
          offDate.type === "overtime" &&
          dates[i].getDate() === dates[dates.length - 1].getDate() &&
          dates[i].getMonth() === dates[dates.length - 1].getMonth() &&
          dates[i].getFullYear() === dates[dates.length - 1].getFullYear()
        ) {
          const firstDateOfGantt = dates[dates.length - 1];
          const countDateSameAsFirstDateOfGantt = dates.filter(
            it =>
              it.getDate() === firstDateOfGantt.getDate() &&
              it.getMonth() === firstDateOfGantt.getMonth() &&
              it.getFullYear() === firstDateOfGantt.getFullYear()
          ).length;
          const nextDateOfFirstDateOfGantt =
            dates[dates.length - 1 - countDateSameAsFirstDateOfGantt];

          if (
            firstDateOfGantt.getTime() <= offDate.end.getTime() &&
            offDate.end.getTime() <= nextDateOfFirstDateOfGantt.getTime()
          ) {
            const startOfFirstDateOfGanttMs = firstDateOfGantt.getTime();
            const endOfFirstDateOfGanttMs =
              nextDateOfFirstDateOfGantt.getTime();
            const taskWidthParams = calcTaskWidthParams(
              startOfFirstDateOfGanttMs,
              endOfFirstDateOfGanttMs,
              offDate,
              columnWidth,
              countDateSameAsFirstDateOfGantt,
              totalMsInOneDay,
              columnWidthViewModeFactor
            );

            overtimeOffDatesRect.push(
              <rect
                key={"overtimeTemp" + i + " - " + j}
                x={
                  columnWidth * dates.length -
                  taskWidthParams.toAddTickX -
                  taskWidthParams.taskWidth
                }
                y={yWcIdMap[`WC${offDate.wcId!!}`].y}
                width={
                  columnWidth * countDateSameAsFirstDateOfGantt -
                  taskWidthParams.freeWidth
                }
                height={yWcIdMap[`WC${offDate.wcId!!}`].height}
                fill={overtimeColor}
              />
            );
          }
        }
      }

      if (
        (i + 1 !== dates.length &&
          date.getTime() < offDate.start.getTime() &&
          dates[i + 1].getTime() >= offDate.start.getTime()) ||
        // if current date is last
        (i !== 0 &&
          i + 1 === dates.length &&
          date.getTime() < offDate.start.getTime() &&
          addToDate(
            date,
            date.getTime() - dates[i - 1].getTime(),
            "millisecond"
          ).getTime() >= offDate.start.getTime())
      ) {
        switch (offDate.type) {
          case "holiday":
            holidayOffDatesRect.push(
              <rect
                key={"holiday" + j}
                x={tickX + toAddTickX}
                y={0}
                width={columnWidthViewModeFactor - freeWidth}
                height={y}
                fill={holidayColor}
              />
            );
            break;
          case "overtime":
            overtimeOffDatesRect.push(
              <rect
                key={"overtime" + j}
                x={tickX + toAddTickX}
                y={yWcIdMap[`WC${offDate.wcId!!}`].y}
                width={columnWidthViewModeFactor - freeWidth}
                height={yWcIdMap[`WC${offDate.wcId!!}`].height}
                fill={overtimeColor}
              />
            );
            break;
          case "plannedDownTime":
            plannedDowntimeOffDatesRect.push(
              <rect
                key={"plannedDownTime" + j}
                x={tickX + toAddTickX}
                y={yWcIdMap[`WC${offDate.wcId!!}`].y}
                width={columnWidthViewModeFactor - freeWidth}
                height={yWcIdMap[`WC${offDate.wcId!!}`].height}
                fill={plannedDownTimeColor}
              />
            );
            break;
          case "wcOverlap":
            wcOverlapOffDatesRect.push(
              <rect
                key={"wcOverlap" + j}
                x={tickX + toAddTickX}
                y={yWcIdMap[`WC${offDate.wcId!!}`].y}
                width={columnWidthViewModeFactor - freeWidth}
                height={yWcIdMap[`WC${offDate.wcId!!}`].height}
                fill={wcOverlapColor}
              />
            );
            break;
        }
      }
      // rtl for today
      if (
        rtl &&
        i + 1 !== dates.length &&
        date.getTime() >= offDate.start.getTime() &&
        dates[i + 1].getTime() < offDate.start.getTime()
      ) {
        switch (offDate.type) {
          case "holiday":
            holidayOffDatesRect.push(
              <rect
                key={"holiday" + j}
                x={tickX - toAddTickX + columnWidth - taskWidth}
                y={0}
                width={columnWidthViewModeFactor - freeWidth}
                height={y}
                fill={holidayColor}
              />
            );
            break;
          case "overtime":
            overtimeOffDatesRect.push(
              <rect
                key={"overtime" + j}
                x={tickX - toAddTickX + columnWidth - taskWidth}
                y={yWcIdMap[`WC${offDate.wcId!!}`].y}
                width={columnWidthViewModeFactor - freeWidth}
                height={yWcIdMap[`WC${offDate.wcId!!}`].height}
                fill={overtimeColor}
              />
            );
            break;
          case "plannedDownTime":
            plannedDowntimeOffDatesRect.push(
              <rect
                key={"plannedDownTime" + j}
                x={tickX - toAddTickX + columnWidth - taskWidth}
                y={yWcIdMap[`WC${offDate.wcId!!}`].y}
                width={columnWidthViewModeFactor - freeWidth}
                height={yWcIdMap[`WC${offDate.wcId!!}`].height}
                fill={plannedDownTimeColor}
              />
            );
            break;
          case "wcOverlap":
            wcOverlapOffDatesRect.push(
              <rect
                key={"wcOverlap" + j}
                x={tickX - toAddTickX + columnWidth - taskWidth}
                y={yWcIdMap[`WC${offDate.wcId!!}`].y}
                width={columnWidthViewModeFactor - freeWidth}
                height={yWcIdMap[`WC${offDate.wcId!!}`].height}
                fill={wcOverlapColor}
              />
            );
            break;
        }
      }
    }

    tickX += columnWidth;
  }

  const sortedOffDatesRect = [
    ...overtimeOffDatesRect,
    ...holidayOffDatesRect,
    ...plannedDowntimeOffDatesRect,
    ...wcOverlapOffDatesRect,
  ];

  return (
    <g className="gridBody">
      <g className="rows">{gridRows}</g>
      <g className="rowLines">{rowLines}</g>
      <g className="ticks">{ticks}</g>
      <g className="today">{today}</g>
      <g className="offDates">{sortedOffDatesRect}</g>
    </g>
  );
};

const calcTaskWidthParams = (
  startOfFirstDateOfGanttMs: number,
  endOfFirstDateOfGanttMs: number,
  offDate: OffDate,
  columnWidth: number,
  countDateSameAsFirstDateOfGantt: number,
  totalMsInOneDay: number,
  columnWidthViewModeFactor: number
): TaskWidthParams => {
  const partialDayMs = endOfFirstDateOfGanttMs - startOfFirstDateOfGanttMs;

  const offStartMsTemp = offDate.start.getTime();
  const offEndMsTemp = offDate.end.getTime();
  const taskMsTemp = offEndMsTemp - offStartMsTemp;

  const overflowTaskMsTemp =
    taskMsTemp > partialDayMs ? taskMsTemp - partialDayMs : 0;
  const clippedTaskMsTemp = taskMsTemp - overflowTaskMsTemp;

  const freeMsTemp = partialDayMs - clippedTaskMsTemp;
  const freeWidthTemp =
    (freeMsTemp / partialDayMs) *
    (columnWidth * countDateSameAsFirstDateOfGantt);
  const startToOffStartMsInOneDayTemp =
    offStartMsTemp <= startOfFirstDateOfGanttMs
      ? 0
      : offStartMsTemp - startOfFirstDateOfGanttMs;
  const toAddTickXTemp =
    (startToOffStartMsInOneDayTemp / totalMsInOneDay) *
    columnWidthViewModeFactor;
  const taskWidthTemp =
    (clippedTaskMsTemp / partialDayMs) *
    (columnWidth * countDateSameAsFirstDateOfGantt);

  return {
    freeWidth: freeWidthTemp,
    toAddTickX: toAddTickXTemp,
    taskWidth: taskWidthTemp,
  };
};
