import React from "react";
import { TaskItemProps } from "../task-item";
import styles from "./project.module.css";

export const Project: React.FC<TaskItemProps> = ({
  task,
  isSelected,
  childTasks,
  overlapTasks,
}) => {
  /* const barColor = isSelected
    ? task.styles.backgroundSelectedColor
    : task.styles.backgroundColor; */
  const getNoCapColor = () => {
    return task.styles.noCapBackgroundColor;
  };
  const getCapColor = () => {
    return task.styles.backgroundSelectedColor;
  };
  const getOverlapColor = () => {
    return task.styles.overlapColor;
  };
  const processColor = isSelected
    ? task.styles.progressSelectedColor
    : task.styles.progressColor;
  const projectWith = task.x2 - task.x1;

  /* const projectLeftTriangle = [
    task.x1,
    task.y + task.height / 2 - 1,
    task.x1,
    task.y + task.height,
    task.x1 + 15,
    task.y + task.height / 2 - 1,
  ].join(",");
  const projectRightTriangle = [
    task.x2,
    task.y + task.height / 2 - 1,
    task.x2,
    task.y + task.height,
    task.x2 - 15,
    task.y + task.height / 2 - 1,
  ].join(","); */

  return (
    <g tabIndex={0} className={styles.projectWrapper}>
      <rect
        fill={getNoCapColor()}
        x={task.x1}
        width={projectWith}
        y={task.y}
        height={task.height}
        rx={0}
        ry={0}
        className={styles.projectBackground}
      />
      {childTasks?.map(it => (
        <React.Fragment key={it.id}>
          <rect
            x={it.xCap1}
            width={it.xCap2 - it.xCap1}
            y={task.y}
            height={task.height}
            ry={0}
            rx={0}
            fill={getCapColor()}
          />
        </React.Fragment>
      ))}
      {overlapTasks
        .filter(it => it.project === task.id)
        .map(it => (
          <React.Fragment key={it.id}>
            <rect
              x={it.x1}
              width={it.x2 - it.x1}
              y={task.y}
              height={task.height}
              ry={0}
              rx={0}
              fill={getOverlapColor()}
            />
          </React.Fragment>
        ))}
      <rect
        x={task.progressX}
        width={task.progressWidth}
        y={task.y}
        height={task.height}
        ry={0}
        rx={0}
        fill={processColor}
      />
      {/* <rect
        fill={barColor}
        x={task.x1}
        width={projectWith}
        y={task.y}
        height={task.height / 2}
        rx={task.barCornerRadius}
        ry={task.barCornerRadius}
        className={styles.projectTop}
      /> */}
      {/* <polygon
        className={styles.projectTop}
        points={projectLeftTriangle}
        fill={barColor}
      />
      <polygon
        className={styles.projectTop}
        points={projectRightTriangle}
        fill={barColor}
      /> */}
    </g>
  );
};
