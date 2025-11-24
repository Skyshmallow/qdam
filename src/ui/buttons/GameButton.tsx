import { useRipple } from '../../hooks/useRipple';
import './GameButton.css';

export interface GameButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  ariaLabel?: string;
  title?: string;
  className?: string;
}

export const GameButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon,
  fullWidth = false,
  ariaLabel,
  title,
  className = '',
}: GameButtonProps) => {
  const { createRipple } = useRipple();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      createRipple(event);
      onClick?.();
    }
  };

  const classes = [
    'game-button',
    `game-button--${variant}`,
    `game-button--${size}`,
    fullWidth && 'game-button--full-width',
    disabled && 'game-button--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title ?? (typeof children === 'string' ? children : undefined)}
      data-variant={variant}
    >
      {icon && <span className="game-button__icon" aria-hidden="true">{icon}</span>}
      <span className="game-button__text">{children}</span>
    </button>
  );
};
