import type { Component } from '../../core/types';

export type Icon = Component<
  'svg',
  { title?: string },
  | 'fill'
  | 'height'
  | 'viewBox'
  | 'width'
  | 'xmlns'
  | 'stroke'
  | 'strokeLinecap'
  | 'strokeLinejoin'
  | 'strokeWidth'
>;

export const ErrorIcon: Icon = ({ title = 'error icon', ...props }) => {
  return (
    <svg
      {...props}
      fill='currentColor'
      height='24'
      viewBox='0 0 24 24'
      width='24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <title>{title}</title>
      <path
        d='M0 0h24v24H0z'
        fill='none'
        stroke='none'
      />
      <path d='M12 1.67c.955 0 1.845 .467 2.39 1.247l.105 .16l8.114 13.548a2.914 2.914 0 0 1 -2.307 4.363l-.195 .008h-16.225a2.914 2.914 0 0 1 -2.582 -4.2l.099 -.185l8.11 -13.538a2.914 2.914 0 0 1 2.491 -1.403zm.01 13.33l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007zm-.01 -7a1 1 0 0 0 -.993 .883l-.007 .117v4l.007 .117a1 1 0 0 0 1.986 0l.007 -.117v-4l-.007 -.117a1 1 0 0 0 -.993 -.883z' />
    </svg>
  );
};

export const CheckIcon: Icon = ({ title = 'check icon', ...props }) => {
  return (
    <svg
      {...props}
      fill='none'
      height='24'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='3'
      viewBox='0 0 24 24'
      width='24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <title>{title}</title>
      <path
        d='M0 0h24v24H0z'
        fill='none'
        stroke='none'
      />
      <path d='M5 12l5 5l10 -10' />
    </svg>
  );
};

export const ChevronIcon: Icon = ({ title = 'chevron icon', ...props }) => {
  return (
    <svg
      {...props}
      fill='none'
      height='24'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='2'
      viewBox='0 0 24 24'
      width='24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <title>{title}</title>
      <path
        d='M0 0h24v24H0z'
        fill='none'
        stroke='none'
      />
      <path d='M6 9l6 6l6 -6' />
    </svg>
  );
};
