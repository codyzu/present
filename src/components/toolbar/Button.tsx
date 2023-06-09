import clsx from 'clsx';
import {type MouseEventHandler} from 'react';

export default function Button({
  onClick,
  icon,
  label,
  title,
  disabled,
  border,
  className,
}: {
  onClick: MouseEventHandler<HTMLButtonElement>;
  icon: string;
  label: string;
  title: string;
  disabled?: boolean;
  border?: boolean;
  className?: string;
}) {
  return (
    <button
      disabled={Boolean(disabled)}
      type="button"
      title={title}
      className={clsx(
        'flex flex-col justify-center items-center bg-gray-800 bg-opacity-90',
        border ? 'px-4 py2' : 'px-2 py-1',
        border && 'border-primary shadow-primary',
        disabled
          ? 'text-gray-300'
          : 'text-teal hover:(bg-gray-700) active:(text-white bg-black)',
        className,
      )}
      onClick={onClick}
    >
      <div className={clsx(icon)} />
      <div
        className={clsx(
          'text-xs lt-sm:text-xs',
          disabled ? 'text-gray-300' : 'text-white',
        )}
      >
        {label}
      </div>
    </button>
  );
}
