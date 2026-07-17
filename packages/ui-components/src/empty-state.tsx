import { type FC, type ReactNode } from 'react';
import styles from './empty-state.module.css';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState: FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className={styles.container}>
      {icon && (
        <div className={styles.icon_well}>
          {icon}
        </div>
      )}
      <h3 className={styles.title}>
        {title}
      </h3>
      {description && (
        <p className={`${styles.description} ${action ? styles.description_with_action : ''}`}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
};

